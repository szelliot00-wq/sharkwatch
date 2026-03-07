import { useState } from 'react'
import { useSharkSocialFeed } from '../../hooks/useSharkSocialFeed'

function relTime(date) {
  if (!date) return ''
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function PostCard({ post }) {
  return (
    <article
      className="rounded-lg p-3 flex flex-col gap-2"
      style={{ background: '#070f1c', border: '1px solid #1a4a7a' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Avatar */}
        {post.avatar ? (
          <img
            src={post.avatar}
            alt=""
            aria-hidden="true"
            className="flex-shrink-0 rounded-full"
            style={{ width: 28, height: 28, objectFit: 'cover' }}
          />
        ) : (
          <div
            className="flex-shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ width: 28, height: 28, background: '#1a4a7a', color: '#38bdf8' }}
            aria-hidden="true"
          >
            {(post.handle || '?')[0].toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate leading-tight">{post.name}</p>
          <p className="text-[10px] text-slate-500 leading-tight">@{post.handle}</p>
        </div>

        {post.date && (
          <span
            className="flex-shrink-0 text-[10px] text-slate-600"
            title={post.date.toLocaleString()}
          >
            {relTime(post.date)}
          </span>
        )}
      </div>

      {/* Post text */}
      <p className="text-[13px] text-slate-200 leading-snug break-words whitespace-pre-line">
        {post.text}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-4 mt-0.5">
        {post.likeCount > 0 && (
          <span className="text-[10px] text-slate-600">♥ {post.likeCount}</span>
        )}
        {post.repostCount > 0 && (
          <span className="text-[10px] text-slate-600">↻ {post.repostCount}</span>
        )}
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-[10px] text-slate-600 hover:text-[#38bdf8] transition-colors"
        >
          View on Bluesky ↗
        </a>
      </div>
    </article>
  )
}

function SkeletonCard() {
  return (
    <div
      className="rounded-lg p-3 space-y-2 animate-pulse"
      style={{ background: '#070f1c', border: '1px solid #1a4a7a' }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-slate-800 flex-shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="h-2.5 w-28 rounded bg-slate-800" />
          <div className="h-2 w-20 rounded bg-slate-800" />
        </div>
        <div className="h-2.5 w-10 rounded bg-slate-800" />
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 w-full rounded bg-slate-800" />
        <div className="h-2.5 w-5/6 rounded bg-slate-800" />
        <div className="h-2.5 w-2/3 rounded bg-slate-800" />
      </div>
    </div>
  )
}

export function SocialsTab() {
  const { posts, loading, error, lastRefresh, refresh } = useSharkSocialFeed()
  const [search, setSearch] = useState('')

  const displayed = search.trim()
    ? posts.filter(p =>
        p.text.toLowerCase().includes(search.toLowerCase()) ||
        p.handle.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : posts

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 300 }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid #1a4a7a', background: '#050e1a' }}
      >
        {/* Platform badge */}
        <span
          className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded"
          style={{ background: 'rgba(0,133,255,0.15)', color: '#0085ff', border: '1px solid #0085ff55' }}
        >
          Bluesky
        </span>

        {/* Search / filter */}
        <input
          type="text"
          placeholder="Filter posts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-xs px-2 py-1 rounded outline-none"
          style={{
            background:  '#0a1f35',
            border:      '1px solid #1a4a7a',
            color:       '#e2e8f0',
            minWidth:    0,
          }}
        />

        {/* Last refresh + refresh button */}
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
            title="Refresh feed"
            aria-label="Refresh social feed"
          >
            🔄
          </button>
        </div>
      </div>

      {/* ── Feed ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">

        {/* Loading */}
        {loading && posts.length === 0 && (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        )}

        {/* Error */}
        {!loading && error && posts.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <p className="text-slate-300 text-sm">
              {error === 'no_data' ? 'No posts retrieved right now.' : 'Unable to load social feed.'}
            </p>
            <button
              onClick={refresh}
              type="button"
              className="text-xs text-[#38bdf8] hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Posts */}
        {displayed.map(post => (
          <PostCard key={post.id} post={post} />
        ))}

        {/* Empty after filter */}
        {!loading && !error && displayed.length === 0 && posts.length > 0 && (
          <p className="text-center text-slate-500 text-sm py-8">
            No posts match "{search}"
          </p>
        )}

        {/* Footer */}
        {displayed.length > 0 && (
          <p className="text-center text-[10px] text-slate-700 py-2">
            {displayed.length} posts · auto-refreshes every 5 min
          </p>
        )}
      </div>
    </div>
  )
}
