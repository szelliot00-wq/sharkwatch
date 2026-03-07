import { useState, useCallback, useRef } from 'react'

const S2_BASE = 'https://api.semanticscholar.org/graph/v1/paper/search'
const FIELDS = 'title,abstract,authors,year,venue,openAccessPdf,tldr,citationCount'
const COOLDOWN_MS = 60000        // 60s between manual refreshes
const CACHE_TTL_MS = 2 * 60 * 60 * 1000  // 2 hours sessionStorage cache

// Tab 1: Lemon Shark Research
const LEMON_QUERY = 'lemon shark Negaprion brevirostris behaviour ecology'

// Tab 2: Plymouth Marine (2 queries, deduplicated)
const PLYMOUTH_QUERIES = [
  { query: 'David Sims shark elasmobranch ocean tracking telemetry', limit: 6 },
  { query: 'basking shark blue shark porbeagle migration Atlantic ecology', limit: 4 },
]

// Tab 3: Global Labs (8 queries × 3 papers each)
const GLOBAL_QUERIES = [
  { institution: 'James Cook University', flag: '🇦🇺', query: 'shark James Cook University Simpfendorfer Rummer marine', limit: 3 },
  { institution: 'Flinders University', flag: '🇦🇺', query: 'shark Flinders University Huveneers Southern Shark Ecology', limit: 3 },
  { institution: 'Nova Southeastern University', flag: '🇺🇸', query: 'shark Nova Southeastern University Shivji Guy Harvey genetics', limit: 3 },
  { institution: 'University of Miami', flag: '🇺🇸', query: 'shark University Miami Rosenstiel Macdonald ecology conservation', limit: 3 },
  { institution: 'Hawaii HIMB', flag: '🇺🇸', query: 'shark Hawaii Institute Marine Biology Holland Meyer tiger', limit: 3 },
  { institution: 'University of Florida / ISAF', flag: '🇺🇸', query: 'shark Florida Museum Natural History Naylor attack file ISAF', limit: 3 },
  { institution: 'Dalhousie University', flag: '🇨🇦', query: 'shark Dalhousie University ocean elasmobranch', limit: 3 },
  { institution: 'SAIAB South Africa', flag: '🇿🇦', query: 'shark SAIAB Rhodes University South Africa elasmobranch', limit: 3 },
]

// ---------------------------------------------------------------------------
// sessionStorage cache helpers
// ---------------------------------------------------------------------------

function cacheRead(key) {
  try {
    const raw = sessionStorage.getItem(`s2_${key}`)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) { sessionStorage.removeItem(`s2_${key}`); return null }
    return data
  } catch { return null }
}

