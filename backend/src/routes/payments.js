const express = require('express');
const { body } = require('express-validator');
const { verifyToken, attachUser } = require('../middleware/auth');
const { db, Timestamp } = require('../services/firebase');
const { createOrder, verifyPayment, initiateRefund, verifyWebhook } = require('../services/razorpay');
const { matchCarrier } = require('../services/matching');
const { getIo } = require('../services/socket');

const router = express.Router();

// POST /api/payments/create-order
router.post('/create-order', verifyToken, attachUser, [body('parcelId').isString()], async (req, res) => {
  try {
    const { parcelId } = req.body;
    const userId = req.user.uid;

    const parcelRef = db.collection('parcels').doc(parcelId);
    const parcelDoc = await parcelRef.get();
    if (!parcelDoc.exists) return res.status(404).json({ success: false, error: 'Parcel not found' });

    const parcel = parcelDoc.data();
    if (parcel.senderId !== userId) return res.status(403).json({ success: false, error: 'Unauthorized' });

    const order = await createOrder(parcel.price, parcelId);

    return res.json({ success: true, data: { orderId: order.orderId, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID } });
  } catch (error) {
    console.error('create-order error:', error.message);
    return res.status(500).json({ success: false, error: error.message || 'Failed to create order' });
  }
});

// POST /api/payments/verify
router.post('/verify', verifyToken, attachUser, [body('parcelId').isString(), body('razorpayOrderId').isString(), body('razorpayPaymentId').isString(), body('razorpaySignature').isString()], async (req, res) => {
  try {
    const { parcelId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const userId = req.user.uid;

    const parcelRef = db.collection('parcels').doc(parcelId);
    const parcelDoc = await parcelRef.get();
    if (!parcelDoc.exists) return res.status(404).json({ success: false, error: 'Parcel not found' });

    const parcel = parcelDoc.data();
    if (parcel.senderId !== userId) return res.status(403).json({ success: false, error: 'Unauthorized' });

    const isValid = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) return res.status(400).json({ success: false, error: 'Payment verification failed' });

    await parcelRef.update({ paymentStatus: 'PAID', paymentId: razorpayPaymentId, status: 'MATCHING', updatedAt: Timestamp.now() });

    // emit socket event
    const io = getIo();
    io.to(`parcel:${parcelId}`).emit('parcel:matching_started', { message: 'Finding a carrier...' });

    setImmediate(() => {
      matchCarrier(parcelId).catch((err) => console.error('Matching error:', err.message));
    });

    return res.json({ success: true, data: { status: 'MATCHING' } });
  } catch (error) {
    console.error('verify payment error:', error.message);
    return res.status(500).json({ success: false, error: error.message || 'Failed to verify payment' });
  }
});

// POST /api/payments/refund
router.post('/refund', verifyToken, attachUser, [body('parcelId').isString(), body('reason').optional().isString()], async (req, res) => {
  try {
    const { parcelId, reason } = req.body;
    const userId = req.user.uid;

    const parcelRef = db.collection('parcels').doc(parcelId);
    const parcelDoc = await parcelRef.get();
    if (!parcelDoc.exists) return res.status(404).json({ success: false, error: 'Parcel not found' });

    const parcel = parcelDoc.data();
    if (parcel.senderId !== userId) return res.status(403).json({ success: false, error: 'Unauthorized' });

    if (!['PENDING', 'MATCHING', 'FAILED'].includes(parcel.status)) {
      return res.status(400).json({ success: false, error: 'Parcel not refundable in current status' });
    }

    if (parcel.paymentStatus !== 'PAID' || !parcel.paymentId) {
      return res.status(400).json({ success: false, error: 'No paid payment to refund' });
    }

    const refundRes = await initiateRefund(parcel.paymentId, parcel.price, reason || 'User requested refund');

    await parcelRef.update({ paymentStatus: 'REFUNDED', updatedAt: Timestamp.now() });

    return res.json({ success: true, data: { refund: refundRes } });
  } catch (error) {
    console.error('refund error:', error.message);
    return res.status(500).json({ success: false, error: error.message || 'Failed to initiate refund' });
  }
});

// POST /api/payments/razorpay-webhook
router.post('/razorpay-webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const bodyStr = req.rawBody && req.rawBody.length ? req.rawBody : JSON.stringify(req.body || {});

    if (!verifyWebhook(bodyStr, signature)) {
      console.warn('Invalid razorpay webhook signature');
      return res.status(400).send('invalid signature');
    }

    const event = JSON.parse(bodyStr);

    // Handle a few events
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;
      // Find parcel by order receipt
      // receipts used 'kk_${parcelId}' in createOrder
      const receipt = payment.notes && payment.notes.parcelId ? payment.notes.parcelId : null;
      if (receipt) {
        const parcelRef = db.collection('parcels').doc(receipt);
        await parcelRef.update({ paymentStatus: 'PAID', paymentId: paymentId, status: 'MATCHING', updatedAt: Timestamp.now() });
        setImmediate(() => matchCarrier(receipt).catch((e) => console.error('Matching error:', e.message)));
      }
    }

    // respond 200 quickly
    return res.status(200).send('ok');
  } catch (error) {
    console.error('webhook handling error:', error.message);
    return res.status(500).send('error');
  }
});

module.exports = router;