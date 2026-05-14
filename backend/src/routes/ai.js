const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { verifyToken, attachUser } = require('../middleware/auth');
const { classifyParcel, generateETA } = require('../services/claude');
const { db } = require('../services/firebase');

const router = express.Router();

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({ success: false, error: errors.array()[0].msg });
}

// POST /api/ai/classify
router.post(
  '/classify',
  verifyToken,
  attachUser,
  [body('description').isString().isLength({ min: 5 })],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { description } = req.body;
      const result = await classifyParcel(description);
      return res.json({ success: true, data: result });
    } catch (error) {
      console.error('AI classify error:', error.message);
      return res.status(500).json({ success: false, error: error.message || 'AI error' });
    }
  }
);

// POST /api/ai/eta
router.post(
  '/eta',
  verifyToken,
  attachUser,
  [body('parcelId').isString(), body('lat').isFloat({ min: -90, max: 90 }), body('lng').isFloat({ min: -180, max: 180 })],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { parcelId, lat, lng } = req.body;

      const parcelRef = db.collection('parcels').doc(parcelId);
      const parcelSnap = await parcelRef.get();
      if (!parcelSnap.exists) return res.status(404).json({ success: false, error: 'Parcel not found' });

      const parcel = parcelSnap.data();

      // Authorization: sender or assigned carrier
      const userId = req.user.uid;
      const isAuthorized = parcel.senderId === userId || parcel.carrier1Id === userId || parcel.carrier2Id === userId;
      if (!isAuthorized) return res.status(403).json({ success: false, error: 'Unauthorized' });

      // Determine stage
      let stage = 'to_pickup';
      if (parcel.status === 'PICKED_UP' || parcel.status === 'IN_RELAY') stage = 'to_drop';
      if (parcel.isRelay && parcel.status === 'ACCEPTED') stage = 'to_relay';

      const eta = await generateETA(parcel, Number(lat), Number(lng), stage);
      return res.json({ success: true, data: eta });
    } catch (error) {
      console.error('AI ETA error:', error.message);
      return res.status(500).json({ success: false, error: error.message || 'AI error' });
    }
  }
);

module.exports = router;