function cacheWrite(key, data) {
  try { sessionStorage.setItem(`s2_${key}`, JSON.stringify({ ts: Date.now(), data })) } catch {}
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

const delay = ms => new Promise(r => setTimeout(r, ms))

async function fetchPapers(query, limit = 8) {
  const url = `${S2_BASE}?query=${encodeURIComponent(query)}&fields=${FIELDS}&limit=${limit}`
  const res = await fetch(url)
  if (res.status === 429) throw new Error('rate_limited')
  if (!res.ok) throw new Error(`S2 error ${res.status}`)
  const data = await res.json()
  // S2 sometimes returns HTTP 200 with a rate-limit body
  if (data?.code === '429' || data?.message?.includes?.('Too Many')) {
    throw new Error('rate_limited')
  }
  return (data.data || []).map(p => ({
    paperId: p.paperId,
    title: p.title || 'Untitled',
    abstract: p.abstract || null,
    tldr: p.tldr?.text || null,
    authors: p.authors || [],
    year: p.year || null,
    venue: p.venue || null,
    citationCount: p.citationCount || 0,
    openAccessUrl: p.openAccessPdf?.url || null,
    s2Url: `https://www.semanticscholar.org/paper/${p.paperId}`,
  }))
}

function deduplicateByPaperId(papers) {
  const seen = new Set()
  return papers.filter(p => {
    if (seen.has(p.paperId)) return false
    seen.add(p.paperId)
    return true
  })
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useResearch() {
  const [activeTab, setActiveTab] = useState('lemon')

  const [lemonPapers, setLemonPapers] = useState(() => cacheRead('lemon') || [])
  const [plymouthPapers, setPlymouthPapers] = useState(() => cacheRead('plymouth') || [])
  const [globalPapers, setGlobalPapers] = useState(() => cacheRead('global') || [])

  const [lemonState, setLemonState] = useState({ loading: false, error: null })
  const [plymouthState, setPlymouthState] = useState({ loading: false, error: null })
  const [globalState, setGlobalState] = useState({ loading: false, error: null })

  const lastFetchRef = useRef({})
  const fetchedRef = useRef({
    lemon: !!cacheRead('lemon'),
    plymouth: !!cacheRead('plymouth'),
    global: !!cacheRead('global'),
  })

  function isOnCooldown(tab) {
    const last = lastFetchRef.current[tab]
    return last && Date.now() - last < COOLDOWN_MS
  }

  const fetchLemon = useCallback(async (force = false) => {
    if (!force && fetchedRef.current.lemon) return
    if (isOnCooldown('lemon')) return
    setLemonState({ loading: true, error: null })
    lastFetchRef.current.lemon = Date.now()
    try {
      const papers = await fetchPapers(LEMON_QUERY, 8)
      const sorted = papers.sort((a, b) => (b.year || 0) - (a.year || 0))
      cacheWrite('lemon', sorted)
      setLemonPapers(sorted)
      fetchedRef.current.lemon = true
      setLemonState({ loading: false, error: null })
    } catch (err) {
      setLemonState({
        loading: false,
        error: err.message === 'rate_limited'
          ? 'Rate limited — wait 30s then retry'
          : 'Could not load papers',
      })
    }
  }, [])

  const fetchPlymouth = useCallback(async (force = false) => {
    if (!force && fetchedRef.current.plymouth) return
    if (isOnCooldown('plymouth')) return
    setPlymouthState({ loading: true, error: null })
    lastFetchRef.current.plymouth = Date.now()
    try {
      const results = []
      for (const q of PLYMOUTH_QUERIES) {
        results.push(await fetchPapers(q.query, q.limit))
        await delay(600) // be kind to S2 rate limits
      }
      const merged = deduplicateByPaperId(results.flat())
      const sorted = merged.sort((a, b) => (b.year || 0) - (a.year || 0))
      cacheWrite('plymouth', sorted)
      setPlymouthPapers(sorted)
      fetchedRef.current.plymouth = true
      setPlymouthState({ loading: false, error: null })
    } catch (err) {
      setPlymouthState({
        loading: false,
        error: err.message === 'rate_limited'
          ? 'Rate limited — wait 30s then retry'
          : 'Could not load papers',
      })
    }
  }, [])

  const fetchGlobal = useCallback(async (force = false) => {
    if (!force && fetchedRef.current.global) return
    if (isOnCooldown('global')) return
    setGlobalState({ loading: true, error: null })
    lastFetchRef.current.global = Date.now()
    try {
      const results = await Promise.allSettled(
        GLOBAL_QUERIES.map(q =>
          fetchPapers(q.query, q.limit).then(papers => ({ ...q, papers }))
        )
      )
      const groups = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)
        .filter(g => g.papers.length > 0)

      const seen = new Set()
      const dedupedGroups = groups
        .map(g => ({
          ...g,
          papers: g.papers.filter(p => {
            if (seen.has(p.paperId)) return false
            seen.add(p.paperId)
            return true
          }),
        }))
        .filter(g => g.papers.length > 0)

      cacheWrite('global', dedupedGroups)
      setGlobalPapers(dedupedGroups)
      fetchedRef.current.global = true
      setGlobalState({ loading: false, error: null })
    } catch (err) {
      setGlobalState({ loading: false, error: 'Could not load papers' })
    }
  }, [])

  function handleTabChange(tab) {
    setActiveTab(tab)
    if (tab === 'lemon') fetchLemon()
    if (tab === 'plymouth') fetchPlymouth()
    if (tab === 'global') fetchGlobal()
  }

  function getCooldownRemaining(tab) {
    const last = lastFetchRef.current[tab]
    if (!last) return 0
    return Math.max(0, Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000))
  }

  return {
    activeTab,
    setActiveTab: handleTabChange,
    lemonPapers,
    lemonState,
    fetchLemon: () => fetchLemon(true),
    plymouthPapers,
    plymouthState,
    fetchPlymouth: () => fetchPlymouth(true),
    globalPapers,
    globalState,
    fetchGlobal: () => fetchGlobal(true),
    getCooldownRemaining,
    initFetch: () => fetchLemon(),
  }
}
