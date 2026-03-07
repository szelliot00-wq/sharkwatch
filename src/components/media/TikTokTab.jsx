import { useState } from 'react'
import { useTikTokFeed } from '../../hooks/useTikTokFeed'

function relTime(date) {
  if (!date) return ''
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/**
 * TikTok video card — shows thumbnail/placeholder + metadata.
 * Click to expand the TikTok embed player inline.
 */
function VideoCard({ video, expanded, onToggle }) {
  return (
    <div
      className="rounded-lg overflow-hidden flex flex-col"
      style={{ background: '#070f1c', border: `1px solid ${expanded ? '#f97316' : '#1a4a7a'}` }}
    >
      {/* ── Clickable header ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-start gap-3 p-3 w-full text-left group hover:bg-[#0a1f35] transition-colors"
      >
        {/* Thumbnail */}
        <div
          className="flex-shrink-0 rounded overflow-hidden relative"
          style={{ width: 56, height: 80 }}
        >
          {video.thumb ? (
            <img
              src={video.thumb}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-xl"
              style={{ background: '#0a1f35' }}
              aria-hidden="true"
            >
              🦈
            </div>
          )}
          {/* Play overlay */}
          {!expanded && (
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(249,115,22,0.7)' }}
              aria-hidden="true"
            >
              <span className="text-white text-sm">▶</span>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex-1 min-w-0">
          {/* Creator + time */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-semibold text-[#f97316]">@{video.handle}</span>
            {video.boosted && (
              <span
                className="text-[9px] px-1 py-0.5 rounded font-semibold"
                style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}
              >
                🎓 edu
              </span>
            )}
            {video.date && (
              <span className="ml-auto text-[10px] text-slate-600 flex-shrink-0">
                {relTime(video.date)}
              </span>
            )}
          </div>

          {/* Title */}
          <p
            className="text-xs text-slate-200 leading-snug"
            style={{
              display:          '-webkit-box',
              WebkitLineClamp:  expanded ? 'unset' : 3,
              WebkitBoxOrient:  'vertical',
              overflow:         expanded ? 'visible' : 'hidden',
            }}
          >
            {video.title || 'Shark video'}
          </p>

          {/* Expand/collapse hint */}
          <p className="text-[10px] text-slate-600 mt-1">
            {expanded ? '▲ collapse' : '▶ play video'}
          </p>
        </div>
      </button>

      {/* ── TikTok embed (portrait iframe) ────────────────────────────────── */}
      {expanded && (
        <div className="flex justify-center px-3 pb-3">
          <iframe
            src={`https://www.tiktok.com/embed/v2/${video.videoId}?lang=en-US`}
            title={video.title || 'Shark TikTok video'}
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
            style={{
              width:  '100%',
              maxWidth: 360,
              height: 640,
              border: 'none',
              borderRadius: 8,
            }}
            loading="lazy"
          />
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div
      className="rounded-lg p-3 flex items-start gap-3 animate-pulse"
      style={{ background: '#070f1c', border: '1px solid #1a4a7a' }}
    >
      <div className="flex-shrink-0 rounded" style={{ width: 56, height: 80, background: '#1a4a7a' }} />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-2.5 w-24 rounded bg-slate-800" />
        <div className="h-2.5 w-full rounded bg-slate-800" />
        <div className="h-2.5 w-5/6 rounded bg-slate-800" />
        <div className="h-2.5 w-2/3 rounded bg-slate-800" />
      </div>
    </div>
  )
}

export function TikTokTab() {
  const { videos, loading, error, lastRefresh, refresh } = useTikTokFeed()
  const [expandedId, setExpandedId] = useState(null)
  const [search,     setSearch]     = useState('')

  function toggle(id) {
    setExpandedId(prev => prev === id ? null : id)
  }

  const displayed = search.trim()
    ? videos.filter(v =>
        v.title.toLowerCase().includes(search.toLowerCase()) ||
        v.handle.toLowerCase().includes(search.toLowerCase())
      )
    : videos

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 300 }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid #1a4a7a', background: '#050e1a' }}
      >
        {/* Platform badge */}
        <span
          className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid #f97316aa' }}
        >
          TikTok
        </span>

        {/* Search */}
        <input
          type="text"
          placeholder="Filter videos…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-xs px-2 py-1 rounded outline-none"
          style={{ background: '#0a1f35', border: '1px solid #1a4a7a', color: '#e2e8f0', minWidth: 0 }}
        />

        {/* Refresh */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {lastRefresh && !loading && (
            <span className="text-[10px] text-slate-600 whitespace-nowrap hidden sm:inline">
              {relTime(lastRefresh)}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            type="button"
            className={`text-sm leading-none transition-colors ${
              loading ? 'animate-spin text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white'
            }`}
            title="Refresh"
            aria-label="Refresh TikTok feed"
          >
            🔄
          </button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">

        {/* Loading skeletons */}
        {loading && videos.length === 0 && (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        )}

        {/* Error states */}
        {!loading && error && videos.length === 0 && (
          <div className="text-center py-8 space-y-3 px-4">
            {error === 'rsshub_unavailable' ? (
              <>
                <p className="text-2xl" aria-hidden="true">🎵</p>
                <p className="text-slate-300 text-sm font-medium">TikTok feed unavailable</p>
                <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
                  The feed relies on RSSHub to bridge TikTok's closed platform. RSSHub's
                  TikTok routes are currently blocked or rate-limited.
                </p>
                <a
                  href="https://www.tiktok.com/tag/sharks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs px-4 py-2 rounded font-medium transition-colors"
                  style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid #f97316' }}
                >
                  Browse #sharks on TikTok ↗
                </a>
              </>
            ) : (
              <>
                <p className="text-slate-400 text-sm">Unable to load TikTok feed.</p>
                <button onClick={refresh} type="button" className="text-xs text-[#f97316] hover:underline">
                  Try again
                </button>
              </>
            )}
          </div>
        )}

        {/* Video cards */}
        {displayed.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            expanded={expandedId === video.id}
            onToggle={() => toggle(video.id)}
          />
        ))}

        {/* Empty after filter */}
        {!loading && !error && displayed.length === 0 && videos.length > 0 && (
          <p className="text-center text-slate-500 text-sm py-8">No videos match "{search}"</p>
        )}

        {/* Footer */}
        {displayed.length > 0 && (
          <div className="text-center py-2 space-y-1">
            <p className="text-[10px] text-slate-700">
              {displayed.length} videos · gore &amp; clickbait filtered · refreshes every 10 min
            </p>
            <a
              href="https://www.tiktok.com/tag/sharks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              Browse more on TikTok ↗
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
