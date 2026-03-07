import React, { useState, useEffect } from 'react'
import { getSharkNarrative } from '../../utils/gemini'

/**
 * Shark of the Day — Gemini-generated 3-sentence narrative about the most
 * recently pinged shark. Displayed at the top of the right panel.
 */
export function SharkSpotlight({ shark }) {
  const [narrative, setNarrative] = useState(null)
  const [loading, setLoading] = useState(false)

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
      className="flex-shrink-0 px-3 py-3"
      style={{ borderBottom: '1px solid #1a4a7a', background: '#050e1a' }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
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
  )
}
