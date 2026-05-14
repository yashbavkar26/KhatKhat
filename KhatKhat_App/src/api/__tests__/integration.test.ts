import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { authService } from '../services/auth';
import { parcelsService } from '../services/parcels';

const server = setupServer(
  http.post('http://localhost:5000/api/auth/register', async ({ request }) => {
    return HttpResponse.json({
      success: true,
      data: {
        user: { uid: '123', name: 'Test Sender', role: 'sender', isActive: true },
      },
    });
  }),
  http.post('http://localhost:5000/api/parcels/estimate', async () => {
    return HttpResponse.json({
      success: true,
      data: {
        price: 50,
        distanceKm: 2.5,
        estimatedMinutes: 15,
      },
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API Integration Tests', () => {
  it('authService.register should return user data', async () => {
    const response = await authService.register({
      name: 'Test Sender',
      role: 'sender',
    });
    
    // Axios response interceptor unwraps .data if used, else it's axios wrapper
    // We assume the interceptor returns response.data
    expect((response as any).success).toBe(true);
    expect((response as any).data.user.name).toBe('Test Sender');
  });

  it('parcelsService.estimate should return price and ETA', async () => {
    const response = await parcelsService.estimate({
      pickupLat: 19.07,
      pickupLng: 72.87,
      dropLat: 19.10,
      dropLng: 72.90,
      urgency: 'LOW',
      itemCategory: 'document'
    });

    expect((response as any).success).toBe(true);
    expect((response as any).data.price).toBe(50);
  });
});
