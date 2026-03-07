import { useState, useEffect, useRef, useCallback } from 'react'
import { proxied } from '../utils/cors'
import { parseRSS } from '../utils/rssParser'

/**
 * Nitter instances to try in order.
 * Nitter is an open-source Twitter/X frontend that exposes RSS feeds.
 * Some instances may be blocked by X at any given time — we try each in sequence.
 */
const NITTER_INSTANCES = [
  'xcancel.com',
  'nitter.privacydev.net',
  'nitter.poast.org',
  'nitter.1d4.us',
  'nitter.cz',
  'nitter.lunar.icu',
]

/** Top accounts to aggregate into the feed (ordered by posting frequency) */
export const FEED_ACCOUNTS = [
  { handle: 'OCEARCH',         name: 'OCEARCH',                          category: 'research'     },
  { handle: 'whysharksmatter', name: 'Dr. David Shiffman',               category: 'scientist'    },
  { handle: 'Sharks4Kids',     name: 'Sharks4Kids',                      category: 'conservation' },
  { handle: 'SharkTrustUK',   name: 'The Shark Trust',                   category: 'conservation' },
  { handle: 'Elasmo_Gal',     name: 'Dr. Jasmin Graham',                 category: 'scientist'    },
  { handle: 'A_WhiteShark',   name: 'Atlantic White Shark Conservancy',  category: 'conservation' },
  { handle: 'BiminiSharkLab', name: 'Bimini Shark Lab',                  category: 'research'     },
  { handle: 'sharkangels',    name: 'Shark Angels',                      category: 'conservation' },
  { handle: 'beneaththewaves', name: 'Beneath The Waves',                category: 'conservation' },
  { handle: 'AlisonTowner1',  name: 'Alison Towner',                     category: 'scientist'    },
  { handle: 'GeorgiaAquarium', name: 'Georgia Aquarium',                 category: 'aquarium'     },
  { handle: 'MoteMarineLab',  name: 'Mote Marine Lab',                   category: 'research'     },
  { handle: 'saveourseas',    name: 'Save Our Seas',                      category: 'conservation' },
  { handle: 'Shark_Guardian', name: 'Shark Guardian',                    category: 'conservation' },
  { handle: 'MA_Sharks',      name: 'MA Sharks Programme',               category: 'research'     },
]

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const TIMEOUT_MS = 7_000

async function fetchAccountRSS(instance, handle) {
  const url = proxied(`https://${instance}/${handle}/rss`)
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  // Sanity check — must look like an RSS/Atom feed
  if (!text.includes('<item>') && !text.includes('<entry>')) {
    throw new Error('Response is not an RSS feed')
  }
  return text
}

function itemsFromXML(xml, handle, name, category) {
  const raw = parseRSS(xml, name)
  return raw.slice(0, 6).map(item => {
    // Convert nitter URL → twitter.com URL
    const twitterUrl = item.link
      ? item.link
          .replace(/^https?:\/\/[^/]+\//, 'https://twitter.com/')
          .replace(/#m$/, '')
      : `https://twitter.com/${handle}`

    return {
      id:       twitterUrl,
      handle,
      name,
      category,
      text:     (item.description || item.title || '').trim(),
      date:     item.pubDate ? new Date(item.pubDate) : null,
      url:      twitterUrl,
    }
  }).filter(t => t.text.length > 5)
}

export function useSharkSocialFeed() {
  const [tweets, setTweets]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)   // null | 'nitter_unavailable' | 'no_data' | 'fetch_error'
  const [lastRefresh, setLastRefresh] = useState(null)

  const instanceRef = useRef(null)  // cached working Nitter instance
  const cacheRef    = useRef(null)  // { data, ts }

  const load = useCallback(async (force = false) => {
    // Serve from cache if fresh enough and not forced
    if (!force && cacheRef.current && Date.now() - cacheRef.current.ts < CACHE_TTL) {
      setTweets(cacheRef.current.data)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // ── 1. Discover a working Nitter instance ────────────────────────────
      let instance = instanceRef.current
      if (!instance) {
        for (const candidate of NITTER_INSTANCES) {
          try {
            await fetchAccountRSS(candidate, 'OCEARCH')
            instance = candidate
            instanceRef.current = candidate
            break
          } catch {
            // try next instance
          }
        }
      }

      if (!instance) {
        setError('nitter_unavailable')
        setLoading(false)
        return
      }

      // ── 2. Fetch all accounts in batches of 4 ───────────────────────────
      const all = []
      for (let i = 0; i < FEED_ACCOUNTS.length; i += 4) {
        const batch = FEED_ACCOUNTS.slice(i, i + 4)
        const settled = await Promise.allSettled(
          batch.map(async ({ handle, name, category }) => {
            const xml = await fetchAccountRSS(instance, handle)
            return itemsFromXML(xml, handle, name, category)
          })
        )
        settled.forEach(r => {
          if (r.status === 'fulfilled') all.push(...r.value)
        })
        // Polite delay between batches to avoid rate-limiting
        if (i + 4 < FEED_ACCOUNTS.length) {
          await new Promise(r => setTimeout(r, 350))
        }
      }

      // ── 3. Deduplicate + sort newest first ───────────────────────────────
      const seen = new Set()
      const sorted = all
        .filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true })
        .sort((a, b) => {
          if (!a.date && !b.date) return 0
          if (!a.date) return 1
          if (!b.date) return -1
          return b.date - a.date
        })

      if (sorted.length === 0) {
        setError('no_data')
      } else {
        cacheRef.current = { data: sorted, ts: Date.now() }
        setTweets(sorted)
        setLastRefresh(new Date())
        setError(null)
      }
    } catch (err) {
      console.error('[SharkSocialFeed]', err)
      setError('fetch_error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    // Auto-refresh every 5 minutes
    const iv = setInterval(() => load(true), CACHE_TTL)
    return () => clearInterval(iv)
  }, [load])

  return { tweets, loading, error, lastRefresh, refresh: () => load(true) }
}
