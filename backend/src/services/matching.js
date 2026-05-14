const { db, Timestamp, FieldValue } = require('./firebase');
const { getIo } = require('./socket');
const { haversineKm } = require('../utils/distance');
const { optimizeRelay, generateFallbackMessage } = require('./claude');
const { initiateRefund } = require('./razorpay');

const MATCH_TIMEOUT_MS = 8 * 60 * 1000;
const DEFAULT_RADIUS_KM = 3;
const REASSIGN_RADIUS_KM = 5;
const RELAY_PROXIMITY_KM = 2;

const activeMatchTimers = new Map();

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getIoSafe() {
  try {
    return getIo();
  } catch (error) {
    return null;
  }
}

function emitToParcel(parcelId, eventName, payload) {
  const io = getIoSafe();
  if (!io) {
    return;
  }

  io.to(`parcel:${parcelId}`).emit(eventName, payload);
}

function emitToUser(userId, eventName, payload) {
  const io = getIoSafe();
  if (!io) {
    return;
  }

  io.to(`user:${userId}`).emit(eventName, payload);
}

function clearMatchTimer(parcelId) {
  const timer = activeMatchTimers.get(parcelId);
  if (timer) {
    clearTimeout(timer);
    activeMatchTimers.delete(parcelId);
  }
}

function scheduleMatchTimeout(parcelId, attempt) {
  clearMatchTimer(parcelId);

  const timer = setTimeout(() => {
    handleMatchTimeout(parcelId, attempt).catch((error) => {
      console.error('Match timeout error:', error.message);
    });
  }, MATCH_TIMEOUT_MS);

  activeMatchTimers.set(parcelId, timer);
}

function sortCandidates(candidates) {
  return candidates.sort((a, b) => {
    const trustA = typeof a.trustScore === 'number' ? a.trustScore : 0;
    const trustB = typeof b.trustScore === 'number' ? b.trustScore : 0;

    if (trustB !== trustA) {
      return trustB - trustA;
    }

    return a.distanceKm - b.distanceKm;
  });
}

async function getActiveCarriers() {
  const snapshot = await db.collection('carriers').where('isActive', '==', true).get();
  return snapshot.docs.map((doc) => doc.data()).filter((carrier) => !carrier.activeParcelId);
}

async function findCandidates(parcel, radiusKm = DEFAULT_RADIUS_KM) {
  const carriers = await getActiveCarriers();

  const candidates = carriers
    .map((carrier) => {
      if (
        typeof carrier.currentLat !== 'number' ||
        typeof carrier.currentLng !== 'number' ||
        !Number.isFinite(carrier.currentLat) ||
        !Number.isFinite(carrier.currentLng)
      ) {
        return null;
      }

      const distanceKm = haversineKm(parcel.pickupLat, parcel.pickupLng, carrier.currentLat, carrier.currentLng);
      if (distanceKm > radiusKm) {
        return null;
      }

      return {
        ...carrier,
        distanceKm,
      };
    })
    .filter(Boolean);

  return sortCandidates(candidates).slice(0, 10);
}

function hasCarrierNearDrop(candidates, dropLat, dropLng) {
  return candidates.some((carrier) => {
    if (typeof carrier.destinationLat !== 'number' || typeof carrier.destinationLng !== 'number') {
      return false;
    }

    const destinationDistance = haversineKm(dropLat, dropLng, carrier.destinationLat, carrier.destinationLng);
    return destinationDistance <= RELAY_PROXIMITY_KM;
  });
}

async function fetchCarrier(carrierId) {
  if (!carrierId) {
    return null;
  }

  const carrierDoc = await db.collection('carriers').doc(carrierId).get();
  if (!carrierDoc.exists) {
    return null;
  }

  const carrier = carrierDoc.data();
  if (!carrier || carrier.isActive === false) {
    return null;
  }

  return carrier;
}

