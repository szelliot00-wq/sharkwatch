import { useState, useEffect, useRef } from 'react'

const YT_BASE = 'https://www.googleapis.com/youtube/v3/search'
const BLOCKLIST = ['dead', 'killed', 'caught', 'trophy', 'finned', 'cull', 'attacked', 'mauled', 'fatal', 'bite', 'shark attack', 'autopsy']

const QUERIES = [
  'shark encounter scuba diver underwater -dead -killed -attack -caught -fishing',
  'swimming with sharks reef positive -dead -killed -caught -trophy',
  'shark gopro underwater close up -dead -killed -caught -attack',
]

function isBlocked(item) {
  const text = [
    item.snippet?.title || '',
    item.snippet?.description || '',
  ].join(' ').toLowerCase()
  return BLOCKLIST.some(w => text.includes(w))
}

// Module-level cache — survives tab switches, cleared only on page reload
let sessionCache = null

export function useYouTube() {
  const [videos, setVideos] = useState(sessionCache || [])
  const [loading, setLoading] = useState(!sessionCache)
  const [error, setError] = useState(null)
  const fetchedRef = useRef(!!sessionCache)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    const key = import.meta.env.VITE_YOUTUBE_API_KEY
    if (!key) {
      setError('YouTube API key not configured')
      setLoading(false)
      return
    }

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

    async function fetchAll() {
      setLoading(true)
      try {
        const results = await Promise.allSettled(
          QUERIES.map(q =>
            fetch(`${YT_BASE}?part=snippet&type=video&maxResults=10&order=date&safeSearch=strict&publishedAfter=${ninetyDaysAgo}&q=${encodeURIComponent(q)}&key=${key}`)
              .then(r => r.ok ? r.json() : Promise.reject(new Error(`YT ${r.status}`)))
              .then(data => data.items || [])
          )
        )

        const allItems = results
          .filter(r => r.status === 'fulfilled')
          .flatMap(r => r.value)

        // Deduplicate by videoId
        const seen = new Set()
        const unique = allItems.filter(item => {
          const id = item.id?.videoId
          if (!id || seen.has(id)) return false
          seen.add(id)
          return true
        })

        // Client-side filter
        const filtered = unique.filter(item => !isBlocked(item))

        sessionCache = filtered
        setVideos(filtered)
        setLoading(false)
      } catch (err) {
        setError('Could not load videos')
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  return { videos, loading, error }
}
