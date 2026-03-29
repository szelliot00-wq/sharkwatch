import React, { useState, useEffect, lazy, Suspense } from 'react'
import { SpeciesEncyclopedia } from '../research/SpeciesEncyclopedia'

// Lazy-load heavy tab content so it doesn't block initial render
const ResearchHub     = lazy(() => import('../research/ResearchHub').then(m => ({ default: m.ResearchHub })))
const YouTubeTab      = lazy(() => import('../media/YouTubeTab').then(m => ({ default: m.YouTubeTab })))
const TikTokTab       = lazy(() => import('../media/TikTokTab').then(m => ({ default: m.TikTokTab })))
const StreamingTab    = lazy(() => import('../media/StreamingTab').then(m => ({ default: m.StreamingTab })))
const SocialsTab      = lazy(() => import('../media/SocialsTab').then(m => ({ default: m.SocialsTab })))
const AquariumCamsTab = lazy(() => import('../media/AquariumCamsTab').then(m => ({ default: m.AquariumCamsTab })))
const SharkFlashcards = lazy(() => import('../research/SharkFlashcards').then(m => ({ default: m.SharkFlashcards })))
const SharkHistoryTab = lazy(() => import('../research/SharkHistoryTab').then(m => ({ default: m.SharkHistoryTab })))

// Tabs (used for the mobile tab bar when forceOpen=true)
const TABS = [
  { id: 'research',  icon: '🦈', label: 'Research Hub'  },
  { id: 'youtube',   icon: '🎥', label: 'YouTube'        },
  { id: 'tiktok',    icon: '🎵', label: 'TikTok'         },
  { id: 'streaming', icon: '📺', label: 'Streaming'      },
  { id: 'socials',   icon: '🐦', label: 'Socials'        },
  { id: 'aquarium',   icon: '🏛️', label: 'Aquarium Cams' },
  { id: 'species',    icon: '📖', label: 'Species'        },
  { id: 'flashcards', icon: '🃏', label: 'Flashcards'     },
  { id: 'history',    icon: '📅', label: 'History'        },
]

const CONTENT_HEIGHT = 350

function TabFallback() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-6 h-6 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

/**
 * BottomStrip — Research and Media Hub content panel.
 *
 * Desktop (!forceOpen):
 *   - No tab bar — tabs are in the Header.
 *   - Receives activeTab + onTabChange from App (via researchTab state).
 *   - Content panel slides in from below.
 *
 * Mobile (forceOpen=true):
 *   - Internal tab state, shows its own tab bar.
 *   - Fills the mobile Research screen.
 */
export function BottomStrip({ forceOpen = false, activeTab: externalTab, onTabChange }) {
  // Mobile uses internal state; desktop uses external (from App/Header)
  const [internalTab, setInternalTab] = useState('research')

  useEffect(() => {
    if (forceOpen && !internalTab) setInternalTab('research')
  }, [forceOpen])

  // Allow App to navigate to a specific tab externally (e.g. quiz welcome popup)
  useEffect(() => {
    if (forceOpen && externalTab != null) setInternalTab(externalTab)
  }, [externalTab])

  const activeTab = forceOpen ? internalTab : (externalTab ?? null)

  function handleTabClick(tabId) {
    if (forceOpen) {
      setInternalTab(tabId)
    } else {
      // Toggle: clicking active tab closes panel
      onTabChange?.(activeTab === tabId ? null : tabId)
    }
  }

  function handleClose() {
    if (forceOpen) {
      setInternalTab('research')
    } else {
      onTabChange?.(null)
    }
  }

  const isOpen = activeTab !== null

  return (
    <section
      className={forceOpen ? 'flex-1 min-h-0 flex flex-col' : 'flex-shrink-0 flex flex-col'}
      style={{
        background: '#0a1f35',
        borderTop: isOpen || forceOpen ? '1px solid #1a4a7a' : 'none',
      }}
      aria-label="Research and Media Hub"
    >
      {/* Tab bar — mobile only (forceOpen) */}
      {forceOpen && (
        <div
          className="flex items-center overflow-x-auto"
          style={{ borderBottom: '1px solid #1a4a7a', minHeight: 40 }}
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
        </div>
      )}

      {/* Content panel */}
      {isOpen && (
        <div style={forceOpen ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' } : { height: CONTENT_HEIGHT, overflow: 'hidden' }}>
          <div className={forceOpen ? 'flex-1 min-h-0 overflow-y-auto' : 'h-full overflow-y-auto'} style={{ background: '#050e1a' }}>
            {/* Close button — desktop only */}
            {!forceOpen && (
              <div className="flex justify-end px-3 pt-1.5 pb-0.5">
                <button
                  onClick={() => onTabChange?.(null)}
                  className="text-slate-500 hover:text-white text-base leading-none transition-colors"
                  title="Close panel"
                  type="button"
                >
                  ×
                </button>
              </div>
            )}
            <Suspense fallback={<TabFallback />}>
              {activeTab === 'research'  && <ResearchHub />}
              {activeTab === 'youtube'   && <YouTubeTab />}
              {activeTab === 'tiktok'    && <TikTokTab />}
              {activeTab === 'streaming' && <StreamingTab />}
              {activeTab === 'socials'   && <SocialsTab />}
              {activeTab === 'aquarium'   && <AquariumCamsTab />}
              {activeTab === 'species'    && <SpeciesEncyclopedia />}
              {activeTab === 'flashcards' && <SharkFlashcards onClose={handleClose} />}
              {activeTab === 'history'    && <SharkHistoryTab />}
            </Suspense>
          </div>
        </div>
      )}
    </section>
  )
}
