import React from 'react'
import { STREAMING_CONTENT, PLATFORM_STYLES } from '../../data/streamingContent'

export function StreamingTab() {
  return (
    <div className="p-4">
      <p className="text-xs text-slate-400 mb-4">
        🇬🇧 UK streaming links · Updated March 2026
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {STREAMING_CONTENT.map((item, i) => {
          const style = PLATFORM_STYLES[item.platform] || PLATFORM_STYLES.Netflix
          return (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col rounded-lg overflow-hidden hover:scale-[1.02] transition-transform"
              style={{ background: style.bg, border: `1px solid ${style.border}` }}
            >
              {/* Emoji poster */}
              <div
                className="flex items-center justify-center text-5xl"
                style={{ height: 80, background: 'rgba(0,0,0,0.3)' }}
              >
                {item.posterEmoji}
              </div>

              {/* Info */}
              <div className="p-2 flex-1 flex flex-col gap-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-wide self-start px-1.5 py-0.5 rounded"
                  style={{ background: style.badge, color: 'white' }}
                >
                  {item.platform}
                </span>
                <p className="text-xs font-semibold text-white leading-snug">{item.title}</p>
                <p className="text-[10px] text-slate-400">{item.year}</p>
                <p className="text-[10px] text-slate-400 leading-snug line-clamp-3 flex-1">{item.description}</p>
                <span className="text-[10px] text-[#38bdf8] mt-1">Watch now ↗</span>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
