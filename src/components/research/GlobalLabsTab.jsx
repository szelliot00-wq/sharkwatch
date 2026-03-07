import React, { useState } from 'react'
import { PaperCard } from './PaperCard'

// Skeleton section for loading state
function SkeletonSection() {
  return (
    <div className="flex flex-col gap-2">
      {/* Header skeleton */}
      <div
        className="rounded h-6 w-56 animate-pulse"
        style={{ background: '#1a4a7a' }}
      />
      {/* Cards row skeleton */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
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
        ))}
      </div>
    </div>
  )
}

// Collapsible institution group
function InstitutionGroup({ group }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="flex flex-col gap-2">
      {/* Institution header */}
      <button
        className="flex items-center gap-2 text-left group"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-base leading-none">{group.flag}</span>
        <span className="text-xs font-semibold text-white group-hover:text-slate-200 transition-colors">
          {group.institution}
        </span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ background: '#1a4a7a', color: '#94a3b8' }}
        >
          {group.papers.length} paper{group.papers.length !== 1 ? 's' : ''}
        </span>
        <span
          className="ml-1 text-[10px] text-slate-500 transition-transform duration-150"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}
        >
          ▶
        </span>
      </button>

      {/* Papers horizontal scroll */}
      {open && (
        <div className="flex gap-3 overflow-x-auto pb-2 flex-wrap">
          {group.papers.map(paper => (
            <PaperCard key={paper.paperId} paper={paper} />
          ))}
        </div>
      )}
    </div>
  )
}

export function GlobalLabsTab({ groups, state, onRefresh, getCooldownRemaining }) {
  const cooldown = getCooldownRemaining()

  return (
    <div className="p-3 flex flex-col gap-4">
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

      {/* Loading skeletons */}
      {state.loading && (
        <div className="flex flex-col gap-5">
          <SkeletonSection />
          <SkeletonSection />
          <SkeletonSection />
        </div>
      )}

      {/* Institution groups */}
      {!state.loading && groups.length > 0 && (
        <div className="flex flex-col gap-5">
          {groups.map(group => (
            <InstitutionGroup key={group.institution} group={group} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!state.loading && groups.length === 0 && !state.error && (
        <div
          className="rounded-lg p-4 text-center"
          style={{ background: '#0a1f35', border: '1px solid #1a4a7a' }}
        >
          <p className="text-xs text-slate-400">
            No papers loaded yet.
          </p>
          <button
            onClick={onRefresh}
            className="text-xs mt-1 transition-colors"
            style={{ color: '#38bdf8' }}
          >
            Load global labs
          </button>
        </div>
      )}
    </div>
  )
}
