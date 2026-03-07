import { useState, useEffect, useRef } from 'react'
import { parseRSS } from '../utils/rssParser'
import { proxied } from '../utils/cors'

const FEEDS = [
  {
    url: 'https://www.trackingsharks.com/feed/',
    source: 'TrackingSharks',
  },
  {
    url: 'https://www.sharks.org/blog?format=rss',
    source: 'Shark Research Institute',
  },
]

const REFRESH_INTERVAL = 30 * 60 * 1000 // 30 minutes
const MAX_ITEMS = 8

/**
 * Fetches and merges RSS news feeds from TrackingSharks and SRI.
 * Parses with native DOMParser via rssParser util.
 */
export function useNewsFeeds() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stale, setStale] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

  async function fetchFeeds() {
    setLoading(true)
    setError(null)

    const results = await Promise.allSettled(
      FEEDS.map(async ({ url, source }) => {
        const res = await fetch(proxied(url))
        if (!res.ok) throw new Error(`Feed error: ${res.status}`)
        const text = await res.text()
        return parseRSS(text, source)
      })
    )

    const allItems = results.flatMap(r =>
      r.status === 'fulfilled' ? r.value : []
    )

    if (allItems.length === 0 && results.every(r => r.status === 'rejected')) {
      setError('Could not load news feeds')
      if (items.length > 0) setStale(true)
      setLoading(false)
      return
    }

    // Merge, sort newest first, cap at MAX_ITEMS
    const sorted = allItems
      .filter(item => item.title && item.link)
      .sort((a, b) => {
        const da = a.pubDate ? new Date(a.pubDate) : new Date(0)
        const db = b.pubDate ? new Date(b.pubDate) : new Date(0)
        return db - da
      })
      .slice(0, MAX_ITEMS)

    setItems(sorted)
    setLastUpdated(new Date())
    setStale(false)
    setLoading(false)
  }

  useEffect(() => {
    fetchFeeds()
    timerRef.current = setInterval(fetchFeeds, REFRESH_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [])

  return { items, loading, error, stale, lastUpdated, refresh: fetchFeeds }
}
