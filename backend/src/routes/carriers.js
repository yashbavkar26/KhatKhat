const express = require('express');
const { body, param, validationResult } = require('express-validator');

const { verifyToken, attachUser, requireRole } = require('../middleware/auth');
const { db, Timestamp, FieldValue } = require('../services/firebase');
const { getIo } = require('../services/socket');
const { haversineKm } = require('../utils/distance');
const { clearMatchTimer } = require('../services/matching');

const router = express.Router();

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({ success: false, error: errors.array()[0].msg });
}

function emitToParcel(parcelId, eventName, payload) {
  const io = getIo();
  if (!io) {
    return;
  }

  io.to(`parcel:${parcelId}`).emit(eventName, payload);
}

function normalizeStreet(address) {
  if (typeof address !== 'string') {
    return null;
  }

  const street = address.split(',')[0].trim();
  return street || address.trim();
}

router.post(
  '/parcels/:parcelId/accept',
  verifyToken,
  attachUser,
  requireRole('carrier', 'both'),
  [param('parcelId').isString()],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { parcelId } = req.params;
      const userId = req.user.uid;

      const parcelRef = db.collection('parcels').doc(parcelId);
      const parcelDoc = await parcelRef.get();

      if (!parcelDoc.exists) {
        return res.status(404).json({ success: false, error: 'Parcel not found' });
      }

      const parcel = parcelDoc.data();
      const isAssignedCarrier = parcel.carrier1Id === userId || parcel.carrier2Id === userId;

      if (!isAssignedCarrier) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      if (!['ACCEPTED', 'PICKED_UP', 'IN_RELAY'].includes(parcel.status)) {
        return res.status(400).json({ success: false, error: 'Parcel is not ready for acceptance' });
      }

      const now = Timestamp.now();
      const updates = { updatedAt: now };

      if (parcel.carrier1Id === userId) {
        updates.carrier1AcceptedAt = now;
      }

      if (parcel.carrier2Id === userId) {
        updates.carrier2AcceptedAt = now;
      }

      await parcelRef.update(updates);

      emitToParcel(parcelId, 'parcel:accepted', { acceptedAt: now });

      return res.json({
        success: true,
        data: {
          pickupOtp: parcel.pickupOtp,
          pickupAddress: parcel.pickupAddress,
          senderPhone: parcel.senderPhone,
          sealPhotoUrl: parcel.sealPhotoUrl || null,
          relayOtp: parcel.isRelay && parcel.carrier2Id === userId ? parcel.relayOtp : null,
        },
      });
    } catch (error) {
      console.error('Carrier accept error:', error.message);
      return res.status(500).json({ success: false, error: error.message || 'Failed to accept parcel' });
    }
  }
);

router.post(
  '/parcels/:parcelId/confirm-pickup',
  verifyToken,
  attachUser,
  requireRole('carrier', 'both'),
  [param('parcelId').isString(), body('otp').matches(/^\d{4}$/)],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { parcelId } = req.params;
      const { otp } = req.body;
      const userId = req.user.uid;

      const parcelRef = db.collection('parcels').doc(parcelId);
      const parcelDoc = await parcelRef.get();

      if (!parcelDoc.exists) {
        return res.status(404).json({ success: false, error: 'Parcel not found' });
      }

      const parcel = parcelDoc.data();

      if (parcel.carrier1Id !== userId && parcel.carrier2Id !== userId) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      const expectedOtp = parcel.carrier2Id === userId && parcel.isRelay ? parcel.relayOtp : parcel.pickupOtp;
      if (!expectedOtp || otp !== expectedOtp) {
        return res.status(400).json({ success: false, error: 'Invalid OTP' });
      }

      const now = Timestamp.now();
      const updates = {
        status: 'PICKED_UP',
        updatedAt: now,
      };

      if (parcel.carrier1Id === userId) {
        updates.carrier1PickedUpAt = now;
      }

      if (parcel.carrier2Id === userId) {
        updates.carrier2PickedUpAt = now;
      }

      await parcelRef.update(updates);
      clearMatchTimer(parcelId);

      emitToParcel(parcelId, 'parcel:picked_up', {
        pickedUpAt: now,
        estimatedDeliveryMinutes: parcel.estimatedMinutes,
      });

      return res.json({
        success: true,
        data: {
          dropAddress: parcel.dropAddress,
          receiverPhone: parcel.receiverPhone,
          deliveryOtp: parcel.deliveryOtp,
        },
      });
    } catch (error) {
      console.error('Pickup confirmation error:', error.message);
      return res.status(500).json({ success: false, error: error.message || 'Failed to confirm pickup' });
    }
  }
);

