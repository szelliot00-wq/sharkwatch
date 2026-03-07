/**
 * StatusDot — coloured dot indicating ping recency.
 *
 * Props:
 *   status  'green' | 'amber' | 'grey'
 *   size    'sm' | 'md' | 'lg'  (default 'md')
 */
export function StatusDot({ status, size = 'md' }) {
  const colours = {
    green: '#4ade80',
    amber: '#fbbf24',
    grey: '#6b7280',
  }

  const sizes = {
    sm: 8,
    md: 10,
    lg: 14,
  }

  const px = sizes[size] ?? 10
  const isGreen = status === 'green'

  return (
    <span
      style={{
        width: px,
        height: px,
        backgroundColor: colours[status] ?? colours.grey,
        borderRadius: '50%',
        display: 'inline-block',
        flexShrink: 0,
      }}
      className={isGreen ? 'animate-pulse' : ''}
      aria-label={`Status: ${status}`}
      role="img"
    />
  )
}
