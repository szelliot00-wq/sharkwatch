import { useState, useEffect } from 'react'
import { proxied } from '../utils/cors'
import { SHARK_TIKTOKS } from '../data/sharkTikToks'

/**
 * Returns the curated shark TikTok list, enriched with thumbnails fetched
 * from TikTok's oEmbed endpoint (via CORS proxy). Thumbnails load in the
 * background — videos are available immediately while thumbnails trickle in.
 */

// Module-level thumbnail cache so they survive tab switches
const thumbCache = new Map()

async function fetchThumb(handle, videoId) {
  const key = videoId
  if (thumbCache.has(key)) return thumbCache.get(key)

  try {
    const videoUrl = `https://www.tiktok.com/@${handle}/video/${videoId}`
    const res = await fetch(proxied(`https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`), {
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const thumb = data.thumbnail_url || null
    thumbCache.set(key, thumb)
    return thumb
  } catch {
    thumbCache.set(key, null)
    return null
  }
}

export function useTikTokFeed() {
  // Start with the curated list (no thumbnails yet)
  const [videos, setVideos] = useState(() =>
    SHARK_TIKTOKS.map(v => ({ ...v, thumb: thumbCache.get(v.videoId) ?? null }))
  )

  useEffect(() => {
    let cancelled = false

    async function loadThumbs() {
      // Fetch 4 thumbnails at a time
      for (let i = 0; i < SHARK_TIKTOKS.length; i += 4) {
        if (cancelled) return
        const batch = SHARK_TIKTOKS.slice(i, i + 4)
        await Promise.all(
          batch.map(async ({ handle, videoId }) => {
            const thumb = await fetchThumb(handle, videoId)
            if (!cancelled && thumb) {
              setVideos(prev =>
                prev.map(v => v.videoId === videoId ? { ...v, thumb } : v)
              )
            }
          })
        )
        // Small pause between batches to stay polite
        if (i + 4 < SHARK_TIKTOKS.length && !cancelled) {
          await new Promise(r => setTimeout(r, 200))
        }
      }
    }

    loadThumbs()
    return () => { cancelled = true }
  }, [])

  return videos
}
