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

const SIZE_MULTIPLIER = {
  small: 1.0,
  medium: 1.2,
  large: 1.5,
};

function calculatePrice({ distanceKm, urgency, itemCategory, estimatedSize, specialHandling }) {
  const urgencyMulti = URGENCY_MULTIPLIER[urgency] || URGENCY_MULTIPLIER.MEDIUM;
  const sizeMulti = SIZE_MULTIPLIER[estimatedSize] || 1.0;
  
  let basePrice = BASE_FARE + distanceKm * PER_KM_RATE * urgencyMulti;
  
  if (itemCategory !== 'medicine') {
    basePrice = basePrice * sizeMulti;
  }
  
  let price = basePrice;

  if (specialHandling === 'fragile' || specialHandling === 'refrigerate') {
    price += 15;
  }

  if (itemCategory === 'medicine') {
    price = price * 0.8; // 20% discount for medicines
    if (urgency === 'CRITICAL') {
      price = Math.min(price, 150);
    }
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
      distanceComponent: roundToNearestFive(distanceKm * PER_KM_RATE * urgencyMulti),
      sizeMultiplier: sizeMulti,
      urgencyMultiplier: urgencyMulti,
      specialHandlingSurcharge: specialHandling === 'fragile' || specialHandling === 'refrigerate' ? 15 : 0,
      medicineDiscount: itemCategory === 'medicine',
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