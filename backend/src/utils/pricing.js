const BASE_FARE = 30;
const PER_KM_RATE = 8;
const PLATFORM_FEE_PCT = 0.13;

const URGENCY_MULTIPLIER = {
  LOW: 1.0,
  MEDIUM: 1.3,
  HIGH: 1.6,
  CRITICAL: 2.2,
};

function roundToNearestFive(value) {
  return Math.round(value / 5) * 5;
}

function calculatePrice({ distanceKm, urgency, itemCategory, specialHandling }) {
  const multiplier = URGENCY_MULTIPLIER[urgency] || URGENCY_MULTIPLIER.MEDIUM;
  let price = BASE_FARE + distanceKm * PER_KM_RATE * multiplier;

  if (specialHandling === 'fragile' || specialHandling === 'refrigerate') {
    price += 15;
  }

  if (itemCategory === 'medicine' && urgency === 'CRITICAL') {
    price = Math.min(price, 150);
  }

  price = roundToNearestFive(price);
  const platformFee = Math.round(price * PLATFORM_FEE_PCT);
  const carrierEarning = Math.max(price - platformFee, 0);

  return {
    price,
    platformFee,
    carrierEarning,
    breakdown: {
      baseFare: BASE_FARE,
      distanceComponent: roundToNearestFive(distanceKm * PER_KM_RATE * multiplier),
      urgencyMultiplier: multiplier,
      specialHandlingSurcharge: specialHandling === 'fragile' || specialHandling === 'refrigerate' ? 15 : 0,
    },
  };
}

module.exports = {
  BASE_FARE,
  PER_KM_RATE,
  PLATFORM_FEE_PCT,
  URGENCY_MULTIPLIER,
  calculatePrice,
};