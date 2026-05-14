const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { verifyToken, attachUser, requireRole } = require('../middleware/auth');
const { db, Timestamp, GeoPoint, FieldValue } = require('../services/firebase');
const { calculatePrice } = require('../utils/pricing');
const { getDistanceAndDuration } = require('../services/maps');
const { createOrder, verifyPayment } = require('../services/razorpay');
const { getIo } = require('../services/socket');
const { matchCarrier, clearMatchTimer } = require('../services/matching');
const { sendSms } = require('../services/twilio');

const router = express.Router();

// Utility: Generate random 4-digit OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Validation rules
const validateEstimate = [
  body('pickupLat').isFloat({ min: -90, max: 90 }).withMessage('Invalid pickup latitude'),
  body('pickupLng').isFloat({ min: -180, max: 180 }).withMessage('Invalid pickup longitude'),
  body('dropLat').isFloat({ min: -90, max: 90 }).withMessage('Invalid drop latitude'),
  body('dropLng').isFloat({ min: -180, max: 180 }).withMessage('Invalid drop longitude'),
  body('urgency').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid urgency'),
  body('itemCategory').isIn(['document', 'medicine', 'electronics', 'food', 'clothing', 'keys', 'other']).withMessage('Invalid item category'),
  body('specialHandling').optional().isString(),
];

const validateParcelCreate = [
  body('description').isString().isLength({ min: 10, max: 500 }).withMessage('Description must be 10–500 characters'),
  body('receiverName').trim().isLength({ min: 2, max: 100 }).withMessage('Invalid receiver name'),
  body('receiverPhone').matches(/^\+91[6-9]\d{9}$/).withMessage('Invalid receiver phone'),
  body('pickupAddress').trim().isLength({ min: 5, max: 200 }).withMessage('Invalid pickup address'),
  body('pickupLat').isFloat({ min: -90, max: 90 }).withMessage('Invalid pickup latitude'),
  body('pickupLng').isFloat({ min: -180, max: 180 }).withMessage('Invalid pickup longitude'),
  body('pickupLandmark').optional().isString().isLength({ max: 100 }),
  body('dropAddress').trim().isLength({ min: 5, max: 200 }).withMessage('Invalid drop address'),
  body('dropLat').isFloat({ min: -90, max: 90 }).withMessage('Invalid drop latitude'),
  body('dropLng').isFloat({ min: -180, max: 180 }).withMessage('Invalid drop longitude'),
  body('dropLandmark').optional().isString().isLength({ max: 100 }),
  body('sealPhotoUrl').optional().isURL().withMessage('Invalid seal photo URL'),
  body('itemCategory').isIn(['document', 'medicine', 'electronics', 'food', 'clothing', 'keys', 'other']),
  body('urgency').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  body('estimatedSize').isIn(['small', 'medium', 'large']),
  body('specialHandling').optional().isString(),
];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return res.status(400).json({
    success: false,
    error: errors.array()[0].msg,
  });
}

// POST /api/parcels/estimate - Public, no auth
router.post('/estimate', validateEstimate, handleValidationErrors, async (req, res) => {
  try {
    const { pickupLat, pickupLng, dropLat, dropLng, urgency, itemCategory, specialHandling } = req.body;

    // Get distance from Google Maps
    const { distanceKm, durationMinutes } = await getDistanceAndDuration(pickupLat, pickupLng, dropLat, dropLng);

    // Calculate pricing
    const priceData = calculatePrice({ distanceKm, urgency, itemCategory, specialHandling });

    return res.json({
      success: true,
      data: {
        distanceKm,
        estimatedMinutes: durationMinutes,
        price: priceData.price,
        platformFee: priceData.platformFee,
        carrierEarning: priceData.carrierEarning,
        breakdown: priceData.breakdown,
      },
    });
  } catch (error) {
    console.error('Estimate error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to calculate estimate',
    });
  }
});

