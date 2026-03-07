import { useState, useEffect } from 'react'
import { getSharkHistory } from '../../utils/gemini'

const CATEGORY_COLOR = {
  research:     '#38bdf8',
  discovery:    '#a78bfa',
  conservation: '#4ade80',
  encounter:    '#fb923c',
  milestone:    '#f472b6',
}

const CATEGORY_ICON = {
  research:     '🔬',
  discovery:    '🌊',
  conservation: '🛡️',
  encounter:    '🦈',
  milestone:    '🏆',
}

function todayMonthDay() {
  const d = new Date()
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayDateLabel() {
  return new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' })
}

export function SharkHistoryTab() {
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  function load() {
    setLoading(true)
    setError(false)
    getSharkHistory(todayMonthDay(), todayDateLabel())
      .then(data => {
        if (!data || data.length === 0) { setError(true); return }
        setEvents(data)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Researching shark history…</p>
      </div>
    )
  }

  if (error || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <p className="text-4xl" aria-hidden="true">📅</p>
        <p className="text-slate-300 text-sm">Couldn't load history for today.</p>
        <button onClick={load} className="text-xs text-[#38bdf8] hover:underline" type="button">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
        This week in shark history · {todayDateLabel()}
      </p>

      {events.map((event, i) => {
        const color = CATEGORY_COLOR[event.category] || '#94a3b8'
        const icon  = CATEGORY_ICON[event.category]  || '📅'
        return (
          <div
            key={i}
            className="rounded-xl p-4 space-y-2"
            style={{ background: '#070f1c', border: `1px solid ${color}33` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden="true">{icon}</span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                style={{ background: color + '22', color }}
              >
                {event.category}
              </span>
              <span
                className="ml-auto text-sm font-bold tabular-nums"
                style={{ color }}
              >
                {event.year}
              </span>
            </div>
            <p className="text-sm font-semibold text-white leading-snug">{event.title}</p>
            <p className="text-xs text-slate-300 leading-relaxed">{event.narrative}</p>
          </div>
        )
      })}

      <p className="text-[10px] text-slate-600 text-center pt-1">
        AI-generated historical context — new events each day
      </p>
    </div>
  )
}
