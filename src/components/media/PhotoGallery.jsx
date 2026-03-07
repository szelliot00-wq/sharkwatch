import { useEffect } from 'react'

/**
 * PhotoGallery — full-screen photo overlay.
 *
 * Props:
 *   photos        Array     Pool of photo objects (same shape as usePhotoOfDay)
 *   currentIndex  number    Which photo to show
 *   onPrev        function  Go to previous photo
 *   onNext        function  Go to next photo
 *   onClose       function  Close the gallery
 */
export function PhotoGallery({ photos, currentIndex, onPrev, onNext, onClose }) {
  const photo = photos[currentIndex]
  const total = photos.length

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowLeft')   onPrev()
      if (e.key === 'ArrowRight')  onNext()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext])

  if (!photo) return null

  const imageUrl       = photo.urls?.full || photo.urls?.regular
  const commonName     = photo.taxonCommon || photo.description || photo.alt_description || 'Shark'
  const scientificName = photo.taxonName   || null
  const locationLabel  = photo.location    || null
  const photographerName = photo.user?.name        || null
  const photographerUrl  = photo.user?.links?.html || null
  const isINat           = photo.source === 'iNaturalist'

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'rgba(2,8,18,0.96)', zIndex: 9999 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-2xl text-slate-300 hover:text-white transition-colors z-10 leading-none"
        aria-label="Close gallery"
        type="button"
      >
        ✕
      </button>

      {/* Counter */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-xs text-slate-400 z-10 tabular-nums">
        {currentIndex + 1} / {total}
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 z-10 hidden sm:block">
        ← → to navigate · ESC to close
      </div>

      {/* Prev arrow */}
      {total > 1 && (
        <button
          onClick={e => { e.stopPropagation(); onPrev() }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl text-slate-300 hover:text-white transition-colors z-10 px-2 leading-none select-none"
          aria-label="Previous photo"
          type="button"
        >
          ‹
        </button>
      )}

      {/* Image + caption */}
      <div
        className="relative mx-16 sm:mx-20 rounded-xl overflow-hidden flex flex-col"
        style={{ maxWidth: '80vw', maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-1 min-h-0 flex items-center justify-center" style={{ background: '#020812' }}>
          <img
            src={imageUrl}
            alt={commonName}
            className="object-contain"
            style={{ maxWidth: '100%', maxHeight: '75vh' }}
          />
        </div>

        {/* Caption bar */}
        <div
          className="flex-shrink-0 px-4 py-3 space-y-1"
          style={{ background: '#070f1c', borderTop: '1px solid #1a4a7a' }}
        >
          <p className="text-white font-semibold text-sm leading-snug">{commonName}</p>
          {scientificName && (
            <p className="text-slate-400 text-xs italic">{scientificName}</p>
          )}
          <div className="flex items-center justify-between gap-4 pt-0.5">
            {locationLabel && (
              <p className="text-slate-500 text-xs min-w-0 truncate">📍 {locationLabel}</p>
            )}
            {photographerName && (
              <p className="text-slate-500 text-xs flex-shrink-0">
                📷{' '}
                {photographerUrl ? (
                  <a
                    href={photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#38bdf8] hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    {photographerName}
                  </a>
                ) : photographerName}
                {' '}
                <span className="text-slate-600">on {isINat ? 'iNaturalist' : 'Unsplash'}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Next arrow */}
      {total > 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNext() }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl text-slate-300 hover:text-white transition-colors z-10 px-2 leading-none select-none"
          aria-label="Next photo"
          type="button"
        >
          ›
        </button>
      )}
    </div>
  )
}
