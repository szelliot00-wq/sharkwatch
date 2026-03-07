/**
 * Returns the integer day of the year (1-365/366).
 */
export function getDayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

/**
 * Returns a deterministic daily seed based on day of year.
 * Useful for selecting daily content without an API call.
 */
export function dailySeed() {
  return getDayOfYear()
}
