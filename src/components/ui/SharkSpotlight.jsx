import React, { useState, useEffect } from 'react'
import { getSharkNarrative } from '../../utils/gemini'

export function SharkSpotlight({ shark }) {
  const [narrative, setNarrative] = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (!shark) return
    setNarrative(null)
    setLoading(true)
    getSharkNarrative(shark)
      .then(text => setNarrative(text))
      .catch(() => setNarrative(null))
      .finally(() => setLoading(false))
  }, [shark?.id])

  if (!shark) return null

  return (
    <div
      className="flex-shrink-0"
      style={{ borderBottom: '1px solid #1a4a7a', background: '#050e1a' }}
    >
      {/* Accordion toggle row */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 transition-colors"
        style={{ background: 'transparent' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#0d2847')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f97316' }}>
            🦈 Shark of the Day
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: '#0d2847', color: '#94a3b8' }}
          >
            {shark.name}
          </span>
        </div>
        <span
          className="text-slate-500 text-[10px] transition-transform duration-200 flex-shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {/* Accordion body */}
      {open && (
        <div className="px-3 pb-3">
          {loading ? (
            <div className="space-y-1.5">
              {[100, 90, 75].map(w => (
                <div
                  key={w}
                  className="h-3 rounded animate-pulse"
                  style={{ width: `${w}%`, background: '#1a4a7a' }}
                />
              ))}
            </div>
          ) : narrative ? (
            <p className="text-xs text-slate-300 leading-relaxed">{narrative}</p>
          ) : (
            <p className="text-xs text-slate-500 italic">
              {shark.species} · last seen {shark.daysSinceLastPing === 0 ? 'today' : `${shark.daysSinceLastPing}d ago`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
