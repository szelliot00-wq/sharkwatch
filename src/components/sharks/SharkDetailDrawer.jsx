import React, { useEffect, useRef, useCallback } from 'react'
import { SharkTimeline } from './SharkTimeline'
import MiniMap from '../map/MiniMap'

// ---------------------------------------------------------------------------
// Haversine distance helpers
// ---------------------------------------------------------------------------

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function totalDistance(pings) {
  // pings sorted newest first — reverse for sequential calculation
  const sorted = [...pings].reverse()
  let dist = 0
  for (let i = 1; i < sorted.length; i++) {
    dist += haversine(
      sorted[i - 1].lat,
      sorted[i - 1].lon,
      sorted[i].lat,
      sorted[i].lon
    )
  }
  return dist
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function formatDistance(km) {
  if (!km || km === 0) return '—'
  return km >= 1000
    ? `${(km / 1000).toFixed(1)}k km`
    : `${Math.round(km).toLocaleString()} km`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

function sexLabel(sex) {
  if (!sex) return 'Unknown'
  const s = String(sex).toLowerCase()
  if (s === 'm' || s === 'male') return '♂ Male'
  if (s === 'f' || s === 'female') return '♀ Female'
  return sex
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SkeletonLine({ width = 'full', height = 4 }) {
  return (
    <div
      className={`animate-pulse rounded bg-[#1a4a7a] w-${width} h-${height}`}
    />
  )
}

function SkeletonBlock({ lines = 3 }) {
  const widths = ['full', '5/6', '4/5']
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine key={i} width={widths[i % widths.length]} height={3} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, children, className = '' }) {
  return (
    <section className={`mt-6 ${className}`}>
      {title && (
        <h3
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: '#38bdf8' }}
        >
          {title}
        </h3>
      )}
      {children}
    </section>
  )
}

// ---------------------------------------------------------------------------
// VitalStats row
// ---------------------------------------------------------------------------

function VitalStat({ label, value }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-lg" style={{ background: '#0d2847', border: '1px solid #1a4a7a' }}>
      <span className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#94a3b8' }}>
        {label}
      </span>
      <span className="text-sm font-semibold text-white leading-tight text-center">
        {value || '—'}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SharkDetailDrawer
// ---------------------------------------------------------------------------

export function SharkDetailDrawer({
  shark,
  onClose,
  wikipediaSummary,
  funFacts,
  funFactsLoading,
}) {
  const drawerRef = useRef(null)

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Focus drawer on open for accessibility
  useEffect(() => {
    if (drawerRef.current) drawerRef.current.focus()
  }, [])

  if (!shark) return null

  const {
    name,
    species,
    sex,
    lengthM,
    weightKg,
    tagDate,
    biography,
    totalPings,
    pings = [],
    lastPing,
  } = shark

  const distKm = totalDistance(pings)
  const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(species.replace(/ /g, '_'))}`

  return (
    <div
      ref={drawerRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} shark detail`}
      className="flex flex-col h-full outline-none"
      style={{ background: '#0a1f35' }}
    >
        {/* ----------------------------------------------------------------
            Header
        ---------------------------------------------------------------- */}
        <div
          className="flex-shrink-0 flex items-start justify-between px-5 pt-4 pb-3"
          style={{ borderBottom: '1px solid #1a4a7a' }}
        >
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="text-xl font-bold text-white leading-tight truncate">
              {name}
            </h2>
            <span
              className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
              style={{ background: '#0d2847', border: '1px solid #1a4a7a', color: '#94a3b8' }}
            >
              {species}
            </span>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="
              flex-shrink-0 flex items-center justify-center
              w-8 h-8 rounded-full text-lg font-bold
              transition-colors duration-150
            "
            style={{ color: '#94a3b8', background: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1a4a7a')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            aria-label="Close drawer"
          >
            ×
          </button>
        </div>

        {/* ----------------------------------------------------------------
            Scrollable body
        ---------------------------------------------------------------- */}
        <div
          className="flex-1 overflow-y-auto px-5 pb-8"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a4a7a #0a1f35' }}
        >
          {/* Vital stats */}
          <Section title="Vital Stats">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <VitalStat label="Sex" value={sexLabel(sex)} />
              <VitalStat label="Length" value={lengthM ? `${lengthM.toFixed(1)} m` : null} />
              <VitalStat label="Weight" value={weightKg ? `${weightKg.toLocaleString()} kg` : null} />
              <VitalStat label="First Tagged" value={formatDate(tagDate)} />
              <VitalStat label="Total Pings" value={totalPings?.toLocaleString()} />
              {lastPing?.depth != null && (
                <VitalStat label="Last Depth" value={`${lastPing.depth} m`} />
              )}
            </div>
          </Section>

          {/* Biography */}
          {biography && (
            <Section title="Biography">
              <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>
                {biography}
              </p>
            </Section>
          )}

          {/* Migration map */}
          <Section title="Migration Path">
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #1a4a7a' }}>
              <MiniMap pings={pings} />
            </div>
          </Section>

          {/* Wikipedia species summary */}
          <Section title={`About ${species}`}>
            {wikipediaSummary === undefined || wikipediaSummary === null ? (
              <SkeletonBlock lines={4} />
            ) : wikipediaSummary === '' ? (
              <p className="text-sm" style={{ color: '#6b7280' }}>
                No Wikipedia summary available.
              </p>
            ) : (
              <>
                <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>
                  {wikipediaSummary}
                </p>
                <a
                  href={wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs font-medium transition-colors duration-150"
                  style={{ color: '#38bdf8' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#7dd3fc')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#38bdf8')}
                >
                  Read more on Wikipedia →
                </a>
              </>
            )}
          </Section>

          {/* Fun facts */}
          {(funFactsLoading || funFacts) && (
            <Section title="Did you know?">
              {funFactsLoading ? (
                <SkeletonBlock lines={3} />
              ) : funFacts && funFacts.length > 0 ? (
                <ul className="space-y-2">
                  {funFacts.map((fact, i) => (
                    <li key={i} className="flex gap-2 text-sm" style={{ color: '#cbd5e1' }}>
                      <span className="flex-shrink-0 mt-0.5 font-bold" style={{ color: '#f97316' }}>
                        •
                      </span>
                      <span className="leading-relaxed">{fact}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Section>
          )}

          {/* Ping timeline */}
          <Section title="Activity — Last 90 Days">
            <SharkTimeline pings={pings} />
          </Section>

          {/* Total distance */}
          <Section title="Total Distance Tracked">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold" style={{ color: '#f97316' }}>
                {formatDistance(distKm)}
              </span>
              {distKm > 0 && (
                <span className="text-xs" style={{ color: '#6b7280' }}>
                  across {totalPings} pings
                </span>
              )}
            </div>
          </Section>

          {/* View on map button */}
          {lastPing && (
            <Section>
              <button
                type="button"
                onClick={() => {
                  // Emit a custom event that SharkMap can listen to.
                  // The parent can also intercept this via onClose + state.
                  window.dispatchEvent(
                    new CustomEvent('sharkwatch:focusShark', {
                      detail: { lat: lastPing.lat, lon: lastPing.lon, name },
                    })
                  )
                }}
                className="
                  w-full py-2.5 rounded-lg text-sm font-semibold
                  transition-colors duration-150
                "
                style={{ background: '#f97316', color: '#050e1a' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#ea6c04')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#f97316')}
              >
                View on Map
              </button>
            </Section>
          )}
        </div>
    </div>
  )
}

export default SharkDetailDrawer
