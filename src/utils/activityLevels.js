/**
 * Helper to determine Crime Activity Level based on case/crime count
 */
export function getActivityLevel(count, maxCount = 100) {
  if (count >= 80 || (maxCount > 0 && count / maxCount >= 0.8)) return 'VERY HIGH';
  if (count >= 50 || (maxCount > 0 && count / maxCount >= 0.5)) return 'HIGH';
  if (count >= 20 || (maxCount > 0 && count / maxCount >= 0.2)) return 'MEDIUM';
  return 'LOW';
}

/**
 * Authentic geographic coordinates for Mumbai police stations and precincts
 */
export const MUMBAI_STATION_COORDINATES = {
  'malad': { lat: 19.1860, lng: 72.8485, region: 'Northern Suburbs' },
  'borivali': { lat: 19.2288, lng: 72.8541, region: 'North Mumbai' },
  'andheri': { lat: 19.1136, lng: 72.8697, region: 'Western Suburbs' },
  'juhu': { lat: 19.0988, lng: 72.8267, region: 'Western Suburbs' },
  'bandra': { lat: 19.0596, lng: 72.8295, region: 'Western Suburbs' },
  'bkc': { lat: 19.0657, lng: 72.8687, region: 'Mumbai Metro Region' },
  'dharavi': { lat: 19.0434, lng: 72.8571, region: 'Central Mumbai' },
  'worli': { lat: 19.0178, lng: 72.8178, region: 'South Central Mumbai' },
  'byculla': { lat: 18.9750, lng: 72.8295, region: 'South Mumbai' },
  'colaba': { lat: 18.9067, lng: 72.8147, region: 'South Mumbai' },
  'kurla': { lat: 19.0726, lng: 72.8845, region: 'Eastern Suburbs' },
  'ghatkopar': { lat: 19.0860, lng: 72.9090, region: 'Eastern Suburbs' },
  'chembur': { lat: 19.0522, lng: 72.8994, region: 'Eastern Suburbs' },
  'dadar': { lat: 19.0178, lng: 72.8420, region: 'South Central Mumbai' },
  'khar': { lat: 19.0680, lng: 72.8360, region: 'Western Suburbs' }
};

export function resolveStationCoordinates(stationName, fallbackLat = 19.0760, fallbackLng = 72.8777) {
  if (!stationName) return { lat: fallbackLat, lng: fallbackLng, region: 'Mumbai Metro Region' };
  const lower = stationName.toLowerCase();
  for (const [key, val] of Object.entries(MUMBAI_STATION_COORDINATES)) {
    if (lower.includes(key)) {
      return val;
    }
  }
  return { lat: fallbackLat, lng: fallbackLng, region: 'Mumbai Metro Region' };
}
