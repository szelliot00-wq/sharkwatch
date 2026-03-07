import React, { memo } from 'react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_COLOURS = {
  green: '#4ade80',
  amber: '#fbbf24',
  grey: '#6b7280',
}

function formatDaysAgo(days) {
  if (days === 999) return 'No data'
  if (days === 0) return 'Today!'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

// ---------------------------------------------------------------------------
// StatusDot
// ---------------------------------------------------------------------------

function StatusDot({ status }) {
  const colour = STATUS_COLOURS[status] ?? STATUS_COLOURS.grey
  const isPulsing = status === 'green'

  return (
    <span className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 14, height: 14 }}>
      {isPulsing && (
        <span
          className="absolute inline-flex rounded-full animate-ping opacity-60"
          style={{ width: 14, height: 14, backgroundColor: colour }}
        />
      )}
      <span
        className="relative inline-flex rounded-full"
        style={{ width: 10, height: 10, backgroundColor: colour }}
      />
    </span>
  )
}

// ---------------------------------------------------------------------------
// SharkCard
// ---------------------------------------------------------------------------

export const SharkCard = memo(function SharkCard({ shark, isSelected, onClick, isFavourite, onToggleFavourite, canFavourite }) {
  const {
    name,
    species,
    lengthM,
    weightKg,
    daysSinceLastPing,
    totalPings,
    pingStatus,
    featured,
  } = shark

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left px-3 py-3 rounded-lg transition-colors duration-150 relative',
        'border border-transparent',
        isSelected
          ? 'border-l-4 border-l-[#f97316] bg-[#162f4f]'
          : 'hover:bg-[#0d2847] border-l-4 border-l-transparent',
      ].join(' ')}
      style={{ minHeight: 88 }}
    >
      {/* Favourite star button */}
      {onToggleFavourite && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onToggleFavourite(name) }}
          className="absolute top-2 right-2 text-base leading-none transition-transform hover:scale-125"
          style={{ color: isFavourite ? '#fbbf24' : '#374151', opacity: isFavourite || canFavourite ? 1 : 0.3 }}
          title={isFavourite ? 'Remove from favourites' : canFavourite ? 'Add to favourites' : 'Favourites full (max 5)'}
          aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
        >
          {isFavourite ? '★' : '☆'}
        </button>
      )}

      {/* Featured OCEARCH badge (behind star) */}
      {featured && !onToggleFavourite && (
        <span
          className="absolute top-2 right-2 text-xs font-semibold px-1.5 py-0.5 rounded"
          style={{ background: '#1a4a7a', color: '#f97316' }}
          aria-label="Featured shark"
        >
          ★
        </span>
      )}

      {/* Row 1: status dot + name */}
      <div className="flex items-center gap-2 pr-8">
        <StatusDot status={pingStatus} />
        <span className="font-semibold text-white text-sm leading-tight truncate">
          {name}
        </span>
      </div>

      {/* Row 2: species */}
      <div className="mt-0.5 ml-[22px]">
        <span className="italic text-xs" style={{ color: '#94a3b8' }}>
          {species}
        </span>
      </div>

      {/* Row 3: last ping + total pings */}
      <div className="flex items-center gap-3 mt-1.5 ml-[22px]">
        <span className="text-xs" style={{ color: '#94a3b8' }}>
          <span aria-hidden="true">📍</span>{' '}
          <span className="sr-only">Last ping:</span>
          {formatDaysAgo(daysSinceLastPing)}
        </span>
        <span className="text-xs" style={{ color: '#6b7280' }}>|</span>
        <span className="text-xs" style={{ color: '#94a3b8' }}>
          <span aria-hidden="true">🔢</span>{' '}
          <span className="sr-only">Total pings:</span>
          {totalPings}
        </span>
      </div>

      {/* Row 4: measurements (if available) */}
      {(lengthM || weightKg) && (
        <div className="flex items-center gap-3 mt-1 ml-[22px]">
          {lengthM && (
            <span className="text-xs" style={{ color: '#94a3b8' }}>
              <span aria-hidden="true">📏</span> {lengthM.toFixed(1)}m
            </span>
          )}
          {weightKg && (
            <span className="text-xs" style={{ color: '#94a3b8' }}>
              <span aria-hidden="true">⚖️</span> {weightKg.toLocaleString()}kg
            </span>
          )}
        </div>
      )}
    </button>
  )
})

export default SharkCard
