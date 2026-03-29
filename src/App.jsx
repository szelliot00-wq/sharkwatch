import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSharkData } from './hooks/useSharkData'
import { usePhotoOfDay } from './hooks/usePhotoOfDay'
import { useINaturalist } from './hooks/useINaturalist'
import { useFavourites } from './hooks/useFavourites'
import { getSpeciesFunFacts } from './utils/gemini'
import { Header } from './components/layout/Header'
import { LeftPanel } from './components/layout/LeftPanel'
import { RightPanel } from './components/layout/RightPanel'
import { BottomStrip } from './components/layout/BottomStrip'
import { PhotoOfDay } from './components/media/PhotoOfDay'
import SharkMap from './components/map/SharkMap'
import SharkDetailDrawer from './components/sharks/SharkDetailDrawer'
import { SharkChat } from './components/ui/SharkChat'
import { SharkSpotlight } from './components/ui/SharkSpotlight'
import { PhotoGallery } from './components/media/PhotoGallery'

// Wikipedia species summary cache (keyed by species name, persists for session)
const wikiCache = {}

// ── Quiz welcome popup helpers ────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function loadLastQuizScore() {
  try {
    const s = localStorage.getItem('shark_quiz_last_score')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

function QuizPopup({ onAccept, onDismiss }) {
  const last = loadLastQuizScore()
  // Only show last score if it's from a previous day
  const showLast = last && last.date !== todayStr()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,14,26,0.85)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="rounded-2xl p-7 flex flex-col items-center gap-5 text-center max-w-xs w-full"
        style={{ background: '#0a1f35', border: '1px solid #1a4a7a', boxShadow: '0 25px 50px rgba(0,0,0,0.7)' }}
      >
        <span className="text-6xl" aria-hidden="true">🦈</span>
        <div>
          <h2 className="text-xl font-bold text-white">Welcome back, Zoe!</h2>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            {showLast
              ? `Last time you got ${last.correct}/${last.total} — think you can beat it?`
              : "Want to try today's shark quiz?"}
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={onAccept}
            type="button"
            className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316', border: '1px solid #f97316' }}
          >
            Let's go! 🦈
          </button>
          <button
            onClick={onDismiss}
            type="button"
            className="w-full py-2 rounded-xl text-xs transition-colors"
            style={{ color: '#6b7280' }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

// ── useMediaQuery hook ───────────────────────────────────────────────────────
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    setMatches(mq.matches)
    const handler = e => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

export default function App() {
  // ── Data hooks ──────────────────────────────────────────────────────────────
  const { animals, pings, loading, error, stale, lastUpdated, refresh, fetchMotion } = useSharkData()
  const { photo, photoPool, poolIndex, loading: photoLoading, error: photoError, showNext, hasMore } = usePhotoOfDay()
  const { sightings } = useINaturalist()
  const { favourites, toggleFavourite, clearFavourites } = useFavourites()

  // ── Research panel tab (shared between Header and BottomStrip) ───────────────
  const [researchTab, setResearchTab] = useState(null)

  // ── Selected shark state ─────────────────────────────────────────────────────
  const [selectedShark, setSelectedShark] = useState(null)

  // ── Wikipedia summary ────────────────────────────────────────────────────────
  const [wikiSummary, setWikiSummary] = useState(null)
  const [wikiLoading, setWikiLoading] = useState(false)

  // ── Gemini fun facts ─────────────────────────────────────────────────────────
  const [funFacts, setFunFacts] = useState(null)
  const [funFactsLoading, setFunFactsLoading] = useState(false)

  // ── Gallery state ────────────────────────────────────────────────────────────
  const [galleryOpen,  setGalleryOpen]  = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  function openGallery() {
    if (photoPool.length === 0) return
    setGalleryIndex(poolIndex)
    setGalleryOpen(true)
  }

  function galleryPrev() {
    setGalleryIndex(i => (i - 1 + photoPool.length) % photoPool.length)
  }

  function galleryNext() {
    setGalleryIndex(i => (i + 1) % photoPool.length)
  }

  // ── Mobile layout state ──────────────────────────────────────────────────────
  const [mobileTab, setMobileTab] = useState('map') // 'sharks' | 'map' | 'feed' | 'research'
  const isMobile = useMediaQuery('(max-width: 767px)')

  // ── Quiz welcome popup (once per day) ────────────────────────────────────────
  const [showQuizPopup, setShowQuizPopup] = useState(() => {
    try { return localStorage.getItem('shark_quiz_popup_date') !== todayStr() } catch { return false }
  })

  function dismissPopup(openQuiz = false) {
    try { localStorage.setItem('shark_quiz_popup_date', todayStr()) } catch {}
    setShowQuizPopup(false)
    if (openQuiz) {
      setResearchTab('flashcards')
      if (isMobile) setMobileTab('research')
    }
  }

  // ── Map ref for imperative focus ─────────────────────────────────────────────
  const mapRef = useRef(null)

  // ── Fetch Wikipedia summary when species changes ─────────────────────────────
  useEffect(() => {
    if (!selectedShark?.species) return

    const species = selectedShark.species
    setWikiSummary(null)

    // Check cache first
    if (wikiCache[species] !== undefined) {
      setWikiSummary(wikiCache[species])
      return
    }

    setWikiLoading(true)
    const encoded = encodeURIComponent(species.replace(/ /g, '_'))
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const summary = data?.extract || ''
        // Take first two sentences
        const sentences = summary.match(/[^.!?]+[.!?]+/g) || []
        const short = sentences.slice(0, 2).join(' ').trim()
        wikiCache[species] = short
        setWikiSummary(short)
      })
      .catch(() => {
        wikiCache[species] = ''
        setWikiSummary('')
      })
      .finally(() => setWikiLoading(false))
  }, [selectedShark?.species])

  // ── Fetch full ping history when shark selected (for timeline) ───────────────
  useEffect(() => {
    if (!selectedShark?.id) return
    fetchMotion(selectedShark.id).then(motionPings => {
      if (motionPings.length > 1) {
        setSelectedShark(prev => prev?.id === selectedShark.id
          ? { ...prev, pings: motionPings, totalPings: motionPings.length }
          : prev
        )
      }
    })
  }, [selectedShark?.id])

  // ── Fetch Gemini fun facts when shark changes ────────────────────────────────
  useEffect(() => {
    if (!selectedShark) return

    setFunFacts(null)
    setFunFactsLoading(true)

    // Use species as common name fallback if no better name available
    const commonName = selectedShark.name || selectedShark.species
    const scientificName = selectedShark.species

    getSpeciesFunFacts(commonName, scientificName)
      .then(facts => setFunFacts(facts))
      .catch(() => setFunFacts(null))
      .finally(() => setFunFactsLoading(false))
  }, [selectedShark?.id])

  // ── Handle "View on Map" event from SharkDetailDrawer ───────────────────────
  useEffect(() => {
    function handleFocusShark(e) {
      // The map component handles this event internally via its own listener.
      // We just ensure the drawer stays open.
    }
    window.addEventListener('sharkwatch:focusShark', handleFocusShark)
    return () => window.removeEventListener('sharkwatch:focusShark', handleFocusShark)
  }, [])

  // ── Shark select handler ─────────────────────────────────────────────────────
  const handleSharkSelect = useCallback((shark) => {
    setSelectedShark(prev => prev?.id === shark?.id ? null : shark)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setSelectedShark(null)
  }, [])

  // ── Mobile layout ────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="flex flex-col" style={{ height: '100dvh', background: '#050e1a', overflow: 'hidden' }}>
        <Header lastUpdated={lastUpdated} onRefresh={refresh} loading={loading} researchTab={researchTab} onResearchTab={setResearchTab} />

        {/* Compact photo banner on mobile */}
        <div className="flex-shrink-0" style={{ maxHeight: 140, overflow: 'hidden' }}>
          <PhotoOfDay photo={photo} loading={photoLoading} error={photoError} onShowNext={showNext} hasMore={hasMore} onOpenGallery={photoPool.length > 0 ? openGallery : undefined} />
        </div>

        {/* Map — takes remaining space above the bottom nav */}
        {mobileTab === 'map' && (
          <div className="flex-1 min-h-0 relative">
            <SharkMap
              pings={pings}
              animals={animals}
              sightings={sightings}
              selectedShark={selectedShark}
              onSharkSelect={handleSharkSelect}
            />
            {selectedShark && (
              <div
                className="absolute inset-x-0 bottom-0 max-h-[60%] overflow-y-auto"
                style={{ background: '#0a1f35' }}
              >
                <SharkDetailDrawer
                  shark={selectedShark}
                  onClose={handleCloseDrawer}
                  wikipediaSummary={wikiLoading ? undefined : wikiSummary}
                  funFacts={funFacts}
                  funFactsLoading={funFactsLoading}
                />
              </div>
            )}
          </div>
        )}

        {/* Sharks panel */}
        {mobileTab === 'sharks' && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <LeftPanel
              animals={animals}
              loading={loading}
              error={error}
              stale={stale}
              selectedShark={selectedShark}
              onSelect={(s) => { handleSharkSelect(s); setMobileTab('map') }}
              onRefresh={refresh}
              favourites={favourites}
              onToggleFavourite={toggleFavourite}
              clearFavourites={clearFavourites}
            />
          </div>
        )}

        {/* Feed panel */}
        {mobileTab === 'feed' && (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <SharkSpotlight shark={animals[0] ?? null} />
            <div className="flex-1 min-h-0">
              <RightPanel topShark={animals[0] ?? null} />
            </div>
          </div>
        )}

        {/* Research panel */}
        {mobileTab === 'research' && (
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ background: '#050e1a' }}>
            <BottomStrip forceOpen activeTab={researchTab} />
          </div>
        )}

        {/* Bottom nav */}
        <div
          className="flex-shrink-0 flex"
          style={{
            background: '#050e1a',
            borderTop: '1px solid #1a4a7a',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {[
            { id: 'sharks',   icon: '🦈', label: 'Sharks' },
            { id: 'map',      icon: '🌍', label: 'Map' },
            { id: 'feed',     icon: '📡', label: 'Feed' },
            { id: 'research', icon: '🔬', label: 'Research' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] transition-colors"
              style={{ color: mobileTab === tab.id ? '#f97316' : '#6b7280' }}
              type="button"
              aria-label={tab.label}
              aria-pressed={mobileTab === tab.id}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <SharkChat />

        {/* Gallery overlay */}
        {galleryOpen && photoPool.length > 0 && (
          <PhotoGallery
            photos={photoPool}
            currentIndex={galleryIndex}
            onPrev={galleryPrev}
            onNext={galleryNext}
            onClose={() => setGalleryOpen(false)}
          />
        )}

        {/* Quiz welcome popup */}
        {showQuizPopup && (
          <QuizPopup
            onAccept={() => dismissPopup(true)}
            onDismiss={() => dismissPopup(false)}
          />
        )}
      </div>
    )
  }

  // ── Desktop layout ───────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col"
      style={{ height: '100dvh', minHeight: '100vh', background: '#050e1a', overflow: 'hidden' }}
    >
      {/* ── TOP STRIP: Header ─────────────────────────────────────────────── */}
      <Header
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        loading={loading}
        researchTab={researchTab}
        onResearchTab={setResearchTab}
      />

      {/* ── HERO BANNER: Photo of Day ─────────────────────────────────────── */}
      <div className="flex-shrink-0">
        <PhotoOfDay
          photo={photo}
          loading={photoLoading}
          error={photoError}
          onShowNext={showNext}
          hasMore={hasMore}
          onOpenGallery={photoPool.length > 0 ? openGallery : undefined}
        />
      </div>

      {/* ── MAIN THREE-COLUMN AREA ────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left panel — shark list or detail */}
        <div className="flex-shrink-0 w-[280px] flex flex-col overflow-hidden">
          {selectedShark ? (
            <SharkDetailDrawer
              shark={selectedShark}
              onClose={handleCloseDrawer}
              wikipediaSummary={wikiLoading ? undefined : wikiSummary}
              funFacts={funFacts}
              funFactsLoading={funFactsLoading}
            />
          ) : (
            <LeftPanel
              animals={animals}
              loading={loading}
              error={error}
              stale={stale}
              selectedShark={selectedShark}
              onSelect={handleSharkSelect}
              onRefresh={refresh}
              favourites={favourites}
              onToggleFavourite={toggleFavourite}
              clearFavourites={clearFavourites}
            />
          )}
        </div>

        {/* Centre — interactive map */}
        <div className="flex-1 min-w-0 relative">
          <SharkMap
            pings={pings}
            animals={animals}
            sightings={sightings}
            selectedShark={selectedShark}
            onSharkSelect={handleSharkSelect}
          />
        </div>

        {/* Right panel — sightings + news + Shark of the Day */}
        <div className="flex-shrink-0 w-[260px] flex flex-col overflow-hidden">
          <SharkSpotlight shark={animals[0] ?? null} />
          <div className="flex-1 min-h-0">
            <RightPanel topShark={animals[0] ?? null} />
          </div>
        </div>

      </div>

      {/* ── BOTTOM STRIP: Research hub tabs ──────────────────────────────── */}
      <BottomStrip activeTab={researchTab} onTabChange={setResearchTab} />

      {/* ── FLOATING: Ask a Shark chat widget ────────────────────────────── */}
      <SharkChat />

      {/* ── GALLERY: Full-screen photo overlay ───────────────────────────── */}
      {galleryOpen && photoPool.length > 0 && (
        <PhotoGallery
          photos={photoPool}
          currentIndex={galleryIndex}
          onPrev={galleryPrev}
          onNext={galleryNext}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {/* ── QUIZ welcome popup (once per day) ────────────────────────────── */}
      {showQuizPopup && (
        <QuizPopup
          onAccept={() => dismissPopup(true)}
          onDismiss={() => dismissPopup(false)}
        />
      )}
    </div>
  )
}
