const request = require('supertest');
const app = require('../server').app;

// Mock auth middleware to bypass Firebase during tests
jest.mock('../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { uid: 'test-user' };
    return next();
  },
  attachUser: (req, res, next) => {
    // attach basic user fields expected by routes
    req.user = { uid: 'test-user', role: 'sender', name: 'Test User' };
    return next();
  },
  requireRole: (...roles) => (req, res, next) => next(),
}));

// Mock Claude service
jest.mock('../src/services/claude', () => ({
  classifyParcel: jest.fn(async (description) => ({
    itemCategory: 'medicine',
    urgency: 'HIGH',
    estimatedSize: 'small',
    specialHandling: 'fragile',
    shortLabel: 'Urgent medicine',
  })),
  generateETA: jest.fn(async (parcel, lat, lng, stage) => ({ estimatedMinutes: 12, confidence: 'medium' })),
}));

// Mock Firebase DB for parcel lookup
jest.mock('../src/services/firebase', () => {
  const parcel = {
    id: 'parcel123',
    senderId: 'test-user',
    carrier1Id: null,
    carrier2Id: null,
    status: 'PENDING',
    isRelay: false,
    distanceKm: 3.2,
    pickupLat: 15.49,
    pickupLng: 73.82,
    dropLat: 15.50,
    dropLng: 73.84,
  };

  return {
    db: {
      collection: () => ({
        doc: () => ({
          get: async () => ({ exists: true, data: () => parcel }),
        }),
      }),
    },
  };
});

describe('AI routes', () => {
  test('POST /api/ai/classify returns classification', async () => {
    const res = await request(app)
      .post('/api/ai/classify')
      .send({ description: 'Please deliver my urgent insulin to hospital' })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('itemCategory', 'medicine');
    expect(res.body.data).toHaveProperty('urgency', 'HIGH');
  });

  test('POST /api/ai/eta returns ETA for authorized user', async () => {
    const res = await request(app)
      .post('/api/ai/eta')
      .send({ parcelId: 'parcel123', lat: 15.49, lng: 73.82 })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('estimatedMinutes');
    expect(res.body.data).toHaveProperty('confidence');
  });
});
