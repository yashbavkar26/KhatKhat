/**
 * Goa geographic boundary restriction utility.
 * Goa's approximate bounding box:
 *   Latitude:  14.89°N – 15.80°N
 *   Longitude: 73.67°E – 74.32°E
 */

const GOA_BOUNDS = {
  minLat: 14.89,
  maxLat: 15.80,
  minLng: 73.67,
  maxLng: 74.32,
};

/**
 * Returns true if the given coordinates are within Goa.
 * @param {number} lat
 * @param {number} lng
 */
function isInsideGoa(lat, lng) {
  return (
    lat >= GOA_BOUNDS.minLat &&
    lat <= GOA_BOUNDS.maxLat &&
    lng >= GOA_BOUNDS.minLng &&
    lng <= GOA_BOUNDS.maxLng
  );
}

/**
 * Validates that both pickup and drop coordinates are inside Goa.
 * Throws an error with a user-friendly message if not.
 * @param {number} pickupLat
 * @param {number} pickupLng
 * @param {number} dropLat
 * @param {number} dropLng
 */
function requireInsideGoa(pickupLat, pickupLng, dropLat, dropLng) {
  if (!isInsideGoa(pickupLat, pickupLng)) {
    throw new Error('Pickup location must be within Goa. KhatKhat only operates in Goa.');
  }
  if (!isInsideGoa(dropLat, dropLng)) {
    throw new Error('Drop location must be within Goa. KhatKhat only operates in Goa.');
  }
}

module.exports = { GOA_BOUNDS, isInsideGoa, requireInsideGoa };
