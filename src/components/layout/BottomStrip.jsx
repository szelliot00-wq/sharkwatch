import React, { useState, useEffect, lazy, Suspense } from 'react'
import { SpeciesEncyclopedia } from '../research/SpeciesEncyclopedia'

// Lazy-load heavy tab content so it doesn't block initial render
const ResearchHub    = lazy(() => import('../research/ResearchHub').then(m => ({ default: m.ResearchHub })))
const YouTubeTab     = lazy(() => import('../media/YouTubeTab').then(m => ({ default: m.YouTubeTab })))
const StreamingTab   = lazy(() => import('../media/StreamingTab').then(m => ({ default: m.StreamingTab })))
const AquariumCamsTab = lazy(() => import('../media/AquariumCamsTab').then(m => ({ default: m.AquariumCamsTab })))

const TABS = [
  { id: 'research', icon: '🦈', label: 'Research Hub', component: 'research' },
  { id: 'youtube',  icon: '🎥', label: 'YouTube',       component: 'youtube'  },
  { id: 'streaming',icon: '📺', label: 'Streaming',     component: 'streaming'},
  { id: 'aquarium', icon: '🏛️', label: 'Aquarium Cams', component: 'aquarium' },
  { id: 'species',  icon: '📖', label: 'Species',        component: 'species'  },
]

const CONTENT_HEIGHT = 300 // px when expanded

function TabFallback() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-6 h-6 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}


/**
 * BottomStrip — Research and Media Hub tab strip.
 *
 * Props:
 *   forceOpen  boolean   When true (mobile Research panel), pre-selects the
 *                        first tab, hides the close button, and prevents
 *                        collapsing. Defaults to false.
 */
export function BottomStrip({ forceOpen = false }) {
  const [activeTab, setActiveTab] = useState(forceOpen ? 'research' : null)

  // If forceOpen is toggled on after mount and nothing is selected, open research.
  useEffect(() => {
    if (forceOpen && !activeTab) setActiveTab('research')
  }, [forceOpen])

  function handleTabClick(tabId) {
    // In forceOpen mode clicking the active tab does nothing (no collapsing).
    if (forceOpen) {
      setActiveTab(tabId)
      return
    }
    setActiveTab(prev => prev === tabId ? null : tabId)
  }

  const isOpen = activeTab !== null

  return (
    <section
      className="flex-shrink-0 flex flex-col"
      style={{ background: '#0a1f35', borderTop: '1px solid #1a4a7a' }}
      aria-label="Research and Media Hub"
    >
      {/* Tab bar */}
      <div
        className="flex items-center overflow-x-auto"
        style={{ borderBottom: isOpen ? '1px solid #1a4a7a' : 'none', minHeight: 40 }}
        role="tablist"
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabClick(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0"
              style={{
                color: isActive ? '#f97316' : '#94a3b8',
                borderBottom: isActive ? '2px solid #f97316' : '2px solid transparent',
                background: 'transparent',
              }}
              type="button"
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}

        {/* Collapse button — hidden when forceOpen (mobile panel manages its own layout) */}
        {isOpen && !forceOpen && (
          <button
            onClick={() => setActiveTab(null)}
            className="ml-auto flex-shrink-0 pr-3 text-slate-500 hover:text-white text-lg leading-none"
            title="Close panel"
            type="button"
          >
            ×
          </button>
        )}
      </div>

      {/* Content panel — always open when forceOpen, otherwise toggled */}
      {isOpen && (
        <div style={forceOpen ? { flex: 1, overflow: 'hidden' } : { height: CONTENT_HEIGHT, overflow: 'hidden' }}>
          <div className="h-full overflow-y-auto" style={{ background: '#050e1a' }}>
            <Suspense fallback={<TabFallback />}>
              {activeTab === 'research'  && <ResearchHub />}
              {activeTab === 'youtube'   && <YouTubeTab />}
              {activeTab === 'streaming' && <StreamingTab />}
              {activeTab === 'aquarium'  && <AquariumCamsTab />}
              {activeTab === 'species'   && <SpeciesEncyclopedia />}
            </Suspense>
          </div>
        </div>
      )}
    </section>
  )
}
