import { useState, useEffect } from 'react'
import { getDayOfYear } from '../utils/dayOfYear'
import { dramaScore, selectDailyPhoto } from '../utils/dramaScore'

const UNSPLASH_BASE = 'https://api.unsplash.com'

// Dramatic shark queries for daily rotation
const DRAMATIC_QUERIES = [
  'shark underwater sunlight',
  'great white shark ocean',
  'hammerhead shark',
  'whale shark diver',
  'shark blue water reef',
]

/**
 * Fetches a daily hero photo of a shark from Unsplash, with an iNaturalist fallback.
 *
 * Photo source rotation (by day % 5):
 *  0, 1 → lemon shark (Unsplash)
 *  2, 3 → dramatic query rotation (Unsplash)
 *  4    → iNaturalist research-grade observations, falling back to Unsplash
 *
 * @returns {{
 *   photo: object|null,
 *   loading: boolean,
 *   error: string|null,
 *   showNext: function,
 *   hasMore: boolean
 * }}
 */
export function usePhotoOfDay() {
  const [photo, setPhoto] = useState(null)
  const [photoPool, setPhotoPool] = useState([]) // top 5 for cycling
  const [poolIndex, setPoolIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchUnsplash(query) {
    const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
    const res = await fetch(
      `${UNSPLASH_BASE}/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=30&client_id=${key}`
    )
    if (!res.ok) throw new Error('Unsplash error')
    const data = await res.json()
    return data.results || []
  }

  /**
   * Trigger an Unsplash download event for the selected photo (required by Unsplash ToS).
   * Failures are silently ignored.
   */
  async function triggerDownload(downloadLocation) {
    const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
    try {
      await fetch(`${downloadLocation}?client_id=${key}`)
    } catch (e) {
      // silently ignore
    }
  }

  async function fetchPhoto() {
    setLoading(true)
    setError(null)
    const day = getDayOfYear()
    const mod = day % 5

    try {
      let photos = []

      if (mod === 0 || mod === 1) {
        // 40% lemon shark
        photos = await fetchUnsplash('lemon shark')
      } else if (mod === 4) {
        // 20% iNaturalist fallback
        photos = await fetchINatPhoto()
        if (photos.length > 0) {
          const selected = photos[day % photos.length]
          const top5 = photos.slice(0, 5)
          setPhotoPool(top5)
          setPoolIndex(0)
          setPhoto(selected)
          setLoading(false)
          return
        }
        // iNat returned nothing — fall back to Unsplash
        photos = await fetchUnsplash('shark underwater')
      } else {
        // 40% dramatic rotation
        const query = DRAMATIC_QUERIES[day % DRAMATIC_QUERIES.length]
        photos = await fetchUnsplash(query)
      }

      if (!photos.length) throw new Error('No photos returned')

      const top5 = [...photos]
        .sort((a, b) => dramaScore(b) - dramaScore(a))
        .slice(0, 5)
      const selected = selectDailyPhoto(photos, day)

      // Trigger download for selected (Unsplash ToS)
      if (selected?.links?.download_location) {
        triggerDownload(selected.links.download_location)
      }

      setPhotoPool(top5)
      setPoolIndex(0)
      setPhoto(selected)
    } catch (err) {
      console.error('Photo fetch error:', err)
      setError(err.message)

      // Try iNaturalist as a last-resort fallback
      try {
        const inatPhotos = await fetchINatPhoto()
        if (inatPhotos.length > 0) {
          setPhoto(inatPhotos[0])
          setPhotoPool(inatPhotos.slice(0, 5))
          setPoolIndex(0)
        }
      } catch (e2) {
        setError('Could not load photo')
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch research-grade shark observations from iNaturalist and convert them
   * to Unsplash-compatible photo objects so the rest of the app can treat them uniformly.
   *
   * taxon_id 106650 = Selachimorpha (sharks)
   * place_id 97389  = global ocean (approximate)
   *
   * @returns {Promise<Array>}
   */
  async function fetchINatPhoto() {
    const res = await fetch(
      'https://api.inaturalist.org/v1/observations?taxon_id=106650&quality_grade=research&photos=true&license=cc-by,cc-by-nc,cc-by-sa&per_page=30&place_id=97389'
    )
    const data = await res.json()
    const obs = data.results || []

    return obs
      .filter(o => o.photos?.length > 0)
      .map(o => ({
        id: o.id,
        urls: {
          regular:
            o.photos[0]?.url?.replace('square', 'large') || o.photos[0]?.url,
          full:
            o.photos[0]?.url?.replace('square', 'original') || o.photos[0]?.url,
        },
        user: {
          name: o.user?.login || 'iNaturalist Observer',
          links: {
            html: `https://www.inaturalist.org/observations/${o.id}`,
          },
        },
        description: o.species_guess || o.taxon?.name,
        alt_description: o.taxon?.preferred_common_name,
        source: 'iNaturalist',
        location: o.place_guess,
        taxonName: o.taxon?.name,
        taxonCommon: o.taxon?.preferred_common_name,
        width: 1920,
        height: 1080,
        likes: 0,
      }))
  }

  /**
   * Advance to the next photo in the curated pool.
   * Wraps around. Triggers a download event for Unsplash ToS compliance.
   */
  function showNext() {
    if (!photoPool.length) return
    const next = (poolIndex + 1) % photoPool.length
    setPoolIndex(next)
    const selected = photoPool[next]
    if (selected?.links?.download_location) {
      triggerDownload(selected.links.download_location)
    }
    setPhoto(selected)
  }

  useEffect(() => {
    fetchPhoto()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { photo, photoPool, poolIndex, loading, error, showNext, hasMore: photoPool.length > 1 }
}
