import { useEffect } from 'react'
import { useResearch } from '../../hooks/useResearch'
import { LemonSharkTab } from './LemonSharkTab'
import { PlymouthTab } from './PlymouthTab'
import { GlobalLabsTab } from './GlobalLabsTab'

const TABS = [
  { key: 'lemon', label: 'Lemon Shark' },
  { key: 'plymouth', label: 'Plymouth' },
  { key: 'global', label: 'Global Labs' },
]

export function ResearchHub() {
  const research = useResearch()

  // Load the lemon tab immediately on mount
  useEffect(() => {
    research.initFetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Determine current tab's state and refresh handler
  const currentState =
    research.activeTab === 'lemon' ? research.lemonState :
    research.activeTab === 'plymouth' ? research.plymouthState :
    research.globalState

  const currentRefresh =
    research.activeTab === 'lemon' ? research.fetchLemon :
    research.activeTab === 'plymouth' ? research.fetchPlymouth :
    research.fetchGlobal

  const cooldown = research.getCooldownRemaining(research.activeTab)
  const refreshDisabled = currentState.loading || cooldown > 0

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: '#050e1a' }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center flex-shrink-0"
        style={{ borderBottom: '1px solid #1a4a7a' }}
      >
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => research.setActiveTab(tab.key)}
            className="px-4 py-2 text-xs font-medium transition-colors relative whitespace-nowrap"
            style={{
              color: research.activeTab === tab.key ? '#f97316' : '#94a3b8',
              borderBottom: research.activeTab === tab.key
                ? '2px solid #f97316'
                : '2px solid transparent',
              marginBottom: -1, // Overlap the container border for a clean active indicator
            }}
          >
            {tab.label}
          </button>
        ))}

        {/* Refresh button — right-aligned */}
        <div className="ml-auto pr-3">
          <button
            onClick={currentRefresh}
            disabled={refreshDisabled}
            className="text-xs transition-colors disabled:opacity-40"
            style={{
              color: refreshDisabled ? '#64748b' : '#94a3b8',
            }}
            title={
              currentState.loading
                ? 'Loading…'
                : cooldown > 0
                ? `Cooldown: ${cooldown}s`
                : 'Refresh papers'
            }
          >
            {currentState.loading
              ? 'Loading...'
              : cooldown > 0
              ? `Refresh (${cooldown}s)`
              : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Tab content — scrollable */}
      <div className="flex-1 overflow-y-auto">
        {research.activeTab === 'lemon' && (
          <LemonSharkTab
            papers={research.lemonPapers}
            state={research.lemonState}
            onRefresh={research.fetchLemon}
            getCooldownRemaining={() => research.getCooldownRemaining('lemon')}
          />
        )}
        {research.activeTab === 'plymouth' && (
          <PlymouthTab
            papers={research.plymouthPapers}
            state={research.plymouthState}
            onRefresh={research.fetchPlymouth}
            getCooldownRemaining={() => research.getCooldownRemaining('plymouth')}
          />
        )}
        {research.activeTab === 'global' && (
          <GlobalLabsTab
            groups={research.globalPapers}
            state={research.globalState}
            onRefresh={research.fetchGlobal}
            getCooldownRemaining={() => research.getCooldownRemaining('global')}
          />
        )}
      </div>
    </div>
  )
}
