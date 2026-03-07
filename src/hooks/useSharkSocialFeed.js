import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Fetches real-time shark content from Bluesky (AT Protocol).
 * The Bluesky public API requires no authentication and has no CORS restrictions.
 *
 * Strategy:
 *  1. Author feeds for known shark accounts on Bluesky
 *  2. Search queries for shark science hashtags / keywords
 *  Merge + deduplicate + sort newest first.
 */

const API = 'https://public.api.bsky.app/xrpc'
const CACHE_TTL = 5 * 60 * 1000  // 5 minutes
const TIMEOUT  = 10_000

// Shark researchers and orgs confirmed on Bluesky
const BLUESKY_HANDLES = [
  'whysharksmatter.bsky.social',   // Dr. David Shiffman — most active shark scientist on Bluesky
  'ocearch.bsky.social',           // OCEARCH
  'sharktrust.bsky.social',        // The Shark Trust
  'elasmo-gal.bsky.social',        // Dr. Jasmin Graham
  'sharks4kids.bsky.social',       // Sharks4Kids
  'beneaththewaves.bsky.social',   // Beneath The Waves
  'sharkangels.bsky.social',       // Shark Angels
  'saveourseas.bsky.social',       // Save Our Seas Foundation
  'oceana.bsky.social',            // Oceana
]

// Bluesky search queries to surface community content beyond known handles
const SEARCH_QUERIES = [
  '#sharkscience',
  '#sharks',
  'shark conservation',
  'shark research',
  'OCEARCH',
]

async function apiFetch(path, params = {}) {
  const qs = new URLSearchParams(params).toString()
  const url = `${API}/${path}${qs ? '?' + qs : ''}`
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) })
  if (!res.ok) throw new Error(`Bluesky API ${res.status}: ${path}`)
  return res.json()
}

async function getAuthorFeed(handle) {
  try {
    const data = await apiFetch('app.bsky.feed.getAuthorFeed', {
      actor: handle,
      limit: 8,
      filter: 'posts_no_replies',
    })
    return (data.feed || []).map(item => item.post)
  } catch {
    return []  // silently skip handles that don't exist yet
  }
}

async function searchPosts(query) {
  try {
    const data = await apiFetch('app.bsky.feed.searchPosts', {
      q:     query,
      limit: 20,
      sort:  'latest',
    })
    return data.posts || []
  } catch {
    return []
  }
}

function normalise(raw) {
  const record = raw.record || {}
  const text   = record.text || ''
  if (!text.trim()) return null

  const handle  = raw.author?.handle      || ''
  const name    = raw.author?.displayName || handle
  const avatar  = raw.author?.avatar      || null

  // Build bsky.app URL: uri = at://did/app.bsky.feed.post/RKEY
  const rkey    = raw.uri?.split('/').pop()
  const url     = handle && rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : null

  return {
    id:          raw.uri || raw.cid,
    handle,
    name,
    avatar,
    text,
    date:        record.createdAt ? new Date(record.createdAt) : null,
    url,
    likeCount:   raw.likeCount   || 0,
    repostCount: raw.repostCount || 0,
  }
}

export function useSharkSocialFeed() {
  const [posts,        setPosts]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [lastRefresh,  setLastRefresh]  = useState(null)
  const cacheRef = useRef(null)

  const load = useCallback(async (force = false) => {
    if (!force && cacheRef.current && Date.now() - cacheRef.current.ts < CACHE_TTL) {
      setPosts(cacheRef.current.data)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // ── 1. Author feeds (run in parallel) ─────────────────────────────────
      const authorResults = await Promise.all(BLUESKY_HANDLES.map(getAuthorFeed))
      const fromAuthors   = authorResults.flat()

      // ── 2. Search queries (run in parallel) ───────────────────────────────
      const searchResults = await Promise.all(SEARCH_QUERIES.map(searchPosts))
      const fromSearch    = searchResults.flat()

      // ── 3. Normalise, deduplicate, sort newest first ───────────────────────
      const seen = new Set()
      const all  = [...fromAuthors, ...fromSearch]
        .map(normalise)
        .filter(p => {
          if (!p || seen.has(p.id)) return false
          seen.add(p.id)
          return true
        })
        .sort((a, b) => {
          if (!a.date && !b.date) return 0
          if (!a.date) return 1
          if (!b.date) return -1
          return b.date - a.date
        })

      if (all.length === 0) {
        setError('no_data')
      } else {
        cacheRef.current = { data: all, ts: Date.now() }
        setPosts(all)
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
    const iv = setInterval(() => load(true), CACHE_TTL)
    return () => clearInterval(iv)
  }, [load])

  return { posts, loading, error, lastRefresh, refresh: () => load(true) }
}
