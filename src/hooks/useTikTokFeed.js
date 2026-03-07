import { useState, useEffect, useRef, useCallback } from 'react'
import { proxied } from '../utils/cors'
import { parseRSS } from '../utils/rssParser'

/**
 * Fetches recent shark TikTok videos via RSSHub, which provides RSS feeds
 * for TikTok hashtags and user accounts without requiring a TikTok API key.
 *
 * Quality filtering:
 *   - Hard-blocks videos whose title contains gore/attack/fake keywords
 *   - Boosts videos with science/conservation/education keywords
 *   - Sorts by: boosted recency (newest first, with slight quality weighting)
 */

// RSSHub public instances to try in order
const RSSHUB_INSTANCES = [
  'https://rsshub.app',
  'https://rsshub.fly.dev',
]

// Known educational/conservation shark TikTok accounts
const TIKTOK_ACCOUNTS = [
  { handle: 'ocearch',         name: 'OCEARCH'           },
  { handle: 'oceanramsey',     name: 'Ocean Ramsey'      },
  { handle: 'sharkgirlmadison', name: 'Madison Stewart'  },
  { handle: 'cristinazenato', name: 'Cristina Zenato'    },
  { handle: 'whysharksmatter', name: 'Dr. David Shiffman'},
  { handle: 'sharks4kids',    name: 'Sharks4Kids'         },
  { handle: 'sharkangels',    name: 'Shark Angels'        },
]

// Hashtags to search
const TIKTOK_TAGS = ['sharks', 'sharkscience', 'sharkconservation', 'marinelife']

// Block content that's gory, fake, or sensational
const BLOCK_RE = /\b(attack|gore|blood(y)?|kill(ed|s)?|dead|death|body|drown|eaten|shar?k\s*bite|bitten|severed|screaming|terrif(y|ied|ying)|horrif(y|ied|ying)|graphic|disturbing|warning|prank|fake|hoax|clickbait)\b/i

// Boost genuinely educational/conservation/beautiful content
const BOOST_RE = /\b(research|scien(ce|tist)|conservation|ocean|marine|education|tagging|tracking|tag(ged)?|track(ed|ing)?|beautiful|peaceful|gentle|friendly|fascinating|incredible|amazing|study|studyi|biology|biologist|species|habitat|migrat|feeding|behav)\b/i

const CACHE_TTL = 10 * 60 * 1000  // 10 minutes
const TIMEOUT   = 8_000

async function rssHubFetch(instance, path) {
  const url = proxied(`${instance}${path}`)
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  if (!text.includes('<item>') && !text.includes('<entry>')) {
    throw new Error('Not a valid RSS feed')
  }
  return text
}

// Extract first <img src="..."> from HTML string
function extractThumb(html) {
  const m = html?.match(/src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i)
  return m?.[1] || null
}

// Extract TikTok video ID from URL: https://www.tiktok.com/@handle/video/VIDEO_ID
function extractVideoId(url) {
  const m = url?.match(/\/video\/(\d{15,20})/)
  return m?.[1] || null
}

// Extract @handle from TikTok URL
function extractHandle(url) {
  const m = url?.match(/tiktok\.com\/@([^/?#]+)/)
  return m?.[1] || null
}

function parseItems(xml, sourceName) {
  const items = parseRSS(xml, sourceName)
  return items.slice(0, 8).map(item => {
    const videoId = extractVideoId(item.link)
    if (!videoId) return null

    const handle = extractHandle(item.link) || sourceName
    const title  = (item.title || item.description || '').slice(0, 280).trim()

    return {
      id:        videoId,
      handle,
      name:      sourceName,
      title,
      thumb:     extractThumb(item.description || ''),
      date:      item.pubDate ? new Date(item.pubDate) : null,
      url:       item.link,
      videoId,
      boosted:   BOOST_RE.test(title),
    }
  }).filter(Boolean)
}

function isBlocked(item) {
  return BLOCK_RE.test(item.title)
}

export function useTikTokFeed() {
  const [videos,      setVideos]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const cacheRef    = useRef(null)
  const instanceRef = useRef(null)  // memoised working RSSHub instance

  const load = useCallback(async (force = false) => {
    if (!force && cacheRef.current && Date.now() - cacheRef.current.ts < CACHE_TTL) {
      setVideos(cacheRef.current.data)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // ── 1. Find a working RSSHub instance ─────────────────────────────────
      let instance = instanceRef.current
      if (!instance) {
        for (const candidate of RSSHUB_INSTANCES) {
          try {
            await rssHubFetch(candidate, '/tiktok/tag/sharks')
            instance = candidate
            instanceRef.current = candidate
            break
          } catch {
            // try next
          }
        }
      }

      if (!instance) {
        setError('rsshub_unavailable')
        setLoading(false)
        return
      }

      // ── 2. Fetch hashtag feeds + account feeds in parallel ─────────────────
      const tagPaths     = TIKTOK_TAGS.map(tag => `/tiktok/tag/${tag}`)
      const accountPaths = TIKTOK_ACCOUNTS.map(a => `/tiktok/user/@${a.handle}`)
      const allPaths     = [...tagPaths, ...accountPaths]

      const settled = await Promise.allSettled(
        allPaths.map(async (path, i) => {
          // Use account name for user paths, tag name for tag paths
          const sourceName = i < tagPaths.length
            ? `#${TIKTOK_TAGS[i]}`
            : TIKTOK_ACCOUNTS[i - tagPaths.length].name
          const xml = await rssHubFetch(instance, path)
          return parseItems(xml, sourceName)
        })
      )

      const all = settled
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)

      // ── 3. Deduplicate by video ID ─────────────────────────────────────────
      const seen = new Set()
      const deduped = all.filter(v => {
        if (seen.has(v.id) || isBlocked(v)) return false
        seen.add(v.id)
        return true
      })

      // ── 4. Sort: boosted recent content first, then pure recency ──────────
      deduped.sort((a, b) => {
        // Boosted educational content gets a +6h virtual bump
        const aTs = (a.date?.getTime() || 0) + (a.boosted ? 6 * 3_600_000 : 0)
        const bTs = (b.date?.getTime() || 0) + (b.boosted ? 6 * 3_600_000 : 0)
        return bTs - aTs
      })

      if (deduped.length === 0) {
        setError('no_data')
      } else {
        cacheRef.current = { data: deduped, ts: Date.now() }
        setVideos(deduped)
        setLastRefresh(new Date())
        setError(null)
      }
    } catch (err) {
      console.error('[TikTokFeed]', err)
      setError('fetch_error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const iv = setInterval(() => load(true), CACHE_TTL)
    return () => clearInterval(iv)
  }, [load])

  return { videos, loading, error, lastRefresh, refresh: () => load(true) }
}
