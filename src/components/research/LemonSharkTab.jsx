import React from 'react'
import { PaperCard } from './PaperCard'

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div
      className="flex-shrink-0 rounded-lg animate-pulse"
      style={{
        width: 200,
        height: 140,
        background: '#0d2847',
        border: '1px solid #1a4a7a',
      }}
    >
      <div className="p-3 flex flex-col gap-2">
        <div className="rounded h-3 w-full" style={{ background: '#1a4a7a' }} />
        <div className="rounded h-3 w-4/5" style={{ background: '#1a4a7a' }} />
        <div className="rounded h-2 w-2/3 mt-1" style={{ background: '#122e50' }} />
        <div className="rounded h-2 w-full mt-1" style={{ background: '#122e50' }} />
        <div className="rounded h-2 w-3/4" style={{ background: '#122e50' }} />
      </div>
    </div>
  )
}

export function LemonSharkTab({ papers, state, onRefresh, getCooldownRemaining }) {
  const cooldown = getCooldownRemaining()

  return (
    <div className="p-3 flex flex-col gap-3">
      {/* Context card */}
      <div
        className="rounded-lg p-3 flex-shrink-0"
        style={{ background: '#0a1f35', border: '1px solid #1a4a7a' }}
      >
        <p className="text-xs font-semibold text-white mb-1">Lemon Shark Research</p>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Lemon sharks (<span className="italic">Negaprion brevirostris</span>) are the
          best-studied shark species in the world. The Bimini Biological Field Station in
          the Bahamas has tracked the same individual population continuously since 1990 —
          one of the longest-running shark studies on Earth.
        </p>
        <p className="text-[10px] text-slate-500 mt-1.5">
          Key institutions:{' '}
          <span style={{ color: '#38bdf8' }}>Bimini Biological Field Station</span>
          {' · '}
          <span style={{ color: '#38bdf8' }}>University of Miami SRC</span>
          {' · '}
          <span style={{ color: '#38bdf8' }}>Mote Marine Lab</span>
        </p>
      </div>

      {/* Error banner */}
      {state.error && (
        <div
          className="rounded-lg px-3 py-2 flex items-center justify-between flex-shrink-0"
          style={{ background: '#2d0a0a', border: '1px solid #7f1d1d' }}
        >
          <p className="text-[11px] text-red-400">{state.error}</p>
          <button
            onClick={onRefresh}
            disabled={cooldown > 0}
            className="text-[11px] font-medium ml-3 disabled:opacity-40 transition-opacity"
            style={{ color: '#f97316' }}
          >
            {cooldown > 0 ? `Retry in ${cooldown}s` : 'Retry'}
          </button>
        </div>
      )}

      {/* Papers row */}
      {state.loading ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : papers.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 flex-wrap">
          {papers.map(paper => (
            <PaperCard key={paper.paperId} paper={paper} />
          ))}
        </div>
      ) : !state.error ? (
        <div
          className="rounded-lg p-4 text-center flex-shrink-0"
          style={{ background: '#0a1f35', border: '1px solid #1a4a7a' }}
        >
          <p className="text-xs text-slate-400">No papers loaded yet.</p>
          <button
            onClick={onRefresh}
            className="text-xs mt-1 transition-colors"
            style={{ color: '#38bdf8' }}
          >
            Load papers
          </button>
        </div>
      ) : null}
    </div>
  )
}
