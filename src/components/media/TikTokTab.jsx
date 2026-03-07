import { useState } from 'react'
import { useTikTokFeed } from '../../hooks/useTikTokFeed'
import { CATEGORY_META } from '../../data/sharkTikToks'

const ALL_CATEGORIES = Object.entries(CATEGORY_META).map(([id, m]) => ({ id, ...m }))

function VideoCard({ video, expanded, onToggle }) {
  const cat = CATEGORY_META[video.category] || { label: video.category, color: '#94a3b8' }

  return (
    <div
      className="rounded-lg overflow-hidden flex flex-col transition-colors"
      style={{ background: '#070f1c', border: `1px solid ${expanded ? cat.color + '99' : '#1a4a7a'}` }}
    >
      {/* ── Clickable header ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-start gap-3 p-3 w-full text-left group hover:bg-[#0a1f35] transition-colors"
      >
        {/* Thumbnail / placeholder */}
        <div
          className="flex-shrink-0 rounded overflow-hidden relative"
          style={{ width: 52, height: 74, background: '#0a1f35' }}
        >
          {video.thumb ? (
            <img
              src={video.thumb}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl" aria-hidden="true">
              🦈
            </div>
          )}
          {/* Play badge */}
          {!expanded && (
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              aria-hidden="true"
            >
              <span className="text-white font-bold text-sm">▶</span>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
              style={{ background: cat.color + '22', color: cat.color }}
            >
              {cat.label}
            </span>
            <span className="text-[10px] font-bold flex-shrink-0" style={{ color: cat.color }}>
              @{video.handle}
            </span>
            <span className="ml-auto text-[10px] text-slate-600 flex-shrink-0">{video.year}</span>
          </div>

          <p
            className="text-xs text-slate-200 leading-snug"
            style={{
              display:         '-webkit-box',
              WebkitLineClamp: expanded ? 'unset' : 3,
              WebkitBoxOrient: 'vertical',
              overflow:        expanded ? 'visible' : 'hidden',
            }}
          >
            {video.desc}
          </p>

          <p className="text-[10px] mt-1.5" style={{ color: cat.color + 'bb' }}>
            {expanded ? '▲ collapse' : '▶ play'}
          </p>
        </div>
      </button>

      {/* ── TikTok iframe player ─────────────────────────────────────────── */}
      {expanded && (
        <div className="flex justify-center px-3 pb-3">
          <iframe
            src={`https://www.tiktok.com/embed/v2/${video.videoId}?lang=en-US`}
            title={video.desc}
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
            style={{ width: '100%', maxWidth: 340, height: 620, border: 'none', borderRadius: 8 }}
            loading="lazy"
          />
        </div>
      )}
    </div>
  )
}

export function TikTokTab() {
  const videos = useTikTokFeed()
  const [expandedId,  setExpandedId]  = useState(null)
  const [filterCat,   setFilterCat]   = useState(null)
  const [search,      setSearch]      = useState('')

  function toggle(id) {
    setExpandedId(prev => prev === id ? null : id)
  }

  const displayed = videos.filter(v => {
    if (filterCat && v.category !== filterCat) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return v.desc.toLowerCase().includes(q) ||
             v.handle.toLowerCase().includes(q) ||
             v.name.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 300 }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex flex-col gap-1.5 px-3 py-2"
        style={{ borderBottom: '1px solid #1a4a7a', background: '#050e1a' }}
      >
        {/* Row 1: badge + search */}
        <div className="flex items-center gap-2">
          <span
            className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded"
            style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid #f97316aa' }}
          >
            TikTok
          </span>
          <input
            type="text"
            placeholder="Search videos…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-xs px-2 py-1 rounded outline-none"
            style={{ background: '#0a1f35', border: '1px solid #1a4a7a', color: '#e2e8f0', minWidth: 0 }}
          />
        </div>

        {/* Row 2: category chips */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterCat(null)}
            type="button"
            className="text-[10px] px-2.5 py-0.5 rounded-full font-medium transition-colors"
            style={{
              background: !filterCat ? '#38bdf8' : 'rgba(255,255,255,0.05)',
              color:      !filterCat ? '#050e1a' : '#94a3b8',
            }}
          >
            All ({videos.length})
          </button>
          {ALL_CATEGORIES.map(cat => {
            const count = videos.filter(v => v.category === cat.id).length
            const active = filterCat === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setFilterCat(active ? null : cat.id)}
                type="button"
                className="text-[10px] px-2.5 py-0.5 rounded-full transition-colors"
                style={{
                  background: active ? cat.color : 'rgba(255,255,255,0.05)',
                  color:      active ? '#050e1a' : '#94a3b8',
                }}
              >
                {cat.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Video list ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {displayed.map(video => (
          <VideoCard
            key={video.videoId}
            video={video}
            expanded={expandedId === video.videoId}
            onToggle={() => toggle(video.videoId)}
          />
        ))}

        {displayed.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8">No videos match your filter.</p>
        )}

        {displayed.length > 0 && (
          <div className="text-center py-2 space-y-1">
            <p className="text-[10px] text-slate-700">
              {displayed.length} hand-picked videos · all pre-screened for quality
            </p>
            <a
              href="https://www.tiktok.com/tag/sharkscience"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              Browse #sharkscience on TikTok ↗
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
