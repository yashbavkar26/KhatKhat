const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function getDistanceAndDuration(pickupLat, pickupLng, dropLat, dropLng) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('GOOGLE_MAPS_API_KEY not configured');
  }

  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
  url.searchParams.append('origins', `${pickupLat},${pickupLng}`);
  url.searchParams.append('destinations', `${dropLat},${dropLng}`);
  url.searchParams.append('key', GOOGLE_MAPS_API_KEY);
  url.searchParams.append('units', 'metric');

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.rows[0].elements[0]) {
      throw new Error(`Google Maps API error: ${data.status}`);
    }

    const element = data.rows[0].elements[0];
    if (element.status !== 'OK') {
      throw new Error(`Route not found: ${element.status}`);
    }

    return {
      distanceKm: element.distance.value / 1000,
      durationMinutes: Math.ceil(element.duration.value / 60),
    };
  } catch (error) {
    console.error('Maps service error:', error.message);
    throw error;
  }
}

module.exports = {
  getDistanceAndDuration,
};