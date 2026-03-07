import { useState, useEffect, useRef } from 'react'

const INAT_BASE = 'https://api.inaturalist.org/v1/observations'
const REFRESH_INTERVAL = 30 * 60 * 1000 // 30 minutes

/**
 * Fetches live iNaturalist shark sightings for the map and right panel feed.
 * Also fetches lemon shark observations for photo fallback.
 *
 * @returns {{
 *   sightings: Array,   // normalised for map + feed
 *   loading: boolean,
 *   error: string|null,
 *   stale: boolean,
 *   lastUpdated: Date|null,
 *   refresh: function
 * }}
 */
export function useINaturalist() {
  const [sightings, setSightings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stale, setStale] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

  async function fetchSightings() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${INAT_BASE}?taxon_id=47273&quality_grade=research&per_page=50&order_by=created_at&order=desc`
      )
      if (!res.ok) throw new Error(`iNaturalist error: ${res.status}`)
      const data = await res.json()

      const results = (data.results || []).slice(0, 50)

      const normalised = results
        .filter(o => o.geojson?.coordinates?.length === 2)
        .map(o => ({
          id: o.id,
          lat: o.geojson.coordinates[1],
          lon: o.geojson.coordinates[0],
          speciesName: o.taxon?.name || o.species_guess || 'Unknown shark',
          commonName: o.taxon?.preferred_common_name || o.species_guess || 'Shark',
          observedOn: o.observed_on || o.created_at?.slice(0, 10),
          createdAt: o.created_at,
          location: o.place_guess || 'Unknown location',
          observer: o.user?.login || 'Anonymous',
          photoUrl: o.photos?.[0]?.url?.replace('square', 'small') || null,
          inatUrl: `https://www.inaturalist.org/observations/${o.id}`,
          taxonPhotoUrl: o.taxon?.default_photo?.square_url || null,
        }))

      setSightings(normalised)
      setLastUpdated(new Date())
      setStale(false)
    } catch (err) {
      console.error('iNaturalist fetch error:', err)
      setError(err.message)
      if (sightings.length > 0) setStale(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSightings()
    timerRef.current = setInterval(fetchSightings, REFRESH_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [])

  return { sightings, loading, error, stale, lastUpdated, refresh: fetchSightings }
}
