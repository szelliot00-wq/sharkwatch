import React from 'react'
import { MoonPhase } from '../ui/MoonPhase'

const RESEARCH_TABS = [
  { id: 'research',  icon: '🦈', label: 'Research' },
  { id: 'youtube',   icon: '🎥', label: 'YouTube'  },
  { id: 'streaming', icon: '📺', label: 'Streaming'},
  { id: 'socials',   icon: '🐦', label: 'Socials'  },
  { id: 'aquarium',  icon: '🏛️', label: 'Cams'     },
  { id: 'species',   icon: '📖', label: 'Species'  },
]

export function Header({ lastUpdated, onRefresh, loading, researchTab, onResearchTab }) {
  function formatUpdated() {
    if (!lastUpdated) return null
    const mins = Math.floor((Date.now() - lastUpdated.getTime()) / 60_000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const updatedLabel = formatUpdated()

  return (
    <header
      className="flex items-center gap-2 px-3 sm:px-4 py-2 flex-shrink-0"
      style={{ background: '#050e1a', borderBottom: '1px solid #1a4a7a', minHeight: 48 }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xl sm:text-2xl leading-none" aria-hidden="true">🦈</span>
        <div className="hidden sm:block">
          <h1 className="text-sm sm:text-base font-bold text-white leading-tight">SharkWatch</h1>
          <p className="text-xs text-slate-400 leading-tight">Global Shark Intelligence</p>
        </div>
      </div>

      {/* Research tab buttons — desktop only */}
      <nav
        className="hidden md:flex items-center gap-0.5 flex-1 justify-center"
        aria-label="Research panels"
      >
        {RESEARCH_TABS.map(tab => {
          const isActive = researchTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onResearchTab?.(isActive ? null : tab.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap"
              style={{
                color: isActive ? '#f97316' : '#94a3b8',
                background: isActive ? 'rgba(249,115,22,0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(249,115,22,0.4)' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#e2e8f0' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#94a3b8' }}
              title={tab.label}
            >
              <span>{tab.icon}</span>
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Controls */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 ml-auto">
        <div className="text-xs text-slate-400 hidden lg:block whitespace-nowrap">
          {loading ? (
            <span className="text-[#38bdf8]">Updating…</span>
          ) : updatedLabel ? (
            <>Updated <span className="text-slate-300">{updatedLabel}</span></>
          ) : null}
        </div>
        <MoonPhase />
        <button
          onClick={onRefresh}
          disabled={loading}
          className={[
            'text-lg leading-none transition-colors',
            loading ? 'text-slate-500 cursor-not-allowed animate-spin' : 'text-slate-300 hover:text-[#38bdf8]',
          ].join(' ')}
          title={loading ? 'Refreshing…' : 'Refresh data'}
          aria-label={loading ? 'Refreshing data' : 'Refresh data'}
          type="button"
        >
          🔄
        </button>
      </div>
    </header>
  )
}
