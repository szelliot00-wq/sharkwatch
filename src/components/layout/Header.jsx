import React from 'react'
import { MoonPhase } from '../ui/MoonPhase'

/**
 * Header — top strip header bar for SharkWatch.
 *
 * Props:
 *   lastUpdated  Date | null   Timestamp of last data refresh
 *   onRefresh    function      Called when user clicks the refresh button
 *   loading      boolean       True while a refresh is in progress
 */
export function Header({ lastUpdated, onRefresh, loading }) {
  /**
   * Format the last-updated timestamp into a human-readable relative string.
   */
  function formatUpdated() {
    if (!lastUpdated) return null
    const mins = Math.floor((Date.now() - lastUpdated.getTime()) / 60_000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const updatedLabel = formatUpdated()

  return (
    <header
      className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 gap-4 flex-shrink-0"
      style={{
        background: '#050e1a',
        borderBottom: '1px solid #1a4a7a',
        minHeight: 48,
      }}
    >
      {/* Left — brand */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <span className="text-xl sm:text-2xl leading-none flex-shrink-0" aria-hidden="true">
          🦈
        </span>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-white leading-tight truncate">
            SharkWatch
          </h1>
          {/* Subtitle hidden on mobile to keep the header compact */}
          <p className="text-xs text-slate-400 leading-tight hidden sm:block">
            Global Shark Intelligence
          </p>
        </div>
      </div>

      {/* Right — controls cluster */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        {/* Last-updated timestamp — hidden on mobile, shown md+ */}
        <div className="text-xs text-slate-400 hidden md:block whitespace-nowrap">
          {loading ? (
            <span className="text-[#38bdf8]">Updating…</span>
          ) : updatedLabel ? (
            <>
              Updated{' '}
              <span className="text-slate-300">{updatedLabel}</span>
            </>
          ) : null}
        </div>

        {/* Moon phase widget — always visible */}
        <MoonPhase />

        {/* Refresh button — always visible */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className={[
            'text-lg leading-none transition-colors',
            loading
              ? 'text-slate-500 cursor-not-allowed animate-spin'
              : 'text-slate-300 hover:text-[#38bdf8]',
          ].join(' ')}
          title={loading ? 'Refreshing…' : 'Refresh data'}
          aria-label={loading ? 'Refreshing data' : 'Refresh data'}
          type="button"
        >
          🔄
        </button>
      </div>
    </header>
  )
}
