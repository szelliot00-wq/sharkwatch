import React, { useState } from 'react'
import { useINaturalist } from '../../hooks/useINaturalist'
import { useNewsFeeds } from '../../hooks/useNewsFeeds'
import { SkeletonLine } from '../ui/LoadingSkeleton'
import { ErrorBanner } from '../ui/ErrorBanner'
import { DailyDigest } from './DailyDigest'

function formatTimeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const SOURCE_STYLES = {
  TrackingSharks:          { bg: '#0c3054', color: '#38bdf8',  label: 'TrackingSharks' },
  'Shark Research Institute': { bg: '#1a3a1a', color: '#4ade80', label: 'SRI' },
  iNaturalist:             { bg: '#1a2e0a', color: '#86efac',  label: 'iNat' },
}

function SourceBadge({ source }) {
  const s = SOURCE_STYLES[source] || { bg: '#1a1a2e', color: '#94a3b8', label: source }
  return (
    <span
      className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

function SightingItem({ sighting }) {
  return (
    <a
      href={sighting.inatUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-2 p-2 hover:bg-[#162f4f] transition-colors group"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-[#1a4a7a]">
        {sighting.photoUrl ? (
          <img
            src={sighting.photoUrl}
            alt={sighting.commonName}
            className="w-full h-full object-cover"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">🦈</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <SourceBadge source="iNaturalist" />
          <span className="text-[10px] text-slate-500">{formatTimeAgo(sighting.createdAt)}</span>
        </div>
        <p className="text-xs font-medium text-white truncate group-hover:text-[#38bdf8]">
          {sighting.commonName}
        </p>
        <p className="text-[10px] text-slate-500 italic truncate">{sighting.speciesName}</p>
        <p className="text-[10px] text-slate-400 truncate">📍 {sighting.location}</p>
      </div>
    </a>
  )
}

function NewsItem({ item }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-1 p-2 hover:bg-[#162f4f] transition-colors group"
    >
      <div className="flex items-center gap-1.5">
        <SourceBadge source={item.source} />
        <span className="text-[10px] text-slate-500">{formatTimeAgo(item.pubDate)}</span>
      </div>
      <p className="text-xs font-medium text-slate-200 leading-snug group-hover:text-[#38bdf8] line-clamp-2">
        {item.title}
      </p>
    </a>
  )
}

export function RightPanel({ topShark }) {
  const {
    sightings, loading: sightLoading, error: sightError, stale: sightStale,
    lastUpdated: sightUpdated, refresh: refreshSightings,
  } = useINaturalist()

  const {
    items: newsItems, loading: newsLoading, error: newsError, stale: newsStale,
    refresh: refreshNews,
  } = useNewsFeeds()

  const [tab, setTab] = useState('all')

  const loading = sightLoading || newsLoading

  function handleRefreshAll() {
    refreshSightings()
    refreshNews()
  }

  // Build merged chronological feed
  const merged = [
    ...sightings.map(s => ({ type: 'sighting', date: s.createdAt, data: s })),
    ...newsItems.map(n => ({ type: 'news', date: n.pubDate, data: n })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))

  const displayed =
    tab === 'sightings' ? merged.filter(i => i.type === 'sighting') :
    tab === 'news'      ? merged.filter(i => i.type === 'news') :
    merged

  const sightCount = sightings.length
  const newsCount  = newsItems.length

  return (
    <aside
      className="flex flex-col h-full flex-shrink-0"
      style={{ width: 260, minWidth: 260, background: '#0a1f35', borderLeft: '1px solid #1a4a7a' }}
      aria-label="Live sightings and news"
    >
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2" style={{ borderBottom: '1px solid #1a4a7a' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-white">Live Sightings &amp; News</h2>
          <button
            onClick={handleRefreshAll}
            disabled={loading}
            className="text-slate-400 hover:text-[#38bdf8] transition-colors text-xs disabled:opacity-40"
            title="Refresh feeds"
          >
            <span className={loading ? 'animate-spin inline-block' : ''}>🔄</span>
          </button>
        </div>

        {/* Tab filters */}
        <div className="flex gap-1">
          {[
            { key: 'all',      label: `All (${sightCount + newsCount})` },
            { key: 'sightings', label: `🔵 ${sightCount}` },
            { key: 'news',     label: `📰 ${newsCount}` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="text-[10px] px-2 py-0.5 rounded transition-colors"
              style={{
                background: tab === key ? '#f97316' : '#0d2847',
                color: tab === key ? 'white' : '#94a3b8',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Daily digest — AI-generated ocean summary */}
      <DailyDigest
        topShark={topShark}
        firstNewsHeadline={newsItems[0]?.title || null}
      />

      {/* Error banners */}
      {(sightError || sightStale) && (
        <div className="px-2 pt-2 flex-shrink-0">
          <ErrorBanner message={sightError} stale={sightStale} onRetry={refreshSightings} />
        </div>
      )}
      {(newsError || newsStale) && (
        <div className="px-2 pt-2 flex-shrink-0">
          <ErrorBanner message={newsError} stale={newsStale} onRetry={refreshNews} />
        </div>
      )}

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: '#0d2847' }}>
        {loading && displayed.length === 0 ? (
          <div className="p-2 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-2 p-2">
                <div className="w-12 h-12 rounded bg-[#1a4a7a] animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <SkeletonLine width="50%" height={10} />
                  <SkeletonLine width="90%" height={12} />
                  <SkeletonLine width="65%" height={10} />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-slate-500 text-xs text-center px-4">No items to show</p>
          </div>
        ) : (
          displayed.map((item, i) =>
            item.type === 'sighting'
              ? <SightingItem key={`s-${item.data.id}`} sighting={item.data} />
              : <NewsItem key={`n-${i}`} item={item.data} />
          )
        )}
      </div>

      {/* Footer */}
      <div
        className="flex-shrink-0 px-3 py-1.5 text-[10px] text-slate-500"
        style={{ borderTop: '1px solid #1a4a7a' }}
      >
        {sightUpdated
          ? `Updated ${formatTimeAgo(sightUpdated)} · auto-refreshes every 30 min`
          : 'Auto-refreshes every 30 min'
        }
      </div>
    </aside>
  )
}
