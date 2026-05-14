const express = require('express');
const crypto = require('crypto');

const { auth, db, FieldValue, GeoPoint } = require('../services/firebase');
const { getIo } = require('../services/socket');
const { verifyToken, attachUser, requireRole } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_ROLES = new Set(['sender', 'carrier', 'both']);
const ALLOWED_ID_TYPES = new Set(['college', 'aadhaar']);

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function sanitizeUser(userDoc) {
  if (!userDoc) {
    return null;
  }

  return {
    uid: userDoc.uid,
    name: userDoc.name,
    phone: userDoc.phone || null,
    role: userDoc.role,
    profilePhoto: userDoc.profilePhoto || null,
    trustScore: userDoc.trustScore,
    verified: userDoc.verified,
    idType: userDoc.idType || null,
    totalDeliveries: userDoc.totalDeliveries,
    totalSent: userDoc.totalSent,
    avgRating: userDoc.avgRating,
    isActive: userDoc.isActive,
    activeParcelId: userDoc.activeParcelId || null,
    fcmToken: userDoc.fcmToken || null,
    createdAt: userDoc.createdAt || null,
    updatedAt: userDoc.updatedAt || null,
  };
}

router.post('/dev/custom-token', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, error: 'Route not found' });
  }

  const expectedDevKey = process.env.DEV_AUTH_KEY;
  if (!expectedDevKey) {
    return res.status(503).json({
      success: false,
      error: 'DEV_AUTH_KEY is not configured',
    });
  }

  const providedDevKey = req.headers['x-dev-key'];
  if (providedDevKey !== expectedDevKey) {
    return res.status(401).json({ success: false, error: 'Invalid dev key' });
  }

  const { uid } = req.body || {};
  if (typeof uid !== 'string' || uid.trim().length < 3) {
    return res.status(400).json({ success: false, error: 'uid must be a string of at least 3 characters' });
  }

  try {
    const customToken = await auth.createCustomToken(uid.trim());
    const webApiKey = process.env.FIREBASE_WEB_API_KEY || 'YOUR_FIREBASE_WEB_API_KEY';

    return res.json({
      success: true,
      data: {
        customToken,
        exchangeUrl: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${webApiKey}`,
      },
    });
  } catch (error) {
    if (error && typeof error.message === 'string' && error.message.includes('default credentials')) {
      return res.status(500).json({
        success: false,
        error:
          'Firebase Admin credentials are missing. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env, then restart the server.',
      });
    }

    throw error;
  }
});

router.post('/register', verifyToken, async (req, res) => {
  const { name, role, fcmToken = null } = req.body;

  if (typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Name must be at least 2 characters long' });
  }

  if (!ALLOWED_ROLES.has(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role' });
  }

  const uid = req.user.uid;
  const userRef = db.collection('users').doc(uid);
  const carrierRef = db.collection('carriers').doc(uid);

  const existingUserDoc = await userRef.get();
  const existingUser = existingUserDoc.exists ? existingUserDoc.data() : null;

  const now = FieldValue.serverTimestamp();
  const baseUserData = {
    uid,
    name: name.trim(),
    phone: req.user.phone || (existingUser && existingUser.phone) || null,
    role,
    fcmToken: typeof fcmToken === 'string' ? fcmToken : null,
    updatedAt: now,
  };

  const createDefaults = {
    profilePhoto: null,
    trustScore: 50,
    verified: false,
    idType: null,
    idHash: null,
    totalDeliveries: 0,
    totalSent: 0,
    avgRating: 0,
    currentLocation: null,
    isActive: false,
    activeParcelId: null,
    createdAt: now,
  };

  await userRef.set(existingUser ? baseUserData : { ...createDefaults, ...baseUserData }, { merge: true });

  if (role === 'carrier' || role === 'both') {
    const carrierSeed = {
      uid,
      name: name.trim(),
      phone: req.user.phone || null,
      trustScore: existingUser && typeof existingUser.trustScore === 'number' ? existingUser.trustScore : 50,
      avgRating: existingUser && typeof existingUser.avgRating === 'number' ? existingUser.avgRating : 0,
      totalDeliveries: existingUser && typeof existingUser.totalDeliveries === 'number' ? existingUser.totalDeliveries : 0,
      currentLat: 0,
      currentLng: 0,
      isActive: existingUser && typeof existingUser.isActive === 'boolean' ? existingUser.isActive : false,
      activeParcelId: existingUser ? existingUser.activeParcelId || null : null,
      destinationLat: null,
      destinationLng: null,
      destinationAddress: null,
      updatedAt: now,
    };

    await carrierRef.set(carrierSeed, { merge: true });
  }

  const freshUserDoc = await userRef.get();

  return res.json({
    success: true,
    data: {
      user: sanitizeUser(freshUserDoc.data()),
    },
  });
});

router.get('/me', verifyToken, attachUser, async (req, res) => {
  return res.json({
    success: true,
    data: {
      user: sanitizeUser(req.user),
    },
  });
});

router.patch('/profile', verifyToken, attachUser, async (req, res) => {
  const { name, profilePhoto, destinationLat, destinationLng, destinationAddress, fcmToken } = req.body;

  const userUpdates = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (typeof name === 'string' && name.trim()) {
    userUpdates.name = name.trim();
  }

  if (profilePhoto === null || typeof profilePhoto === 'string') {
    userUpdates.profilePhoto = profilePhoto;
  }

  if (fcmToken === null || typeof fcmToken === 'string') {
    userUpdates.fcmToken = fcmToken;
  }

  const hasDestinationLat = destinationLat !== undefined;
  const hasDestinationLng = destinationLng !== undefined;
  const hasDestinationAddress = destinationAddress !== undefined;

  const isCarrier = req.user.role === 'carrier' || req.user.role === 'both';
  const carrierUpdates = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (typeof name === 'string' && name.trim()) {
    carrierUpdates.name = name.trim();
  }

  if (hasDestinationLat || hasDestinationLng || hasDestinationAddress) {
    if (!isCarrier) {
      return res.status(403).json({ success: false, error: 'Only carrier profiles can set destination details' });
    }

    if (hasDestinationLat && !isFiniteNumber(destinationLat)) {
      return res.status(400).json({ success: false, error: 'destinationLat must be a valid number' });
    }

    if (hasDestinationLng && !isFiniteNumber(destinationLng)) {
      return res.status(400).json({ success: false, error: 'destinationLng must be a valid number' });
    }

    if (hasDestinationLat) {
      carrierUpdates.destinationLat = destinationLat;
    }

    if (hasDestinationLng) {
      carrierUpdates.destinationLng = destinationLng;
    }

    if (hasDestinationAddress) {
      carrierUpdates.destinationAddress = typeof destinationAddress === 'string' ? destinationAddress.trim() : null;
    }
  }

  await db.collection('users').doc(req.user.uid).set(userUpdates, { merge: true });

  if (isCarrier) {
    await db.collection('carriers').doc(req.user.uid).set(carrierUpdates, { merge: true });
  }

  const updatedDoc = await db.collection('users').doc(req.user.uid).get();

  return res.json({
    success: true,
    data: {
      user: sanitizeUser(updatedDoc.data()),
    },
  });
});

router.post('/verify-id', verifyToken, attachUser, async (req, res) => {
  const { idType, idNumber } = req.body;

  if (!ALLOWED_ID_TYPES.has(idType)) {
    return res.status(400).json({ success: false, error: 'Invalid idType' });
  }

  if (typeof idNumber !== 'string' || idNumber.trim().length < 4) {
    return res.status(400).json({ success: false, error: 'idNumber must be a valid string' });
  }

  const idHash = crypto.createHash('sha256').update(idNumber.trim()).digest('hex');

  await db.collection('users').doc(req.user.uid).set(
    {
      verified: true,
      idType,
      idHash,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return res.json({ success: true, data: { verified: true } });
});

router.post('/carrier/toggle-active', verifyToken, attachUser, requireRole('carrier', 'both'), async (req, res) => {
  const { isActive, lat, lng } = req.body;
  const hasLat = lat !== undefined;
  const hasLng = lng !== undefined;

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ success: false, error: 'isActive must be a boolean' });
  }

  if (hasLat !== hasLng) {
    return res.status(400).json({ success: false, error: 'lat and lng must be provided together' });
  }

  if ((lat !== undefined && !isFiniteNumber(lat)) || (lng !== undefined && !isFiniteNumber(lng))) {
    return res.status(400).json({ success: false, error: 'lat and lng must be valid numbers when provided' });
  }

  const userUpdate = {
    isActive,
    updatedAt: FieldValue.serverTimestamp(),
  };

  const carrierUpdate = {
    isActive,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (isFiniteNumber(lat) && isFiniteNumber(lng)) {
    userUpdate.currentLocation = new GeoPoint(lat, lng);
    carrierUpdate.currentLat = lat;
    carrierUpdate.currentLng = lng;
  }

  await db.collection('users').doc(req.user.uid).set(userUpdate, { merge: true });
  await db.collection('carriers').doc(req.user.uid).set(carrierUpdate, { merge: true });

  const io = getIo();
  if (io) {
    io.to('carriers:active').emit('carrier:status_changed', {
      carrierId: req.user.uid,
      isActive,
    });

    io.to(`user:${req.user.uid}`).emit('carrier:status_changed', {
      carrierId: req.user.uid,
      isActive,
    });
  }

  return res.json({ success: true, data: { updated: true } });
});

router.post('/carrier/update-location', verifyToken, attachUser, requireRole('carrier', 'both'), async (req, res) => {
  const { lat, lng } = req.body;

  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
    return res.status(400).json({ success: false, error: 'lat and lng are required and must be valid numbers' });
  }

  const userRef = db.collection('users').doc(req.user.uid);
  const carrierRef = db.collection('carriers').doc(req.user.uid);

  await Promise.all([
    userRef.set(
      {
        currentLocation: new GeoPoint(lat, lng),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
    carrierRef.set(
      {
        currentLat: lat,
        currentLng: lng,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
  ]);

  const carrierDoc = await carrierRef.get();
  const carrierData = carrierDoc.exists ? carrierDoc.data() : {};

  const io = getIo();
  if (io && carrierData.activeParcelId) {
    io.to(`parcel:${carrierData.activeParcelId}`).emit('carrier:location_update', {
      lat,
      lng,
      carrierId: req.user.uid,
    });
  }

  return res.json({ success: true, data: { updated: true } });
});

module.exports = router;