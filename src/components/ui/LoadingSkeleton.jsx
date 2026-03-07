/**
 * LoadingSkeleton — animated pulse skeleton components for different content shapes.
 *
 * Exports:
 *   SkeletonLine   — single line of text
 *   SkeletonCard   — mimics a SharkCard list item
 *   SkeletonPaper  — mimics a research paper card
 *   SkeletonPhoto  — mimics the PhotoOfDay hero banner
 */

/**
 * Single line skeleton.
 * Props:
 *   width   CSS width string (default '100%')
 *   height  height in px (default 16)
 */
export function SkeletonLine({ width = '100%', height = 16 }) {
  return (
    <div
      className="bg-[#1a4a7a] animate-pulse rounded"
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

/**
 * Card skeleton — mimics a SharkCard list item.
 * Matches the rough structure: avatar circle + two lines of text + status dot.
 */
export function SkeletonCard() {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{ background: '#0d2847' }}
      aria-hidden="true"
    >
      {/* Avatar circle */}
      <div className="bg-[#1a4a7a] animate-pulse rounded-full flex-shrink-0" style={{ width: 40, height: 40 }} />

      {/* Text lines */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <SkeletonLine width="65%" height={14} />
        <SkeletonLine width="45%" height={11} />
      </div>

      {/* Status dot placeholder */}
      <div className="bg-[#1a4a7a] animate-pulse rounded-full flex-shrink-0" style={{ width: 10, height: 10 }} />
    </div>
  )
}

/**
 * Paper skeleton — mimics a research paper card.
 * Matches the rough structure: title + author line + abstract snippet + tag chips.
 */
export function SkeletonPaper() {
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-lg"
      style={{ background: '#0d2847', border: '1px solid #1a4a7a' }}
      aria-hidden="true"
    >
      {/* Title — two lines */}
      <div className="flex flex-col gap-2">
        <SkeletonLine width="90%" height={15} />
        <SkeletonLine width="70%" height={15} />
      </div>

      {/* Author / journal line */}
      <SkeletonLine width="55%" height={12} />

      {/* Abstract snippet — three lines */}
      <div className="flex flex-col gap-1.5">
        <SkeletonLine width="100%" height={11} />
        <SkeletonLine width="100%" height={11} />
        <SkeletonLine width="80%" height={11} />
      </div>

      {/* Tag chips */}
      <div className="flex gap-2">
        <SkeletonLine width={64} height={22} />
        <SkeletonLine width={80} height={22} />
        <SkeletonLine width={56} height={22} />
      </div>
    </div>
  )
}

/**
 * Photo skeleton — mimics the PhotoOfDay hero banner.
 * 16:9 aspect ratio with a fake caption bar at the bottom.
 */
export function SkeletonPhoto() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-b-lg"
      style={{ aspectRatio: '16/9', maxHeight: 360, background: '#0a1f35' }}
      aria-hidden="true"
    >
      {/* Main image area */}
      <div className="absolute inset-0 bg-[#1a4a7a] animate-pulse" />

      {/* Gradient overlay — same shape as real component */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '40%',
          background: 'linear-gradient(to top, rgba(5,14,26,0.95) 0%, transparent 100%)',
        }}
      />

      {/* Fake caption bottom-left */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-2">
        <SkeletonLine width={160} height={18} />
        <SkeletonLine width={120} height={13} />
      </div>

      {/* Fake credit bottom-right */}
      <div className="absolute bottom-3 right-3 flex flex-col items-end gap-2">
        <SkeletonLine width={100} height={12} />
        <SkeletonLine width={60} height={12} />
      </div>
    </div>
  )
}
