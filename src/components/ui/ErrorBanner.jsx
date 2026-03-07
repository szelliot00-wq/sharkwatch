/**
 * ErrorBanner — friendly error display with optional retry button.
 *
 * Props:
 *   message   string   Error message to display
 *   onRetry   function Called when user clicks "Try again" (omit to hide button)
 *   stale     boolean  When true, shows "showing cached data" message instead
 */
export function ErrorBanner({ message, onRetry, stale = false }) {
  return (
    <div
      className="rounded-lg px-4 py-3"
      style={{
        background: '#0d2847',
        borderLeft: '4px solid #f97316',
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <span className="text-base leading-snug flex-shrink-0" aria-hidden="true">
          ⚠️
        </span>
        <span className="text-sm text-slate-300 leading-snug">
          {stale
            ? 'Data may be delayed — showing last known data'
            : message || 'Could not load data'}
        </span>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 ml-6 text-sm text-[#38bdf8] hover:underline focus-visible:underline transition-colors"
          type="button"
        >
          Try again
        </button>
      )}
    </div>
  )
}