router.post(
  '/parcels/:parcelId/confirm-relay',
  verifyToken,
  attachUser,
  requireRole('carrier', 'both'),
  [param('parcelId').isString(), body('otp').matches(/^\d{4}$/)],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { parcelId } = req.params;
      const { otp } = req.body;
      const userId = req.user.uid;

      const parcelRef = db.collection('parcels').doc(parcelId);
      const parcelDoc = await parcelRef.get();

      if (!parcelDoc.exists) {
        return res.status(404).json({ success: false, error: 'Parcel not found' });
      }

      const parcel = parcelDoc.data();

      if (!parcel.isRelay || parcel.carrier1Id !== userId) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      if (!parcel.relayOtp || otp !== parcel.relayOtp) {
        return res.status(400).json({ success: false, error: 'Invalid relay OTP' });
      }

      await parcelRef.update({
        status: 'IN_RELAY',
        carrier1RelayedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      clearMatchTimer(parcelId);

      if (parcel.carrier1Id) {
        await db.collection('carriers').doc(parcel.carrier1Id).set(
          {
            activeParcelId: null,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );
      }

      emitToParcel(parcelId, 'parcel:in_relay', {
        relayPoint: {
          lat: parcel.relayPointLat,
          lng: parcel.relayPointLng,
          address: parcel.relayPointAddress || null,
        },
        carrier2Name: parcel.carrier2Name || null,
      });

      return res.json({ success: true, data: { success: true } });
    } catch (error) {
      console.error('Relay confirmation error:', error.message);
      return res.status(500).json({ success: false, error: error.message || 'Failed to confirm relay' });
    }
  }
);

router.post(
  '/parcels/:parcelId/confirm-delivery',
  verifyToken,
  attachUser,
  requireRole('carrier', 'both'),
  [param('parcelId').isString(), body('otp').matches(/^\d{4}$/)],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { parcelId } = req.params;
      const { otp } = req.body;
      const userId = req.user.uid;

      const parcelRef = db.collection('parcels').doc(parcelId);
      const parcelDoc = await parcelRef.get();

      if (!parcelDoc.exists) {
        return res.status(404).json({ success: false, error: 'Parcel not found' });
      }

      const parcel = parcelDoc.data();
      const isAssignedCarrier = parcel.carrier1Id === userId || parcel.carrier2Id === userId;

      if (!isAssignedCarrier) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      if (otp !== parcel.deliveryOtp) {
        return res.status(400).json({ success: false, error: 'Invalid OTP' });
      }

      const now = Timestamp.now();

      await parcelRef.update({
        status: 'DELIVERED',
        deliveredAt: now,
        updatedAt: now,
      });

      clearMatchTimer(parcelId);

      const carrierId = parcel.carrier2Id || parcel.carrier1Id;
      if (carrierId) {
        await db.collection('carriers').doc(carrierId).set(
          {
            activeParcelId: null,
            totalDeliveries: FieldValue.increment(1),
            updatedAt: now,
          },
          { merge: true }
        );
      }

      if (parcel.senderId) {
        await db.collection('users').doc(parcel.senderId).set(
          {
            totalSent: FieldValue.increment(1),
            updatedAt: now,
          },
          { merge: true }
        );
      }

      emitToParcel(parcelId, 'parcel:delivered', {
        deliveredAt: now,
      });

      return res.json({
        success: true,
        data: {
          success: true,
          earnings: parcel.carrierEarning,
        },
      });
    } catch (error) {
      console.error('Delivery confirmation error:', error.message);
      return res.status(500).json({ success: false, error: error.message || 'Failed to confirm delivery' });
    }
  }
);

router.get(
  '/jobs/available',
  verifyToken,
  attachUser,
  requireRole('carrier', 'both'),
  async (req, res) => {
    try {
      const carrierDoc = await db.collection('carriers').doc(req.user.uid).get();
      if (!carrierDoc.exists) {
        return res.status(404).json({ success: false, error: 'Carrier profile not found' });
      }

      const carrier = carrierDoc.data();
      if (typeof carrier.currentLat !== 'number' || typeof carrier.currentLng !== 'number') {
        return res.status(400).json({ success: false, error: 'Carrier location is required' });
      }

      const matchingParcels = await db.collection('parcels').where('status', '==', 'MATCHING').get();

      const jobs = matchingParcels.docs
        .map((doc) => doc.data())
        .map((parcel) => ({
          parcel,
          distanceKm: haversineKm(carrier.currentLat, carrier.currentLng, parcel.pickupLat, parcel.pickupLng),
        }))
        .filter(({ distanceKm }) => distanceKm <= 3)
        .sort((a, b) => {
          const urgencyOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          const urgencyDiff = urgencyOrder[a.parcel.urgency] - urgencyOrder[b.parcel.urgency];
          if (urgencyDiff !== 0) {
            return urgencyDiff;
          }

          return a.distanceKm - b.distanceKm;
        })
        .slice(0, 5)
        .map(({ parcel, distanceKm }) => ({
          parcelId: parcel.id,
          itemCategory: parcel.itemCategory,
          urgency: parcel.urgency,
          distanceKm,
          price: parcel.price,
          carrierEarning: parcel.carrierEarning,
          pickupAddress: normalizeStreet(parcel.pickupAddress),
          estimatedMinutes: parcel.estimatedMinutes,
        }));

      return res.json({ success: true, data: { jobs } });
    } catch (error) {
      console.error('Available jobs error:', error.message);
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch jobs' });
    }
  }
);

module.exports = router;