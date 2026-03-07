import { useState, useEffect } from 'react'

const MAPOTIC_BASE = 'https://www.mapotic.com/api/v1/maps/3413'

// Named sharks to pin at top of the list
const FEATURED_SHARKS = ['Contender', 'Nukumi', 'Mary Lee', 'Andromache']

/**
 * Fetches shark (and other marine animal) data from the OCEARCH/Mapotic public API.
 * No proxy or authentication required — native CORS.
 *
 * Endpoint: GET /public-pois/?per_page=100&page=N
 * Each animal: { id, name, category, point, last_move_datetime, image }
 * Motion history (pings) is fetched lazily per-animal via fetchMotion().
 */
export function useSharkData() {
  const [animals, setAnimals] = useState([])
  const [pings, setPings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stale, setStale] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  async function fetchData() {
    setLoading(true)
    setError(null)

    try {
      // Fetch page 1 to find out how many pages exist
      const firstRes = await fetch(`${MAPOTIC_BASE}/public-pois/?per_page=100`)
      if (!firstRes.ok) throw new Error(`API error ${firstRes.status}`)
      const firstJson = await firstRes.json()

      const numPages = firstJson.num_pages ?? 1
      let allResults = [...(firstJson.results ?? [])]

      // Fetch remaining pages in parallel
      if (numPages > 1) {
        const pageNums = Array.from({ length: numPages - 1 }, (_, i) => i + 2)
        const rest = await Promise.all(
          pageNums.map(p =>
            fetch(`${MAPOTIC_BASE}/public-pois/?per_page=100&page=${p}`)
              .then(r => r.ok ? r.json() : { results: [] })
              .then(j => j.results ?? [])
          )
        )
        rest.forEach(results => allResults.push(...results))
      }

      // Normalise each animal
      const animalData = allResults.map(a => {
        const lon = a.point?.coordinates?.[0] ?? null
        const lat = a.point?.coordinates?.[1] ?? null
        const lastDate = a.last_move_datetime ?? null

        const lastPing = lat != null && lon != null
          ? { animalId: a.id, lat, lon, date: lastDate, depth: null }
          : null

        const daysSinceLastPing = lastDate
          ? Math.floor((Date.now() - new Date(lastDate)) / 86400000)
          : 999

        return {
          id: a.id,
          name: a.name ?? 'Unknown',
          species: a.category?.name?.en ?? 'Unknown species',
          sex: null,
          lengthM: null,
          weightKg: null,
          tagDate: null,
          biography: null,
          stage: null,
          imageUrl: a.image?.image?.medium ?? null,
          slug: a.slug ?? null,
          pings: lastPing ? [lastPing] : [],
          lastPing,
          totalPings: lastPing ? 1 : 0,
          daysSinceLastPing,
          pingStatus:
            daysSinceLastPing <= 7 ? 'green'
            : daysSinceLastPing <= 30 ? 'amber'
            : 'grey',
          featured: FEATURED_SHARKS.some(n =>
            (a.name ?? '').toLowerCase().includes(n.toLowerCase())
          ),
        }
      })

      // Sort: featured first, then by most recent ping
      animalData.sort((a, b) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return a.daysSinceLastPing - b.daysSinceLastPing
      })

      // Flat ping list for the map (one per animal — last known position)
      const flatPings = animalData
        .filter(a => a.lastPing)
        .map(a => a.lastPing)

      setAnimals(animalData)
      setPings(flatPings)
      setLastUpdated(new Date())
      setStale(false)
    } catch (err) {
      console.error('OCEARCH/Mapotic fetch error:', err)
      setError(err.message)
      if (animals.length > 0) setStale(true)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch full ping history for a single animal (for the timeline in SharkDetailDrawer).
   * Returns array of { animalId, lat, lon, date, depth }.
   */
  async function fetchMotion(animalId) {
    try {
      const res = await fetch(`${MAPOTIC_BASE}/pois/${animalId}/motion/with-meta/`)
      if (!res.ok) return []
      const data = await res.json()
      return (data.motion ?? []).map(m => ({
        animalId,
        lat: m.point?.coordinates?.[1] ?? 0,
        lon: m.point?.coordinates?.[0] ?? 0,
        date: m.dt_move ?? null,
        depth: null,
      })).filter(p => p.lat !== 0 || p.lon !== 0)
    } catch {
      return []
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { animals, pings, loading, error, stale, lastUpdated, refresh: fetchData, fetchMotion }
}
