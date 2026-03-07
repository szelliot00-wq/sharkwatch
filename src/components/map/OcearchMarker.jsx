import { memo, useCallback } from 'react'
import { CircleMarker, Popup } from 'react-leaflet'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// ---------------------------------------------------------------------------
// OcearchMarker
// ---------------------------------------------------------------------------

/**
 * Memoised marker component for a single OCEARCH-tracked shark.
 *
 * Props:
 *   ping    — { animalId, lat, lon, date, depth }
 *   animal  — { id, name, species, ... }
 *   onSelect — callback(animal)
 */
const OcearchMarker = memo(function OcearchMarker({ ping, animal, onSelect }) {
  const handleSelectClick = useCallback(
    (e) => {
      e.preventDefault()
      if (onSelect) onSelect(animal)
    },
    [onSelect, animal]
  )

  if (!ping || !animal) return null

  const sharkName = animal.name ?? animal.id ?? 'Unknown Shark'
  const species = animal.species ?? animal.commonName ?? null

  return (
    <CircleMarker
      center={[ping.lat, ping.lon]}
      radius={8}
      pathOptions={{
        fillColor: '#f97316',
        color: '#c2410c',
        fillOpacity: 0.9,
        weight: 1.5,
      }}
      eventHandlers={{
        click: () => {
          // Intentionally left empty — selection is handled via popup button
          // so the user can read details before committing to a selection.
        },
      }}
    >
      <Popup>
        <div style={{ minWidth: '160px', fontFamily: 'system-ui, sans-serif' }}>
          {/* Shark name */}
          <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px', color: '#111827' }}>
            {sharkName}
          </p>

          {/* Species */}
          {species && (
            <p style={{ fontStyle: 'italic', fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
              {species}
            </p>
          )}

          {/* Last ping date */}
          <p style={{ fontSize: '12px', color: '#374151', marginBottom: '2px' }}>
            <span style={{ fontWeight: 600 }}>Last ping:</span> {formatDate(ping.date)}
          </p>

          {/* Depth if present */}
          {ping.depth != null && (
            <p style={{ fontSize: '12px', color: '#374151', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600 }}>Depth:</span> {ping.depth} m
            </p>
          )}

          {/* Select link button */}
          <a
            href="#"
            onClick={handleSelectClick}
            style={{
              display: 'inline-block',
              fontSize: '12px',
              fontWeight: 600,
              color: '#ea580c',
              textDecoration: 'none',
              padding: '4px 8px',
              border: '1px solid #fed7aa',
              borderRadius: '4px',
              background: '#fff7ed',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ffedd5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff7ed'
            }}
          >
            View full history
          </a>
        </div>
      </Popup>
    </CircleMarker>
  )
})

export default OcearchMarker
