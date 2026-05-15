const { db, Timestamp, FieldValue } = require('./firebase');
const { getIo } = require('./socket');
const { haversineKm } = require('../utils/distance');
const { optimizeRelay, generateFallbackMessage } = require('./claude');
const { initiateRefund } = require('./razorpay');
const { getTransitRoute, selectOptimalRelayPoints } = require('./maps');

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
  // Fetch and filter in-memory so we tolerate legacy/loose values like "true"/1.
  const snapshot = await db.collection('carriers').get();
  return snapshot.docs
    .map((doc) => ({ uid: doc.id, ...doc.data() }))
    .filter((carrier) => {
      const isActive =
        carrier.isActive === true ||
        carrier.isActive === 'true' ||
        carrier.isActive === 1;
      return carrier.uid && isActive && !carrier.activeParcelId;
    });
}

async function findCandidates(parcel, radiusKm = DEFAULT_RADIUS_KM) {
  const carriers = await getActiveCarriers();

  const candidates = carriers
    .map((carrier) => {
      if (!carrier.uid) {
        return null;
      }
      if (
        !Number.isFinite(Number(carrier.currentLat)) ||
        !Number.isFinite(Number(carrier.currentLng))
      ) {
        return null;
      }

      const currentLat = Number(carrier.currentLat);
      const currentLng = Number(carrier.currentLng);
      const distanceKm = haversineKm(parcel.pickupLat, parcel.pickupLng, currentLat, currentLng);
      if (distanceKm > radiusKm) {
        return null;
      }

      return {
        ...carrier,
        currentLat,
        currentLng,
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

    transaction.set(
      db.collection('users').doc(parcel.senderId),
      {
        activeSearchParcelId: null,
        updatedAt: now,
      },
      { merge: true }
    );

    transaction.update(carrierRef, {
      activeParcelId: parcel.id,
      updatedAt: now,
    });
  });

  emitToParcel(parcel.id, 'parcel:carrier_assigned', {
    carrierName: carrier.name || null,
    estimatedPickupMinutes: Math.max(5, Math.round(carrier.distanceKm * 4)),
    carrierTrustScore: typeof carrier.trustScore === 'number' ? carrier.trustScore : 50,
    pickupOtp: parcel.pickupOtp || null,
  });

  console.log('match: notifying carrier via socket/user topic', carrier.uid, 'parcelId=', parcel.id);
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
      relayRouteType: relayPlan.routeType || 'optimized',
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

    transaction.set(
      db.collection('users').doc(parcel.senderId),
      {
        activeSearchParcelId: null,
        updatedAt: now,
      },
      { merge: true }
    );

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
    isRelay: true,
    relayRouteType: relayPlan.routeType || 'optimized',
    pickupOtp: parcel.pickupOtp || null,
  });

  console.log(
    'relay: assigned via',
    relayPlan.routeType || 'optimized',
    'carriers=',
    carrier1.uid,
    carrier2.uid,
    'point=',
    relayPlan.relayPointDescription
  );

  // Notify carrier1 (pickup to relay point)
  emitToUser(carrier1.uid, 'parcel:new_job', {
    parcelId: parcel.id,
    itemCategory: parcel.itemCategory,
    urgency: parcel.urgency,
    earning: parcel.carrierEarning,
    pickupAddress: parcel.pickupAddress,
    isRelay: true,
    relayType: 'pickup_to_relay',
    relayPointAddress: relayPlan.relayPointDescription,
    relayPointLat: relayPlan.relayPointLat,
    relayPointLng: relayPlan.relayPointLng,
    routeType: relayPlan.routeType || 'optimized',
  });

  // Notify carrier2 (relay point to drop)
  emitToUser(carrier2.uid, 'parcel:new_job', {
    parcelId: parcel.id,
    itemCategory: parcel.itemCategory,
    urgency: parcel.urgency,
    earning: parcel.carrierEarning,
    pickupAddress: relayPlan.relayPointDescription, // Carrier2's pickup is the relay point
    dropAddress: parcel.dropAddress,
    isRelay: true,
    relayType: 'relay_to_drop',
    relayPointAddress: relayPlan.relayPointDescription,
    relayPointLat: relayPlan.relayPointLat,
    relayPointLng: relayPlan.relayPointLng,
    routeType: relayPlan.routeType || 'optimized',
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
    searchingForCarrier: false,
    updatedAt: Timestamp.now(),
  });

  await db.collection('users').doc(parcel.senderId).set(
    {
      activeSearchParcelId: null,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  emitToUser(parcel.senderId, 'parcel:no_carrier_found', {
    message: fallbackMessage,
    refundInitiated: Boolean(refundResult),
  });

  return {
    failed: true,
    refundInitiated: Boolean(refundResult),
  };
}

// Attempt relay matching using Google Maps transit routes or Claude optimization
async function attemptRelayViaBusRoute(parcelRef, parcel) {
  try {
    console.log('relay: attempting bus route relay for parcelId=', parcel.id);

    // Emit relay searching event to sender
    emitToParcel(parcel.id, 'parcel:searching_relay', {
      parcelId: parcel.id,
      message: 'No direct carriers available. Searching for relay delivery options...',
    });

    // Step 1: Try to get transit routes
    const transitRoutes = await getTransitRoute(
      parcel.pickupLat,
      parcel.pickupLng,
      parcel.dropLat,
      parcel.dropLng
    );

    if (transitRoutes && transitRoutes.length > 0) {
      // Step 2: Get all active carriers for relay point selection
      const allActiveCarriers = await db
        .collection('carriers')
        .where('isActive', '==', true)
        .get();
      const carriersData = allActiveCarriers.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));

      // Filter out carriers already assigned
      const availableCarriers = carriersData.filter(
        (carrier) => !carrier.activeParcelId && carrier.currentLat && carrier.currentLng
      );

      if (availableCarriers.length < 2) {
        console.log('relay: not enough carriers for transit relay, falling back to Claude optimization');
      } else {
        // Step 3: Select optimal relay points from transit routes
        const relayPoints = selectOptimalRelayPoints(
          transitRoutes,
          availableCarriers,
          parcel.pickupLat,
          parcel.pickupLng,
          parcel.dropLat,
          parcel.dropLng
        );

        if (relayPoints.length > 0) {
          // Step 4: For first relay point, find best carriers (one near pickup, one near relay point)
          const selectedRelayPoint = relayPoints[0];

          // Find carrier 1 near pickup
          const carrier1 = availableCarriers
            .map((c) => ({
              ...c,
              distanceToPickup: haversineKm(parcel.pickupLat, parcel.pickupLng, c.currentLat, c.currentLng),
            }))
            .filter((c) => c.distanceToPickup <= 5)
            .sort((a, b) => a.distanceToPickup - b.distanceToPickup)[0];

          // Find carrier 2 near relay point
          const carrier2 = availableCarriers
            .filter((c) => c.uid !== carrier1?.uid)
            .map((c) => ({
              ...c,
              distanceToRelay: haversineKm(selectedRelayPoint.lat, selectedRelayPoint.lng, c.currentLat, c.currentLng),
            }))
            .filter((c) => c.distanceToRelay <= 3)
            .sort((a, b) => a.distanceToRelay - b.distanceToRelay)[0];

          if (carrier1 && carrier2) {
            console.log(
              'relay: transit route relay available, carriers=',
              carrier1.uid,
              carrier2.uid,
              'point=',
              selectedRelayPoint.description
            );

            const relayPlan = {
              carrier1Id: carrier1.uid,
              carrier2Id: carrier2.uid,
              relayPointLat: selectedRelayPoint.lat,
              relayPointLng: selectedRelayPoint.lng,
              relayPointDescription: selectedRelayPoint.description,
              routeType: 'transit',
            };

            return { success: true, relayPlan };
          }
        }
      }
    }

    // Step 5: Fallback to Claude optimization
    console.log('relay: transit route failed, attempting Claude optimization');
    const allActiveCarriers = await db.collection('carriers').where('isActive', '==', true).get();
    const availableCarriers = allActiveCarriers.docs
      .map((doc) => ({ uid: doc.id, ...doc.data() }))
      .filter((carrier) => !carrier.activeParcelId && carrier.currentLat && carrier.currentLng);

    if (availableCarriers.length < 2) {
      console.log('relay: not enough carriers for any relay type');
      return { success: false };
    }

    const relayPlan = await optimizeRelay(parcel, availableCarriers);
    if (relayPlan && relayPlan.carrier1Id && relayPlan.carrier2Id) {
      console.log('relay: Claude optimization succeeded, carriers=', relayPlan.carrier1Id, relayPlan.carrier2Id);
      relayPlan.routeType = 'optimized';
      return { success: true, relayPlan };
    }

    return { success: false };
  } catch (error) {
    console.error('relay: attemptRelayViaBusRoute error:', error.message);
    return { success: false };
  }
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
    searchingForCarrier: true,
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
    // Fallback: if active carriers exist but none in default radius, assign the nearest one.
    const allActive = await getActiveCarriers();
    const nearest = allActive
      .map((carrier) => {
        const lat = Number(carrier.currentLat);
        const lng = Number(carrier.currentLng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { ...carrier, currentLat: lat, currentLng: lng, distanceKm: haversineKm(parcel.pickupLat, parcel.pickupLng, lat, lng) };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];

    if (nearest && attempt >= 2) {
      try {
        return await assignDirectCarrier(parcelRef, parcel, nearest, attempt);
      } catch (error) {
        console.warn('matching: nearest fallback assignment failed', nearest.uid, error.message);
      }
    }

    if (attempt >= 2) {
      // Attempt relay matching before failing
      console.log('matching: attempt', attempt, 'failed, trying relay');
      const relayResult = await attemptRelayViaBusRoute(parcelRef, parcel);
      if (relayResult.success && relayResult.relayPlan) {
        return assignRelayCarriers(parcelRef, parcel, relayResult.relayPlan, attempt);
      }
      // Relay also failed, now fail the parcel
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
        relayPlan.routeType = 'optimized';
        return assignRelayCarriers(parcelRef, parcel, relayPlan, attempt);
      }
    } catch (error) {
      console.error('Relay optimization failed:', error.message);
    }
  }

  // Try candidates in order, skipping stale/unavailable ones.
  for (const carrier of candidates) {
    try {
      const result = await assignDirectCarrier(parcelRef, parcel, carrier, attempt);
      if (result) {
        return result;
      }
    } catch (error) {
      console.warn('match: candidate assignment failed', carrier.uid, error.message);
    }
  }

  // If all candidates failed due to race/stale state, retry once with wider radius.
  if (attempt < 2) {
    await parcelRef.update({
      status: 'MATCHING',
      searchingForCarrier: true,
      updatedAt: Timestamp.now(),
    });
    return matchCarrier(parcelId, { attempt: attempt + 1, radiusKm: REASSIGN_RADIUS_KM });
  }

  return failNoCarrier(parcelRef, parcel);
}

module.exports = {
  matchCarrier,
  clearMatchTimer,
  handleMatchTimeout,
};
