import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from 'react-leaflet'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CARTO_DARK_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

// ---------------------------------------------------------------------------
// Inner component: auto-fits the map bounds to the polyline on mount
// ---------------------------------------------------------------------------

function BoundsController({ positions }) {
  const map = useMap()

  useEffect(() => {
    if (!positions || positions.length === 0) return

    if (positions.length === 1) {
      map.setView(positions[0], 8, { animate: false })
      return
    }

    // Fit to the full track with some padding
    const bounds = positions.reduce(
      (b, pos) => b.extend(pos),
      // Start with a degenerate bounds at the first point
      window.L
        ? window.L.latLngBounds(positions[0], positions[0])
        : { extend: (b, p) => b } // safety fallback — L is always present via Leaflet
    )

    // Use a dynamic import approach-safe calculation via Leaflet's built-in
    try {
      const L = require('leaflet')
      const lb = L.latLngBounds(positions)
      map.fitBounds(lb, { padding: [16, 16], animate: false, maxZoom: 10 })
    } catch {
      // Fallback: just center on the last point
      map.setView(positions[positions.length - 1], 5, { animate: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run only on mount

  return null
}

// ---------------------------------------------------------------------------
// MiniMap component
// ---------------------------------------------------------------------------

export default function MiniMap({ pings = [] }) {
  // Sort pings chronologically
  const sortedPings = useMemo(
    () => [...pings].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [pings]
  )

  const positions = useMemo(
    () => sortedPings.map((p) => [p.lat, p.lon]),
    [sortedPings]
  )

  const oldestPing = sortedPings[0] ?? null
  const latestPing = sortedPings[sortedPings.length - 1] ?? null
  const hasSinglePing = sortedPings.length === 1
  const hasTrack = sortedPings.length >= 2

  if (sortedPings.length === 0) {
    return (
      <div
        style={{
          height: '200px',
          background: '#050e1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontSize: '13px',
          borderRadius: '6px',
        }}
      >
        No ping data available
      </div>
    )
  }

  return (
    <div style={{ height: '200px', width: '100%', borderRadius: '6px', overflow: 'hidden' }}>
      <MapContainer
        center={positions[positions.length - 1] ?? [20, 0]}
        zoom={4}
        style={{ height: '200px', width: '100%', background: '#050e1a' }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
      >
        <TileLayer
          url={CARTO_DARK_URL}
          crossOrigin=""
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Auto-fit bounds on mount */}
        <BoundsController positions={positions} />

        {/* Track polyline */}
        {hasTrack && (
          <Polyline
            positions={positions}
            pathOptions={{ color: '#f97316', weight: 2, opacity: 0.85 }}
          />
        )}

        {/* Oldest ping — grey marker */}
        {oldestPing && (
          <CircleMarker
            center={[oldestPing.lat, oldestPing.lon]}
            radius={5}
            pathOptions={{
              fillColor: '#9ca3af',
              color: '#6b7280',
              fillOpacity: 0.85,
              weight: 1.5,
            }}
          />
        )}

        {/* Most recent ping — orange marker (rendered last so it sits on top) */}
        {latestPing && !hasSinglePing && (
          <CircleMarker
            center={[latestPing.lat, latestPing.lon]}
            radius={7}
            pathOptions={{
              fillColor: '#f97316',
              color: '#c2410c',
              fillOpacity: 0.95,
              weight: 2,
            }}
          />
        )}

        {/* Single-ping fallback — orange marker only */}
        {hasSinglePing && latestPing && (
          <CircleMarker
            center={[latestPing.lat, latestPing.lon]}
            radius={7}
            pathOptions={{
              fillColor: '#f97316',
              color: '#c2410c',
              fillOpacity: 0.95,
              weight: 2,
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}