// POST /api/parcels - Create parcel (protected)
router.post(
  '/',
  verifyToken,
  attachUser,
  validateParcelCreate,
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        description,
        receiverName,
        receiverPhone,
        pickupAddress,
        pickupLat,
        pickupLng,
        pickupLandmark,
        dropAddress,
        dropLat,
        dropLng,
        dropLandmark,
        sealPhotoUrl,
        itemCategory,
        urgency,
        estimatedSize,
        specialHandling,
      } = req.body;

      const userId = req.user.uid;

      // Fetch sender details from Firestore
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const sender = userDoc.data();

      // Re-validate distance and pricing on server
      const { distanceKm, durationMinutes } = await getDistanceAndDuration(pickupLat, pickupLng, dropLat, dropLng);
      const priceData = calculatePrice({ distanceKm, urgency, itemCategory, specialHandling });

      // Generate OTPs
      const pickupOtp = generateOTP();
      const deliveryOtp = generateOTP();

      // Create parcel document
      const parcelData = {
        id: null, // Will be set to doc ID
        senderId: userId,
        senderName: sender.name,
        senderPhone: sender.phone,
        receiverName,
        receiverPhone,
        description,
        itemCategory,
        urgency,
        estimatedSize,
        specialHandling: specialHandling || null,
        pickupAddress,
        pickupLat,
        pickupLng,
        pickupLandmark: pickupLandmark || null,
        dropAddress,
        dropLat,
        dropLng,
        dropLandmark: dropLandmark || null,
        distanceKm,
        estimatedMinutes: durationMinutes,
        price: priceData.price,
        platformFee: priceData.platformFee,
        carrierEarning: priceData.carrierEarning,
        sealPhotoUrl: sealPhotoUrl || null,
        status: 'PENDING',
        isRelay: false,
        relayPointLat: null,
        relayPointLng: null,
        relayPointAddress: null,
        carrier1Id: null,
        carrier1Name: null,
        carrier1Phone: null,
        carrier1AcceptedAt: null,
        carrier1PickedUpAt: null,
        carrier1RelayedAt: null,
        carrier2Id: null,
        carrier2Name: null,
        carrier2Phone: null,
        carrier2AcceptedAt: null,
        carrier2PickedUpAt: null,
        pickupOtp,
        relayOtp: null,
        deliveryOtp,
        paymentId: null,
        paymentStatus: 'PENDING',
        deliveredAt: null,
        cancelledAt: null,
        cancelReason: null,
        senderRating: null,
        carrierRating: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Write to Firestore
      const parcelRef = await db.collection('parcels').add(parcelData);
      const parcelId = parcelRef.id;

      // Update parcel doc with its own ID
      await parcelRef.update({ id: parcelId });

      // Create Razorpay order
      const razorpayOrder = await createOrder(priceData.price, parcelId);

      return res.status(201).json({
        success: true,
        data: {
          parcel: { ...parcelData, id: parcelId },
          razorpayOrderId: razorpayOrder.orderId,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        },
      });
    } catch (error) {
      console.error('Parcel creation error:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to create parcel',
      });
    }
  }
);

// POST /api/parcels/:parcelId/confirm-payment - Verify payment and start matching
router.post(
  '/:parcelId/confirm-payment',
  verifyToken,
  attachUser,
  [
    param('parcelId').isString(),
    body('razorpayOrderId').isString(),
    body('razorpayPaymentId').isString(),
    body('razorpaySignature').isString(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { parcelId } = req.params;
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
      const userId = req.user.uid;

      // Fetch parcel
      const parcelRef = db.collection('parcels').doc(parcelId);
      const parcelDoc = await parcelRef.get();

      if (!parcelDoc.exists) {
        return res.status(404).json({ success: false, error: 'Parcel not found' });
      }

      const parcel = parcelDoc.data();

      // Verify sender
      if (parcel.senderId !== userId) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      // Verify payment signature
      const isValid = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (!isValid) {
        return res.status(400).json({ success: false, error: 'Payment verification failed' });
      }

      // Update parcel: mark as paid and start matching
      await parcelRef.update({
        paymentStatus: 'PAID',
        paymentId: razorpayPaymentId,
        status: 'MATCHING',
        updatedAt: Timestamp.now(),
      });

      // Emit socket event to sender
      const io = getIo();
      io.to(`parcel:${parcelId}`).emit('parcel:matching_started', {
        message: 'Finding a carrier...',
      });

      setImmediate(() => {
        matchCarrier(parcelId).catch((err) => console.error('Matching error:', err.message));
      });

      // Send SMS notification for Order Placed
      const smsBody = `Order Placed! Your parcel #${parcelId.slice(-6)} is being matched with a carrier. Track it in the app.`;
      sendSms(parcel.senderPhone, smsBody);
      if (parcel.receiverPhone !== parcel.senderPhone) {
        const receiverSmsBody = `An order has been placed for you! Parcel #${parcelId.slice(-6)} is on its way.`;
        sendSms(parcel.receiverPhone, receiverSmsBody);
      }

      return res.json({
        success: true,
        data: { status: 'MATCHING' },
      });
    } catch (error) {
      console.error('Payment confirmation error:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to confirm payment',
      });
    }
  }
);

