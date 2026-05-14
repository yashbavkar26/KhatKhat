const express = require('express');
const { body, param } = require('express-validator');
const { verifyToken, attachUser } = require('../middleware/auth');
const { db, Timestamp } = require('../services/firebase');
const { updateTrustScore, recalcAvgRating } = require('../services/trust');

const router = express.Router();

// POST /api/ratings
router.post(
  '/',
  verifyToken,
  attachUser,
  [body('parcelId').isString(), body('score').isInt({ min: 1, max: 5 }), body('comment').optional().isString().isLength({ max: 500 })],
  async (req, res) => {
    try {
      const { parcelId, score, comment } = req.body;
      const userId = req.user.uid;

      const parcelRef = db.collection('parcels').doc(parcelId);
      const parcelSnap = await parcelRef.get();
      if (!parcelSnap.exists) return res.status(404).json({ success: false, error: 'Parcel not found' });
      const parcel = parcelSnap.data();

      if (parcel.status !== 'DELIVERED') return res.status(400).json({ success: false, error: 'Parcel not delivered' });

      // Determine who is rating whom
      let toUserId = null;
      let role = null;
      if (parcel.senderId === userId) {
        // sender rates carrier
        toUserId = parcel.carrier1Id || parcel.carrier2Id;
        role = 'sender_to_carrier';
      } else if (parcel.carrier1Id === userId || parcel.carrier2Id === userId) {
        // carrier rates sender
        toUserId = parcel.senderId;
        role = 'carrier_to_sender';
      } else {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      if (!toUserId) return res.status(400).json({ success: false, error: 'No recipient for rating' });

      const ratingDoc = {
        parcelId,
        fromUserId: userId,
        toUserId,
        role,
        score,
        comment: comment || null,
        createdAt: Timestamp.now(),
      };

      await db.collection('ratings').add(ratingDoc);

      // Recalculate avg rating
      const avg = await recalcAvgRating(toUserId);

      // Apply trust score changes based on rules
      // For carriers receiving ratings from sender:
      // +5 for 5-star, +2 for 4-star, -8 for 1-2 star
      if (role === 'sender_to_carrier') {
        let delta = 0;
        if (score === 5) delta = 5;
        else if (score === 4) delta = 2;
        else if (score <= 2) delta = -8;
        if (delta !== 0) await updateTrustScore(toUserId, delta);
      }

      // For sender ratings by carrier: +2 per successful send handled elsewhere; keep simple: +2 for 5-star
      if (role === 'carrier_to_sender') {
        if (score === 5) await updateTrustScore(toUserId, 2);
      }

      return res.json({ success: true, data: { avgRating: avg } });
    } catch (error) {
      console.error('Post rating error:', error.message);
      return res.status(500).json({ success: false, error: error.message || 'Failed to post rating' });
    }
  }
);

// GET /api/ratings/user/:userId
router.get('/user/:userId', verifyToken, attachUser, [param('userId').isString()], async (req, res) => {
  try {
    const { userId } = req.params;

    const ratingsSnap = await db
      .collection('ratings')
      .where('toUserId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const ratings = ratingsSnap.docs.map((d) => d.data());

    const userSnap = await db.collection('users').doc(userId).get();
    const user = userSnap.exists ? userSnap.data() : null;

    return res.json({ success: true, data: { ratings, avgRating: user ? user.avgRating : null, trustScore: user ? user.trustScore : null } });
  } catch (error) {
    console.error('Get ratings error:', error.message);
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch ratings' });
  }
});

module.exports = router;
