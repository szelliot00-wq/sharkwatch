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

// Wikipedia species summary cache (keyed by species name, persists for session)
const wikiCache = {}

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
  const { photo, loading: photoLoading, error: photoError, showNext, hasMore } = usePhotoOfDay()
  const { sightings } = useINaturalist()
  const { favourites, toggleFavourite, clearFavourites } = useFavourites()

  // ── Selected shark state ─────────────────────────────────────────────────────
  const [selectedShark, setSelectedShark] = useState(null)

  // ── Wikipedia summary ────────────────────────────────────────────────────────
  const [wikiSummary, setWikiSummary] = useState(null)
  const [wikiLoading, setWikiLoading] = useState(false)

  // ── Gemini fun facts ─────────────────────────────────────────────────────────
  const [funFacts, setFunFacts] = useState(null)
  const [funFactsLoading, setFunFactsLoading] = useState(false)

  // ── Mobile layout state ──────────────────────────────────────────────────────
  const [mobileTab, setMobileTab] = useState('map') // 'sharks' | 'map' | 'feed' | 'research'
  const isMobile = useMediaQuery('(max-width: 767px)')

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
        <Header lastUpdated={lastUpdated} onRefresh={refresh} loading={loading} />

        {/* Compact photo banner on mobile */}
        <div className="flex-shrink-0" style={{ maxHeight: 140, overflow: 'hidden' }}>
          <PhotoOfDay photo={photo} loading={photoLoading} error={photoError} onShowNext={showNext} hasMore={hasMore} />
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
              <RightPanel />
            </div>
          </div>
        )}

        {/* Research panel */}
        {mobileTab === 'research' && (
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ background: '#050e1a' }}>
            <BottomStrip forceOpen />
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
      />

      {/* ── HERO BANNER: Photo of Day ─────────────────────────────────────── */}
      <div className="flex-shrink-0">
        <PhotoOfDay
          photo={photo}
          loading={photoLoading}
          error={photoError}
          onShowNext={showNext}
          hasMore={hasMore}
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
            <RightPanel />
          </div>
        </div>

      </div>

      {/* ── BOTTOM STRIP: Research hub tabs ──────────────────────────────── */}
      <div className="flex-shrink-0">
        <BottomStrip />
      </div>

      {/* ── FLOATING: Ask a Shark chat widget ────────────────────────────── */}
      <SharkChat />
    </div>
  )
}
