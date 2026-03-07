import { useState } from 'react'
import { SkeletonPhoto } from '../ui/LoadingSkeleton'

/**
 * PhotoOfDay — hero banner photo component.
 *
 * Props:
 *   photo       object        Photo data from usePhotoOfDay hook
 *   loading     boolean       True while photo is being fetched
 *   error       string|null   Error message, or null if none
 *   onShowNext  function      Called to advance to next photo in pool
 *   hasMore     boolean       True when more photos are available in pool
 *
 * Photo object shape (Unsplash or iNaturalist):
 *   {
 *     id, urls: { regular, full },
 *     user: { name, links: { html } },
 *     description, alt_description,
 *     links: { download_location },
 *     source: 'unsplash' | 'iNaturalist',
 *     // iNaturalist additions:
 *     taxonName, taxonCommon, location
 *   }
 */
export function PhotoOfDay({ photo, loading, error, onShowNext, hasMore }) {
  const [infoExpanded, setInfoExpanded] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [expanded, setExpanded] = useState(true)

  // ── Collapsed strip — always available ────────────────────────────────────
  if (!expanded) {
    const imageUrl = photo?.urls?.regular || photo?.urls?.full || null
    const commonName = photo?.taxonCommon || photo?.description || photo?.alt_description || null
    return (
      <div
        className="flex-shrink-0 flex items-center gap-2 px-3"
        style={{ height: 40, background: '#0a1f35', borderBottom: '1px solid #1a4a7a' }}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 3, flexShrink: 0, opacity: 0.85 }}
          />
        )}
        <span className="text-[11px] text-slate-400 flex-1 truncate">
          {loading ? 'Loading photo…' : commonName ? `📷 ${commonName}` : '📷 Photo of the Day'}
        </span>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex-shrink-0 text-[10px] text-slate-500 hover:text-[#38bdf8] transition-colors whitespace-nowrap"
        >
          expand ▼
        </button>
      </div>
    )
  }

  // ── Expanded: loading ─────────────────────────────────────────────────────
  if (loading && !photo) {
    return <SkeletonPhoto />
  }

  // ------------------------------------------------------------------- error
  if (error && !photo) {
    return (
      <div
        className="relative w-full flex items-center justify-center overflow-hidden rounded-b-lg"
        style={{
          height: 220,
          background: '#0a1f35',
          border: '1px solid #1a4a7a',
        }}
        aria-label="Photo unavailable"
      >
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <span className="text-5xl opacity-20" aria-hidden="true">
            🦈
          </span>
          <p className="text-sm text-slate-500">Photo unavailable</p>
          {error && <p className="text-xs text-slate-600">{error}</p>}
        </div>
      </div>
    )
  }

  // Nothing to show yet
  if (!photo) return null

  // -------------------------------------------------------------- derived data
  const isUnsplash = photo.source === 'unsplash' || !photo.source
  const isINat = photo.source === 'iNaturalist'

  // Caption text — prefer iNaturalist taxon names, fall back to description
  const commonName =
    photo.taxonCommon ||
    photo.description ||
    photo.alt_description ||
    'Shark'

  const scientificName = photo.taxonName || null
  const locationLabel = photo.location || null

  // Photographer attribution (required by Unsplash ToS)
  const photographerName = photo.user?.name || null
  const photographerUrl = photo.user?.links?.html || null

  // Image URL — use regular (medium) for performance
  const imageUrl = photo.urls?.regular || photo.urls?.full

  // Alt text for accessibility
  const altText =
    photo.alt_description ||
    photo.description ||
    (photo.taxonCommon
      ? `${photo.taxonCommon} (${photo.taxonName})`
      : 'Shark photo')

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 220 }}
      role="figure"
      aria-label={`Photo of the day: ${commonName}`}
    >
      {/* ---------------------------------------------------------------- image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={altText}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: imgLoaded ? 1 : 0 }}
          onLoad={() => setImgLoaded(true)}
          loading="eager"
          decoding="async"
        />
      )}

      {/* Skeleton shown until image is loaded */}
      {!imgLoaded && (
        <div className="absolute inset-0 bg-[#1a4a7a] animate-pulse" aria-hidden="true" />
      )}

      {/* ---------------------------------------------------------------- gradient overlay */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '55%',
          background:
            'linear-gradient(to top, rgba(5,14,26,0.95) 0%, rgba(5,14,26,0.4) 60%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* ---------------------------------------------------------------- caption (bottom-left) */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 flex items-end justify-between gap-3">
        {/* Left: species / title info */}
        <div className="min-w-0 flex-1">
          <p
            className="text-white font-bold text-shadow-sm leading-tight truncate"
            style={{ fontSize: '1rem' }}
          >
            {commonName}
          </p>
          {scientificName && (
            <p className="text-slate-300 text-xs italic text-shadow-sm leading-tight mt-0.5 truncate">
              {scientificName}
            </p>
          )}
          {locationLabel && (
            <p className="text-slate-400 text-xs text-shadow-sm leading-tight mt-0.5 truncate">
              📍 {locationLabel}
            </p>
          )}
        </div>

        {/* Right: attribution + controls */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {/* Photographer credit — required by Unsplash ToS */}
          {photographerName && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400" aria-hidden="true">
                📷
              </span>
              {photographerUrl ? (
                <a
                  href={photographerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-300 hover:text-white transition-colors text-shadow-sm"
                  aria-label={`Photo by ${photographerName} on ${isUnsplash ? 'Unsplash' : 'iNaturalist'}`}
                >
                  {photographerName}
                </a>
              ) : (
                <span className="text-xs text-slate-300 text-shadow-sm">
                  {photographerName}
                </span>
              )}
            </div>
          )}

          {/* Source badge */}
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={{
              background: 'rgba(5,14,26,0.7)',
              color: isINat ? '#4ade80' : '#38bdf8',
              border: `1px solid ${isINat ? '#4ade80' : '#38bdf8'}`,
            }}
          >
            {isINat ? 'iNaturalist' : 'Unsplash'}
          </span>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Collapse banner */}
            <button
              onClick={() => setExpanded(false)}
              className="text-[10px] text-slate-400 hover:text-white transition-colors whitespace-nowrap"
              title="Collapse photo"
              aria-label="Collapse photo banner"
              type="button"
            >
              ▲ collapse
            </button>

            {/* Show next photo button */}
            {hasMore && onShowNext && (
              <button
                onClick={onShowNext}
                className="text-base leading-none text-slate-300 hover:text-white transition-colors"
                title="Show next photo"
                aria-label="Show next photo"
                type="button"
              >
                🔄
              </button>
            )}

            {/* Info toggle button */}
            <button
              onClick={() => setInfoExpanded((v) => !v)}
              className={[
                'text-base leading-none transition-colors',
                infoExpanded
                  ? 'text-[#38bdf8]'
                  : 'text-slate-300 hover:text-white',
              ].join(' ')}
              title={infoExpanded ? 'Hide species info' : 'Show species info'}
              aria-label={infoExpanded ? 'Hide species info' : 'Show species info'}
              aria-expanded={infoExpanded}
              type="button"
            >
              ℹ️
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- info overlay (slides up from bottom) */}
      <div
        className="absolute inset-x-0 bottom-0 transition-transform duration-300 ease-in-out"
        style={{
          background: 'rgba(5,14,26,0.96)',
          borderTop: '1px solid #1a4a7a',
          transform: infoExpanded ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '70%',
          overflowY: 'auto',
        }}
        aria-hidden={!infoExpanded}
      >
        <div className="px-4 py-4 flex flex-col gap-3">
          {/* Close / dismiss */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Species Info</h3>
            <button
              onClick={() => setInfoExpanded(false)}
              className="text-slate-400 hover:text-white text-sm transition-colors"
              aria-label="Close species info"
              type="button"
            >
              ✕
            </button>
          </div>

          {/* Species names */}
          {commonName && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                Common name
              </p>
              <p className="text-sm text-white">{commonName}</p>
            </div>
          )}

          {scientificName && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                Scientific name
              </p>
              <p className="text-sm text-slate-200 italic">{scientificName}</p>
            </div>
          )}

          {locationLabel && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                Location
              </p>
              <p className="text-sm text-slate-200">{locationLabel}</p>
            </div>
          )}

          {/* Full description if available */}
          {photo.description && photo.description !== commonName && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                Description
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {photo.description}
              </p>
            </div>
          )}

          {/* Photographer credit (expanded form) */}
          {photographerName && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                Photographer
              </p>
              <p className="text-sm text-slate-200">
                {photographerUrl ? (
                  <a
                    href={photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#38bdf8] hover:underline"
                  >
                    {photographerName}
                  </a>
                ) : (
                  photographerName
                )}{' '}
                {isUnsplash && (
                  <span className="text-slate-400">on Unsplash</span>
                )}
                {isINat && (
                  <span className="text-slate-400">on iNaturalist</span>
                )}
              </p>
            </div>
          )}

          {/* Unsplash download link (required by ToS) */}
          {isUnsplash && photo.links?.download_location && (
            <a
              href={photo.links.download_location}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors mt-1"
            >
              View on Unsplash ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
