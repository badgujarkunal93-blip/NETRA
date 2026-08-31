/**
 * Helper to determine Crime Activity Level based on case/crime count
 */
export function getActivityLevel(count, maxCount = 100) {
  if (count >= 80 || (maxCount > 0 && count / maxCount >= 0.8)) return 'VERY HIGH';
  if (count >= 50 || (maxCount > 0 && count / maxCount >= 0.5)) return 'HIGH';
  if (count >= 20 || (maxCount > 0 && count / maxCount >= 0.2)) return 'MEDIUM';
  return 'LOW';
}