async function assignDirectCarrier(parcelRef, parcel, carrier, attempt) {
  const carrierRef = db.collection('carriers').doc(carrier.uid);
  const now = Timestamp.now();

  await db.runTransaction(async (transaction) => {
    const freshParcelDoc = await transaction.get(parcelRef);
    const freshCarrierDoc = await transaction.get(carrierRef);

    if (!freshParcelDoc.exists || !freshCarrierDoc.exists) {
      throw new Error('Parcel or carrier not found');
    }

    const freshParcel = freshParcelDoc.data();
    const freshCarrier = freshCarrierDoc.data();

    if (freshParcel.status !== 'MATCHING') {
      return;
    }

    if (freshCarrier.activeParcelId) {
      throw new Error('Carrier is no longer available');
    }

    transaction.update(parcelRef, {
      status: 'ACCEPTED',
      isRelay: false,
      carrier1Id: carrier.uid,
      carrier1Name: carrier.name || null,
      carrier1Phone: carrier.phone || null,
      carrier1AcceptedAt: now,
      updatedAt: now,
    });

    transaction.update(carrierRef, {
      activeParcelId: parcel.id,
      updatedAt: now,
    });
  });

  emitToParcel(parcel.id, 'parcel:carrier_assigned', {
    carrierName: carrier.name || null,
    estimatedPickupMinutes: Math.max(5, Math.round(carrier.distanceKm * 4)),
    carrierTrustScore: typeof carrier.trustScore === 'number' ? carrier.trustScore : 50,
  });

  emitToUser(carrier.uid, 'parcel:new_job', {
    parcelId: parcel.id,
    itemCategory: parcel.itemCategory,
    urgency: parcel.urgency,
    earning: parcel.carrierEarning,
    pickupAddress: parcel.pickupAddress,
  });

  scheduleMatchTimeout(parcel.id, attempt);

  return {
    mode: 'direct',
    carrierId: carrier.uid,
  };
}

async function assignRelayCarriers(parcelRef, parcel, relayPlan, attempt) {
  const carrier1 = await fetchCarrier(relayPlan.carrier1Id);
  const carrier2 = await fetchCarrier(relayPlan.carrier2Id);

  if (!carrier1 || !carrier2) {
    return null;
  }

  const carrier1Ref = db.collection('carriers').doc(carrier1.uid);
  const carrier2Ref = db.collection('carriers').doc(carrier2.uid);
  const now = Timestamp.now();
  const relayOtp = parcel.relayOtp || generateOTP();

  await db.runTransaction(async (transaction) => {
    const [freshParcelDoc, freshCarrier1Doc, freshCarrier2Doc] = await Promise.all([
      transaction.get(parcelRef),
      transaction.get(carrier1Ref),
      transaction.get(carrier2Ref),
    ]);

    if (!freshParcelDoc.exists || !freshCarrier1Doc.exists || !freshCarrier2Doc.exists) {
      throw new Error('Parcel or carrier not found');
    }

    const freshParcel = freshParcelDoc.data();
    const freshCarrier1 = freshCarrier1Doc.data();
    const freshCarrier2 = freshCarrier2Doc.data();

    if (freshParcel.status !== 'MATCHING') {
      return;
    }

    if (freshCarrier1.activeParcelId || freshCarrier2.activeParcelId) {
      throw new Error('One of the relay carriers is no longer available');
    }

    transaction.update(parcelRef, {
      status: 'ACCEPTED',
      isRelay: true,
      relayPointLat: relayPlan.relayPointLat,
      relayPointLng: relayPlan.relayPointLng,
      relayPointAddress: relayPlan.relayPointDescription || parcel.relayPointAddress || null,
      relayOtp,
      carrier1Id: carrier1.uid,
      carrier1Name: carrier1.name || null,
      carrier1Phone: carrier1.phone || null,
      carrier1AcceptedAt: now,
      carrier2Id: carrier2.uid,
      carrier2Name: carrier2.name || null,
      carrier2Phone: carrier2.phone || null,
      carrier2AcceptedAt: now,
      updatedAt: now,
    });

    transaction.update(carrier1Ref, {
      activeParcelId: parcel.id,
      updatedAt: now,
    });

    transaction.update(carrier2Ref, {
      activeParcelId: parcel.id,
      updatedAt: now,
    });
  });

  emitToParcel(parcel.id, 'parcel:carrier_assigned', {
    carrierName: carrier1.name || null,
    estimatedPickupMinutes: Math.max(5, Math.round(carrier1.distanceKm * 4)),
    carrierTrustScore: typeof carrier1.trustScore === 'number' ? carrier1.trustScore : 50,
  });

  emitToUser(carrier1.uid, 'parcel:new_job', {
    parcelId: parcel.id,
    itemCategory: parcel.itemCategory,
    urgency: parcel.urgency,
    earning: parcel.carrierEarning,
    pickupAddress: parcel.pickupAddress,
  });

  emitToUser(carrier2.uid, 'parcel:new_job', {
    parcelId: parcel.id,
    itemCategory: parcel.itemCategory,
    urgency: parcel.urgency,
    earning: parcel.carrierEarning,
    pickupAddress: parcel.pickupAddress,
  });

  scheduleMatchTimeout(parcel.id, attempt);

  return {
    mode: 'relay',
    carrier1Id: carrier1.uid,
    carrier2Id: carrier2.uid,
  };
}

