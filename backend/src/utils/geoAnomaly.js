// backend/src/utils/geoAnomaly.js
// Simple geo-spoof / anomaly detection heuristics.

const { recordSecurityEvent } = require('./securityEvents');

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // meters
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // meters
}

function detectAnomaly(prevPoint, currentPoint) {
  if (!prevPoint || !currentPoint) return null;
  const { lat: lat1, lng: lon1, ts: t1 } = prevPoint;
  const { lat: lat2, lng: lon2, ts: t2 } = currentPoint;
  if (!lat1 || !lon1 || !lat2 || !lon2 || !t1 || !t2) return null;
  const dist = haversine(lat1, lon1, lat2, lon2); // meters
  const dtSec = (t2 - t1) / 1000;
  if (dtSec <= 0) return null;
  const speed = dist / dtSec; // m/s
  // Heuristic thresholds
  if (dist > 5000 && speed > 150) {
    const anomaly = { dist, speed, reason: 'improbable_speed' };
    recordSecurityEvent('geo.spoof.suspect', anomaly);
    return anomaly;
  }
  return null;
}

module.exports = { detectAnomaly, haversine };
