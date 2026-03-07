import { useState, useEffect } from 'react'
import { getMoonPhase } from '../../utils/moonPhase'
import { getDailyDigest } from '../../utils/gemini'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * DailyDigest — "what's happening in the ocean right now" card.
 *
 * Props:
 *   topShark           object|null   Most active tracked shark ({ name, species })
 *   firstNewsHeadline  string|null   Latest news headline from the feed
 */
export function DailyDigest({ topShark, firstNewsHeadline }) {
  const [digest,  setDigest]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const moon = getMoonPhase()
    getDailyDigest({
      moonEmoji:    moon.emoji,
      moonPhase:    moon.phaseName,
      moonNote:     moon.sharkNote,
      sharkName:    topShark?.name    || 'an untracked shark',
      sharkSpecies: topShark?.species || 'unknown species',
      newsHeadline: firstNewsHeadline || 'shark populations remain under study worldwide',
      dateStr:      todayStr(),
    })
      .then(text => setDigest(text))
      .catch(() => setDigest(null))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once — daily content doesn't change intra-session

  const moon = getMoonPhase()

  if (loading) {
    return (
      <div className="px-3 py-2 flex-shrink-0" style={{ borderBottom: '1px solid #1a4a7a' }}>
        <div className="rounded-lg p-3 space-y-2 animate-pulse" style={{ background: '#0d2847' }}>
          <div className="h-2 bg-[#1a4a7a] rounded w-3/4" />
          <div className="h-2 bg-[#1a4a7a] rounded" />
          <div className="h-2 bg-[#1a4a7a] rounded w-5/6" />
        </div>
      </div>
    )
  }

  if (!digest) return null

  return (
    <div className="px-3 py-2 flex-shrink-0" style={{ borderBottom: '1px solid #1a4a7a' }}>
      <div
        className="rounded-lg p-3 space-y-2"
        style={{ background: '#0d2847', border: '1px solid rgba(56,189,248,0.15)' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm" aria-hidden="true">{moon.emoji}</span>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Today's Ocean Digest
          </p>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed">{digest}</p>
        <p className="text-[10px] text-slate-600">AI-generated · {todayStr()}</p>
      </div>
    </div>
  )
}