async function failNoCarrier(parcelRef, parcel) {
  clearMatchTimer(parcel.id);

  const fallbackMessage = await generateFallbackMessage(parcel);
  let refundResult = null;

  if (parcel.paymentId && parcel.paymentStatus === 'PAID') {
    refundResult = await initiateRefund(parcel.paymentId, parcel.price, 'No carrier found after retry');
  }

  await parcelRef.update({
    status: 'FAILED',
    paymentStatus: refundResult ? 'REFUNDED' : parcel.paymentStatus,
    updatedAt: Timestamp.now(),
  });

  emitToUser(parcel.senderId, 'parcel:no_carrier_found', {
    message: fallbackMessage,
    refundInitiated: Boolean(refundResult),
  });

  return {
    failed: true,
    refundInitiated: Boolean(refundResult),
  };
}

async function handleMatchTimeout(parcelId, attempt) {
  const parcelRef = db.collection('parcels').doc(parcelId);
  const parcelDoc = await parcelRef.get();

  if (!parcelDoc.exists) {
    clearMatchTimer(parcelId);
    return null;
  }

  const parcel = parcelDoc.data();

  if (parcel.status !== 'ACCEPTED') {
    clearMatchTimer(parcelId);
    return null;
  }

  const assignedCarrierId = parcel.carrier1Id;
  if (assignedCarrierId) {
    await db.collection('carriers').doc(assignedCarrierId).set(
      {
        activeParcelId: null,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  }

  if (attempt >= 2) {
    clearMatchTimer(parcelId);
    return failNoCarrier(parcelRef, parcel);
  }

  await parcelRef.update({
    status: 'MATCHING',
    carrier1Id: null,
    carrier1Name: null,
    carrier1Phone: null,
    carrier1AcceptedAt: null,
    updatedAt: Timestamp.now(),
  });

  return matchCarrier(parcelId, { attempt: attempt + 1, radiusKm: REASSIGN_RADIUS_KM });
}

async function matchCarrier(parcelId, options = {}) {
  const parcelRef = db.collection('parcels').doc(parcelId);
  const parcelDoc = await parcelRef.get();

  if (!parcelDoc.exists) {
    throw new Error('Parcel not found');
  }

  const parcel = parcelDoc.data();
  if (parcel.status !== 'MATCHING') {
    return null;
  }

  const attempt = options.attempt || 1;
  const radiusKm = options.radiusKm || DEFAULT_RADIUS_KM;
  const candidates = await findCandidates(parcel, radiusKm);

  if (!candidates.length) {
    if (attempt >= 2) {
      return failNoCarrier(parcelRef, parcel);
    }

    await parcelRef.update({
      status: 'MATCHING',
      updatedAt: Timestamp.now(),
    });

    return matchCarrier(parcelId, { attempt: attempt + 1, radiusKm: REASSIGN_RADIUS_KM });
  }

  const needsRelay =
    parcel.distanceKm > 5 ||
    (parcel.urgency === 'CRITICAL' && !hasCarrierNearDrop(candidates, parcel.dropLat, parcel.dropLng));

  if (needsRelay) {
    try {
      const relayPlan = await optimizeRelay(parcel, candidates);
      if (relayPlan && relayPlan.carrier1Id && relayPlan.carrier2Id) {
        return assignRelayCarriers(parcelRef, parcel, relayPlan, attempt);
      }
    } catch (error) {
      console.error('Relay optimization failed:', error.message);
    }
  }

  const bestCarrier = candidates[0];
  return assignDirectCarrier(parcelRef, parcel, bestCarrier, attempt);
}

module.exports = {
  matchCarrier,
  clearMatchTimer,
  handleMatchTimeout,
};