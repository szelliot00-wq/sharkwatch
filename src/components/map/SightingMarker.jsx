import { memo } from 'react'
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

/**
 * Extracts the best available photo URL from an iNaturalist observation.
 * iNat photo URLs use size suffixes: square (75px), small (240px), medium (500px).
 * We request "small" for the thumbnail.
 */
function getThumbnailUrl(sighting) {
  const photos = sighting.photos ?? []
  if (photos.length === 0) return null

  const rawUrl = photos[0]?.url
  if (!rawUrl) return null

  // iNat URLs contain a size token like "square", replace with "small"
  return rawUrl.replace('square', 'small')
}

/**
 * Derives lat/lon from an iNaturalist observation's geojson field.
 * geojson: { type: 'Point', coordinates: [lon, lat] }
 */
function getLatLon(sighting) {
  const coords = sighting?.geojson?.coordinates
  if (!coords || coords.length < 2) return null
  return { lat: coords[1], lon: coords[0] }
}

// ---------------------------------------------------------------------------
// SightingMarker
// ---------------------------------------------------------------------------

/**
 * Memoised marker component for a single iNaturalist shark sighting.
 *
 * Props:
 *   sighting — normalised iNat observation:
 *     { id, species_guess, place_guess, observed_on,
 *       geojson: { type, coordinates: [lon, lat] },
 *       photos: [{ url }],
 *       taxon: { name, preferred_common_name } }
 */
const SightingMarker = memo(function SightingMarker({ sighting }) {
  if (!sighting) return null

  const position = getLatLon(sighting)
  if (!position) return null

  const thumbnailUrl = getThumbnailUrl(sighting)

  const speciesName =
    sighting.taxon?.name ?? sighting.species_guess ?? 'Unknown species'
  const commonName =
    sighting.taxon?.preferred_common_name ?? sighting.species_guess ?? null
  const location = sighting.place_guess ?? null
  const dateObserved = formatDate(sighting.observed_on)

  return (
    <CircleMarker
      center={[position.lat, position.lon]}
      radius={6}
      pathOptions={{
        fillColor: '#38bdf8',
        color: '#0284c7',
        fillOpacity: 0.85,
        weight: 1.5,
      }}
    >
      <Popup>
        <div style={{ minWidth: '180px', maxWidth: '220px', fontFamily: 'system-ui, sans-serif' }}>
          {/* Photo thumbnail */}
          {thumbnailUrl && (
            <div style={{ marginBottom: '8px' }}>
              <img
                src={thumbnailUrl}
                alt={speciesName}
                style={{
                  width: '100%',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  display: 'block',
                }}
                onError={(e) => {
                  // Hide broken images gracefully
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}

          {/* Species name */}
          <p style={{ fontWeight: 700, fontSize: '13px', color: '#111827', marginBottom: '2px' }}>
            {speciesName}
          </p>

          {/* Common name */}
          {commonName && commonName.toLowerCase() !== speciesName.toLowerCase() && (
            <p style={{ fontStyle: 'italic', fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
              {commonName}
            </p>
          )}

          {/* Date observed */}
          <p style={{ fontSize: '12px', color: '#374151', marginBottom: '2px' }}>
            <span style={{ fontWeight: 600 }}>Observed:</span> {dateObserved}
          </p>

          {/* Location */}
          {location && (
            <p style={{ fontSize: '12px', color: '#374151', marginBottom: '0' }}>
              <span style={{ fontWeight: 600 }}>Location:</span> {location}
            </p>
          )}
        </div>
      </Popup>
    </CircleMarker>
  )
})

export default SightingMarker
