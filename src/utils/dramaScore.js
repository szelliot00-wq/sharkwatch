/**
 * Score an Unsplash photo object for visual drama / cinematic quality.
 * Higher score = more dramatic / suitable as a hero image.
 *
 * Scoring:
 *  +3  landscape orientation
 *  +2  high resolution (width >= 4000)
 *  +0-3 crowd quality signal via likes (capped at 3)
 *  -10 blocklisted content in description / alt text
 */
export function dramaScore(photo) {
  let score = 0

  if (photo.width > photo.height) score += 3 // landscape
  if (photo.width >= 4000) score += 2 // high res
  score += Math.min((photo.likes || 0) / 100, 3) // crowd quality signal

  const desc = (
    (photo.description || '') +
    ' ' +
    (photo.alt_description || '')
  ).toLowerCase()

  const blocklist = ['market', 'fishing', 'catch', 'dead', 'trophy', 'fin', 'killed', 'caught']
  if (blocklist.some(w => desc.includes(w))) score -= 10

  return score
}

/**
 * Given an array of Unsplash photos and a day-of-year integer,
 * select a deterministic daily photo from the top 5 most dramatic.
 *
 * @param {Array} photos - Array of Unsplash photo objects
 * @param {number} dayOfYear - Integer day of year (1-365)
 * @returns {object|undefined} Selected photo object
 */
export function selectDailyPhoto(photos, dayOfYear) {
  const top5 = [...photos].sort((a, b) => dramaScore(b) - dramaScore(a)).slice(0, 5)
  return top5[dayOfYear % top5.length] || photos[0]
}