// GET /api/parcels/:parcelId - Fetch single parcel (sender or assigned carrier only)
router.get(
  '/:parcelId',
  verifyToken,
  attachUser,
  [param('parcelId').isString()],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { parcelId } = req.params;
      const userId = req.user.uid;

      const parcelDoc = await db.collection('parcels').doc(parcelId).get();

      if (!parcelDoc.exists) {
        return res.status(404).json({ success: false, error: 'Parcel not found' });
      }

      const parcel = parcelDoc.data();

      // Authorization: sender or assigned carrier
      const isAuthorized =
        parcel.senderId === userId || parcel.carrier1Id === userId || parcel.carrier2Id === userId;

      if (!isAuthorized) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      return res.json({
        success: true,
        data: { parcel },
      });
    } catch (error) {
      console.error('Get parcel error:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch parcel',
      });
    }
  }
);

// GET /api/parcels/sender/history - Sender's parcel history
router.get(
  '/sender/history',
  verifyToken,
  attachUser,
  async (req, res) => {
    try {
      const userId = req.user.uid;

      const parcels = await db
        .collection('parcels')
        .where('senderId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const parcelList = parcels.docs.map((doc) => doc.data());

      return res.json({
        success: true,
        data: { parcels: parcelList },
      });
    } catch (error) {
      console.error('Sender history error:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch history',
      });
    }
  }
);

// GET /api/parcels/carrier/history - Carrier's parcel history
router.get(
  '/carrier/history',
  verifyToken,
  attachUser,
  async (req, res) => {
    try {
      const userId = req.user.uid;

      // Fetch parcels where this user is carrier1 or carrier2
      const [carrier1Parcels, carrier2Parcels] = await Promise.all([
        db
          .collection('parcels')
          .where('carrier1Id', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(20)
          .get(),
        db
          .collection('parcels')
          .where('carrier2Id', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(20)
          .get(),
      ]);

      const parcels = [
        ...carrier1Parcels.docs.map((doc) => doc.data()),
        ...carrier2Parcels.docs.map((doc) => doc.data()),
      ].sort((a, b) => b.createdAt - a.createdAt);

      return res.json({
        success: true,
        data: { parcels: parcels.slice(0, 20) },
      });
    } catch (error) {
      console.error('Carrier history error:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch history',
      });
    }
  }
);

// PATCH /api/parcels/:parcelId/cancel - Cancel parcel (sender only, before pickup)
router.patch(
  '/:parcelId/cancel',
  verifyToken,
  attachUser,
  [param('parcelId').isString(), body('reason').trim().isLength({ min: 3, max: 200 })],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { parcelId } = req.params;
      const { reason } = req.body;
      const userId = req.user.uid;

      const parcelRef = db.collection('parcels').doc(parcelId);
      const parcelDoc = await parcelRef.get();

      if (!parcelDoc.exists) {
        return res.status(404).json({ success: false, error: 'Parcel not found' });
      }

      const parcel = parcelDoc.data();

      // Authorization: sender only
      if (parcel.senderId !== userId) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      // Status check: only PENDING or MATCHING
      if (!['PENDING', 'MATCHING'].includes(parcel.status)) {
        return res.status(400).json({
          success: false,
          error: 'Can only cancel parcels in PENDING or MATCHING status',
        });
      }

      // Update parcel
      await parcelRef.update({
        status: 'CANCELLED',
        cancelledAt: Timestamp.now(),
        cancelReason: reason,
        updatedAt: Timestamp.now(),
      });

      clearMatchTimer(parcelId);

      // TODO: Trigger Razorpay refund if payment was made
      if (parcel.paymentStatus === 'PAID') {
        try {
          const { initiateRefund } = require('../services/razorpay');
          await initiateRefund(parcel.paymentId, parcel.price, 'Sender cancelled');
          await parcelRef.update({ paymentStatus: 'REFUNDED' });
        } catch (err) {
          console.error('Refund failed during cancel:', err.message);
        }
      }

      // Emit socket event
      const io = getIo();
      io.to(`parcel:${parcelId}`).emit('parcel:cancelled', { reason });

      return res.json({
        success: true,
        data: { cancelled: true },
      });
    } catch (error) {
      console.error('Cancel parcel error:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to cancel parcel',
      });
    }
  }
);

module.exports = router;