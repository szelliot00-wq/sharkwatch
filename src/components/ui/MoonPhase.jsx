import React from 'react'
import { getMoonPhase } from '../../utils/moonPhase'

/**
 * MoonPhase — client-side moon phase widget for the header.
 * Clicking the button toggles an expanded tooltip with a shark behaviour note.
 */
export function MoonPhase() {
  const moon = getMoonPhase()
  const [expanded, setExpanded] = React.useState(false)

  // Close on Escape key
  React.useEffect(() => {
    if (!expanded) return
    function onKeyDown(e) {
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [expanded])

  // Close when clicking outside
  const containerRef = React.useRef(null)
  React.useEffect(() => {
    if (!expanded) return
    function onPointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setExpanded(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [expanded])

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
        title="Moon phase — click for shark behaviour note"
        aria-expanded={expanded}
        aria-haspopup="true"
        type="button"
      >
        <span className="text-xl leading-none" aria-hidden="true">
          {moon.emoji}
        </span>
        <span className="hidden sm:inline">{moon.phaseName}</span>
      </button>

      {expanded && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-72 p-3 rounded-lg text-sm text-slate-300 shadow-xl"
          style={{ background: '#0d2847', border: '1px solid #1a4a7a' }}
          role="tooltip"
        >
          <div className="font-medium text-white mb-1">
            {moon.emoji} {moon.phaseName}
          </div>
          <div className="leading-relaxed">{moon.sharkNote}</div>
          {typeof moon.illumination === 'number' && (
            <div className="mt-2 text-xs text-slate-400">
              Illumination: {Math.round(moon.illumination * 100)}%
            </div>
          )}
        </div>
      )}
    </div>
  )
}
