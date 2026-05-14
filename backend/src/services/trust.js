const { db } = require('./firebase');

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

async function updateTrustScore(userId, delta) {
  const userRef = db.collection('users').doc(userId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) return;
    const data = snap.data();
    const current = typeof data.trustScore === 'number' ? data.trustScore : 50;
    const next = clamp(Math.round(current + delta), 0, 100);
    tx.update(userRef, { trustScore: next });

    // Sync to carriers collection doc if exists
    const carrierRef = db.collection('carriers').doc(userId);
    const carrierSnap = await tx.get(carrierRef);
    if (carrierSnap.exists) {
      tx.update(carrierRef, { trustScore: next });
    }
  });
}

async function recalcAvgRating(userId) {
  const ratingsSnap = await db.collection('ratings').where('toUserId', '==', userId).get();
  if (ratingsSnap.empty) {
    await db.collection('users').doc(userId).update({ avgRating: null });
    return null;
  }
  const ratings = ratingsSnap.docs.map((d) => d.data().score);
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const avgRounded = Math.round(avg * 10) / 10;
  await db.collection('users').doc(userId).update({ avgRating: avgRounded });
  // Sync to carriers collection
  const carrierRef = db.collection('carriers').doc(userId);
  const carrierSnap = await carrierRef.get();
  if (carrierSnap.exists) {
    await carrierRef.update({ avgRating: avgRounded });
  }
  return avgRounded;
}

module.exports = {
  updateTrustScore,
  recalcAvgRating,
};
