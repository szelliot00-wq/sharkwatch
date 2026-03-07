import { useState } from 'react'
import { useSharkSocialFeed, FEED_ACCOUNTS } from '../../hooks/useSharkSocialFeed'

const CATEGORY_COLORS = {
  research:     '#38bdf8',
  conservation: '#4ade80',
  scientist:    '#a78bfa',
  aquarium:     '#f97316',
}

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

function TweetCard({ tweet }) {
  const color = CATEGORY_COLORS[tweet.category] || '#94a3b8'
  return (
    <article
      className="rounded-lg p-3 flex flex-col gap-1.5"
      style={{ background: '#070f1c', border: '1px solid #1a4a7a' }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Category dot */}
        <span
          className="flex-shrink-0 w-2 h-2 rounded-full"
          style={{ background: color }}
          aria-hidden="true"
        />
        {/* Handle */}
        <a
          href={`https://twitter.com/${tweet.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold truncate hover:underline"
          style={{ color }}
          aria-label={`@${tweet.handle} on X/Twitter`}
        >
          @{tweet.handle}
        </a>
        {/* Name */}
        <span className="text-[10px] text-slate-500 truncate hidden sm:inline">{tweet.name}</span>
        {/* Time — pushed right */}
        {tweet.date && (
          <span
            className="ml-auto flex-shrink-0 text-[10px] text-slate-600"
            title={tweet.date.toLocaleString()}
          >
            {relTime(tweet.date)}
          </span>
        )}
      </div>

      {/* Tweet text */}
      <p className="text-[13px] text-slate-200 leading-snug break-words">
        {tweet.text}
      </p>

      {/* Link to original */}
      <a
        href={tweet.url}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start text-[10px] text-slate-600 hover:text-slate-400 transition-colors mt-0.5"
      >
        View on X ↗
      </a>
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
        <div className="w-2 h-2 rounded-full bg-slate-700" />
        <div className="h-3 w-24 rounded bg-slate-700" />
        <div className="ml-auto h-3 w-10 rounded bg-slate-700" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded bg-slate-800" />
        <div className="h-3 w-5/6 rounded bg-slate-800" />
        <div className="h-3 w-2/3 rounded bg-slate-800" />
      </div>
    </div>
  )
}

export function SocialsTab() {
  const { tweets, loading, error, lastRefresh, refresh } = useSharkSocialFeed()
  const [filterHandle, setFilterHandle] = useState(null)

  const displayed = filterHandle ? tweets.filter(t => t.handle === filterHandle) : tweets

  // ── Error states ────────────────────────────────────────────────────────────
  const errorMessages = {
    nitter_unavailable: (
      <div className="text-center p-6 space-y-2">
        <p className="text-slate-300 text-sm font-medium">Twitter/X feed unavailable</p>
        <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
          The feed relies on Nitter (an open-source X/Twitter mirror). X/Twitter is currently
          blocking all Nitter instances. This typically resolves within a few hours.
        </p>
        <button
          onClick={refresh}
          type="button"
          className="mt-3 px-4 py-1.5 rounded text-xs font-medium transition-colors"
          style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid #38bdf8' }}
        >
          Try again
        </button>
      </div>
    ),
    no_data: (
      <div className="text-center p-6">
        <p className="text-slate-400 text-sm">No tweets retrieved — feed sources may be slow.</p>
        <button onClick={refresh} type="button" className="mt-3 text-xs text-[#38bdf8] hover:underline">
          Retry
        </button>
      </div>
    ),
    fetch_error: (
      <div className="text-center p-6">
        <p className="text-slate-400 text-sm">Network error fetching feed.</p>
        <button onClick={refresh} type="button" className="mt-3 text-xs text-[#38bdf8] hover:underline">
          Retry
        </button>
      </div>
    ),
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 300 }}>
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3 py-2 flex-shrink-0 overflow-x-auto"
        style={{ borderBottom: '1px solid #1a4a7a', background: '#050e1a' }}
      >
        {/* Account filter pills */}
        <button
          onClick={() => setFilterHandle(null)}
          type="button"
          className="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors"
          style={{
            background: !filterHandle ? '#38bdf8' : 'rgba(255,255,255,0.05)',
            color:      !filterHandle ? '#050e1a' : '#94a3b8',
          }}
        >
          All accounts
        </button>
        {FEED_ACCOUNTS.map(a => {
          const active = filterHandle === a.handle
          const color  = CATEGORY_COLORS[a.category] || '#94a3b8'
          return (
            <button
              key={a.handle}
              onClick={() => setFilterHandle(active ? null : a.handle)}
              type="button"
              className="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full transition-colors"
              style={{
                background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
                color:      active ? color : '#94a3b8',
                border:     `1px solid ${active ? color : '#1e3a5a'}`,
              }}
            >
              @{a.handle}
            </button>
          )
        })}

        {/* Spacer + refresh */}
        <div className="ml-auto flex-shrink-0 flex items-center gap-3">
          {lastRefresh && !loading && (
            <span className="text-[10px] text-slate-600 whitespace-nowrap">
              {relTime(lastRefresh)}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            type="button"
            className={`text-sm leading-none transition-colors ${loading ? 'animate-spin text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white'}`}
            title="Refresh feed"
            aria-label="Refresh social feed"
          >
            🔄
          </button>
        </div>
      </div>

      {/* ── Feed ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">

        {/* Loading skeletons */}
        {loading && tweets.length === 0 && (
          <>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </>
        )}

        {/* Error */}
        {!loading && error && tweets.length === 0 && (errorMessages[error] || null)}

        {/* Tweet cards */}
        {displayed.map(tweet => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}

        {/* Empty after filter */}
        {!loading && !error && displayed.length === 0 && tweets.length > 0 && (
          <p className="text-center text-slate-500 text-sm py-8">
            No recent posts from @{filterHandle}
          </p>
        )}

        {/* Footer count */}
        {displayed.length > 0 && (
          <p className="text-center text-[10px] text-slate-700 py-2">
            {displayed.length} posts · auto-refreshes every 5 min
          </p>
        )}
      </div>
    </div>
  )
}
