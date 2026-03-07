import React from 'react'
import { SharkCard } from '../sharks/SharkCard'
import { SkeletonCard } from '../ui/LoadingSkeleton'
import { ErrorBanner } from '../ui/ErrorBanner'

export function LeftPanel({
  animals = [],
  loading = false,
  error = null,
  stale = false,
  selectedShark = null,
  onSelect,
  onRefresh,
  favourites = [],
  onToggleFavourite,
  clearFavourites,
}) {
  const isFavourite = name => favourites.includes(name)
  const isFull = favourites.length >= 5

  // Pinned favourites (user-starred, shown first regardless of OCEARCH featured flag)
  const pinned = animals.filter(a => favourites.includes(a.name))
  const featured = animals.filter(a => a.featured && !favourites.includes(a.name))
  const rest = animals
    .filter(a => !a.featured && !favourites.includes(a.name))
    .sort((a, b) => {
      const aTime = a.lastPing ? new Date(a.lastPing).getTime() : 0
      const bTime = b.lastPing ? new Date(b.lastPing).getTime() : 0
      return bTime - aTime
    })

  const totalCount = animals.length

  function renderCard(shark) {
    return (
      <SharkCard
        key={shark.id ?? shark.name}
        shark={shark}
        isSelected={selectedShark?.id === shark.id}
        onClick={() => onSelect?.(shark)}
        isFavourite={isFavourite(shark.name)}
        onToggleFavourite={onToggleFavourite}
        canFavourite={!isFull || isFavourite(shark.name)}
      />
    )
  }

  return (
    <aside
      className="flex flex-col h-full flex-shrink-0"
      style={{ width: 280, minWidth: 280, background: '#0a1f35', borderRight: '1px solid #1a4a7a' }}
      aria-label="Tracked sharks list"
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-3 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #1a4a7a' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base" aria-hidden="true">🦈</span>
          <h2 className="text-sm font-semibold text-white">Tracked Sharks</h2>
        </div>
        <div className="flex items-center gap-2">
          {favourites.length > 0 && clearFavourites && (
            <button
              onClick={clearFavourites}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
              title="Clear all favourites"
            >
              Clear ★
            </button>
          )}
          {totalCount > 0 && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: '#0d2847', color: '#38bdf8', border: '1px solid #1a4a7a' }}
            >
              {totalCount}
            </span>
          )}
        </div>
      </div>

      {(error || stale) && (
        <div className="px-3 pt-3 flex-shrink-0">
          <ErrorBanner message={error} onRetry={onRefresh} stale={stale && !error} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && animals.length === 0 ? (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            {/* ⭐ User favourites — pinned at top */}
            {pinned.length > 0 && (
              <section aria-label="Favourite sharks">
                <div className="px-3 py-1.5 text-xs font-semibold tracking-wider uppercase" style={{ color: '#fbbf24' }}>
                  ★ Favourites ({pinned.length}/5)
                </div>
                <div className="flex flex-col gap-1 px-2 pb-2">
                  {pinned.map(renderCard)}
                </div>
                <div className="mx-3 mb-2" style={{ borderTop: '1px solid #1a4a7a' }} />
              </section>
            )}

            {/* OCEARCH featured sharks */}
            {featured.length > 0 && (
              <section aria-label="Featured sharks">
                <div className="px-3 py-1.5 text-xs font-semibold tracking-wider uppercase" style={{ color: '#f97316' }}>
                  Featured
                </div>
                <div className="flex flex-col gap-1 px-2 pb-2">
                  {featured.map(renderCard)}
                </div>
                {rest.length > 0 && <div className="mx-3 mb-2" style={{ borderTop: '1px solid #1a4a7a' }} />}
              </section>
            )}

            {/* All remaining sharks */}
            {rest.length > 0 && (
              <section aria-label="All tracked sharks">
                {(pinned.length > 0 || featured.length > 0) && (
                  <div className="px-3 py-1.5 text-xs font-semibold tracking-wider uppercase text-slate-500">
                    All sharks
                  </div>
                )}
                <div className="flex flex-col gap-1 px-2 pb-3">
                  {rest.map(renderCard)}
                </div>
              </section>
            )}

            {!loading && animals.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 gap-3 px-4 text-center">
                <span className="text-4xl opacity-30">🦈</span>
                <p className="text-sm text-slate-500">{error ? 'Could not load sharks' : 'No sharks tracked yet'}</p>
              </div>
            )}

            {loading && animals.length > 0 && (
              <div className="px-3 pb-3"><SkeletonCard /></div>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
