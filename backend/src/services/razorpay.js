const Razorpay = require('razorpay');
const crypto = require('crypto');

let rzp = null;
function getClient() {
  if (rzp) return rzp;
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (key_id && key_secret) {
    rzp = new Razorpay({ key_id, key_secret });
  }
  return rzp;
}

async function createOrder(amount, parcelId) {
  // amount in INR
  const opts = {
    amount: Math.round(amount * 100), // paise
    currency: 'INR',
    receipt: `kk_${parcelId}`,
    notes: { parcelId },
  };

  const client = getClient();
  if (!client) {
    // fallback mock for dev without keys
    return { orderId: `mock_order_${parcelId}`, amount, currency: 'INR', raw: null };
  }
  const order = await client.orders.create(opts);
  return {
    orderId: order.id,
    amount: order.amount / 100,
    currency: order.currency,
    raw: order,
  };
}

function verifyPayment(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`;
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(body)
    .digest('hex');

  return expectedSig === signature;
}

async function initiateRefund(paymentId, amount, reason = 'Refund') {
  // amount in INR (optional)
  const opts = {};
  if (typeof amount === 'number' && amount > 0) {
    opts.amount = Math.round(amount * 100);
  }
  if (reason) opts.notes = { reason };

  const client = getClient();
  if (!client) {
    return { id: `mock_refund_${Date.now()}`, status: 'processed', amount: opts.amount || 0 };
  }
  const res = await client.payments.refund(paymentId, opts);
  return res;
}

function verifyWebhook(rawBody, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(rawBody)
    .digest('hex');

  return expected === signature;
}

module.exports = {
  createOrder,
  verifyPayment,
  initiateRefund,
  verifyWebhook,
};