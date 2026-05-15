const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const { haversineKm } = require('../utils/distance');

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

// Helper: Decode Google Maps polyline (encoded path format)
function decodePolyline(encodedPolyline) {
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encodedPolyline.length) {
    let result = 0;
    let shift = 0;
    let byte;

    do {
      byte = encodedPolyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encodedPolyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

// Get transit routes from Google Maps Directions API
async function getTransitRoute(pickupLat, pickupLng, dropLat, dropLng) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('getTransitRoute: GOOGLE_MAPS_API_KEY not configured, returning null');
    return null;
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.append('origin', `${pickupLat},${pickupLng}`);
    url.searchParams.append('destination', `${dropLat},${dropLng}`);
    url.searchParams.append('mode', 'transit');
    url.searchParams.append('alternatives', 'true');
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.warn(`transit: Google Directions API returned ${data.status}, falling back to optimized relay`);
      return null;
    }

    if (!data.routes || data.routes.length === 0) {
      console.warn('transit: No transit routes found, falling back to optimized relay');
      return null;
    }

    // Extract waypoints from all routes
    const allRoutes = [];
    data.routes.forEach((route, routeIdx) => {
      const waypoints = [];
      const polylines = [];

      route.legs.forEach((leg) => {
        // Add start point
        if (leg.start_location) {
          waypoints.push({
            lat: leg.start_location.lat,
            lng: leg.start_location.lng,
            description: leg.start_address,
            type: 'start',
          });
        }

        // Add transit stops
        leg.steps.forEach((step) => {
          if (step.transit_details && step.transit_details.stop_details) {
            const stopDetails = step.transit_details.stop_details;
            waypoints.push({
              lat: stopDetails.location.lat,
              lng: stopDetails.location.lng,
              description: stopDetails.name,
              type: 'transit_stop',
              transitLine: step.transit_details.line.short_name || step.transit_details.line.name,
            });
          }

          // Collect polyline points for detailed route
          if (step.polyline && step.polyline.points) {
            const decodedPoints = decodePolyline(step.polyline.points);
            polylines.push(...decodedPoints);
          }
        });

        // Add end point
        if (leg.end_location) {
          waypoints.push({
            lat: leg.end_location.lat,
            lng: leg.end_location.lng,
            description: leg.end_address,
            type: 'end',
          });
        }
      });

      allRoutes.push({
        waypoints,
        polyline: polylines.length > 0 ? polylines : [],
        duration: route.legs.reduce((sum, leg) => sum + leg.duration.value, 0) / 60,
        distance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000,
      });
    });

    console.log(`transit: extracted ${allRoutes.length} route(s) with ${allRoutes[0]?.waypoints?.length || 0} waypoints`);
    return allRoutes;
  } catch (error) {
    console.error('transit: getTransitRoute error:', error.message);
    return null;
  }
}

// Select optimal relay points from transit routes
function selectOptimalRelayPoints(transitRoutes, activeCarriers, pickupLat, pickupLng, dropLat, dropLng) {
  if (!transitRoutes || transitRoutes.length === 0) {
    return [];
  }

  const MIN_DISTANCE_FROM_PICKUP_KM = 1.0;
  const MAX_DISTANCE_FROM_PICKUP_KM = 8.0;
  const MIN_DISTANCE_FROM_DROP_KM = 1.5;
  const CARRIER_PROXIMITY_KM = 2.0;

  const candidatePoints = [];

  // Extract waypoints from all routes, prioritizing transit stops
  transitRoutes.forEach((route) => {
    route.waypoints
      .filter((wp) => wp.type === 'transit_stop') // Prioritize transit stops
      .forEach((waypoint) => {
        const distFromPickup = haversineKm(pickupLat, pickupLng, waypoint.lat, waypoint.lng);
        const distFromDrop = haversineKm(waypoint.lat, waypoint.lng, dropLat, dropLng);

        // Filter by distance constraints
        if (
          distFromPickup >= MIN_DISTANCE_FROM_PICKUP_KM &&
          distFromPickup <= MAX_DISTANCE_FROM_PICKUP_KM &&
          distFromDrop >= MIN_DISTANCE_FROM_DROP_KM
        ) {
          // Find carriers near this relay point
          const nearbyCarriers = activeCarriers.filter((carrier) => {
            if (!carrier.currentLat || !carrier.currentLng) return false;
            const distToCarrier = haversineKm(waypoint.lat, waypoint.lng, carrier.currentLat, carrier.currentLng);
            return distToCarrier <= CARRIER_PROXIMITY_KM;
          });

          // Only include if at least one carrier nearby
          if (nearbyCarriers.length > 0) {
            candidatePoints.push({
              lat: waypoint.lat,
              lng: waypoint.lng,
              description: waypoint.description,
              transitLine: waypoint.transitLine || null,
              distFromPickup,
              distFromDrop,
              nearbyCarriersCount: nearbyCarriers.length,
              nearbyCarriers,
              score: nearbyCarriers.length * 10 - distFromPickup, // Prefer more carriers, closer to pickup
            });
          }
        }
      });
  });

  // Sort by score and return top 5
  const topPoints = candidatePoints
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ lat, lng, description, transitLine }) => ({
      lat,
      lng,
      description: transitLine ? `${description} (${transitLine})` : description,
    }));

  console.log(`transit: selected ${topPoints.length} optimal relay points`);
  return topPoints;
}

module.exports = {
  getDistanceAndDuration,
  getTransitRoute,
  selectOptimalRelayPoints,
  decodePolyline,
};