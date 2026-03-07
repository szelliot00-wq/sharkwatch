import React, { useState, useEffect } from 'react'
import { AQUARIUM_CAMS, CAM_TYPE_STYLES } from '../../data/aquariumCams'

function LocalClock({ timezone }) {
  const [time, setTime] = useState('')

  function getTime() {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'short',
      }).format(new Date())
    } catch {
      return '--:--'
    }
  }

  useEffect(() => {
    setTime(getTime())
    const interval = setInterval(() => setTime(getTime()), 60000)
    return () => clearInterval(interval)
  }, [timezone])

  return <span className="font-mono text-[#38bdf8]">{time}</span>
}

function CamTypeBadge({ type }) {
  const s = CAM_TYPE_STYLES[type] || CAM_TYPE_STYLES.event
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

function AquariumCard({ cam }) {
  return (
    <a
      href={cam.watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-1.5 p-3 rounded-lg hover:bg-[#162f4f] transition-colors"
      style={{ background: '#0d2847', border: '1px solid #1a4a7a' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white leading-snug">
            {cam.flag} {cam.name}
          </p>
          <p className="text-[10px] text-slate-400">{cam.country}</p>
        </div>
        <CamTypeBadge type={cam.camType} />
      </div>

      {/* Sharks */}
      <p className="text-[10px] text-slate-300">🦈 {cam.sharks}</p>

      {/* Local time + cam note */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500">
          Local time: <LocalClock timezone={cam.timezone} />
        </span>
        <span className="text-[10px] text-slate-500">{cam.camNote}</span>
      </div>

      <span className="text-[10px] text-[#38bdf8]">Watch live ↗</span>
    </a>
  )
}

export function AquariumCamsTab() {
  return (
    <div className="p-4">
      <p className="text-xs text-slate-400 mb-4">
        🕐 Local times update every minute · Click any card to open the webcam
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {AQUARIUM_CAMS.map((cam, i) => (
          <AquariumCard key={i} cam={cam} />
        ))}
      </div>
    </div>
  )
}
