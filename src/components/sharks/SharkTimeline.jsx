import React, { useMemo, useRef, useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SVG_HEIGHT = 80
const AXIS_HEIGHT = 18       // space reserved at the bottom for month labels
const BAR_AREA_HEIGHT = SVG_HEIGHT - AXIS_HEIGHT
const BAR_GAP = 1            // px gap between bars
const DAYS = 90
const ORANGE = '#f97316'
const DARK_BAR = '#0d2847'
const AXIS_TEXT_COLOUR = '#6b7280'
const TOOLTIP_BG = '#0a1f35'
const TOOLTIP_BORDER = '#1a4a7a'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a YYYY-MM-DD string for a date `daysAgo` days before today.
 */
function dateKey(daysAgo) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

/**
 * Short month name for a YYYY-MM-DD string.
 */
function monthLabel(isoDate) {
  return new Date(isoDate + 'T00:00:00').toLocaleString('en-US', { month: 'short' })
}

/**
 * Human-readable date label for tooltip.
 */
function friendlyDate(isoDate) {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// SharkTimeline
// ---------------------------------------------------------------------------

export function SharkTimeline({ pings = [] }) {
  const svgRef = useRef(null)
  const [tooltip, setTooltip] = useState(null) // { x, y, date, count }

  // Build a map of isoDate -> ping count
  const pingCountByDay = useMemo(() => {
    const map = {}
    for (const ping of pings) {
      if (!ping?.date) continue
      const key = String(ping.date).slice(0, 10)
      map[key] = (map[key] ?? 0) + 1
    }
    return map
  }, [pings])

  // Build the 90-day grid (index 0 = oldest = 89 days ago, index 89 = today)
  const grid = useMemo(() => {
    return Array.from({ length: DAYS }, (_, i) => {
      const daysAgo = DAYS - 1 - i
      const key = dateKey(daysAgo)
      return { key, count: pingCountByDay[key] ?? 0 }
    })
  }, [pingCountByDay])

  // Decide which columns to label with month names.
  // Walk the grid and record the first column where the month changes.
  const monthMarkers = useMemo(() => {
    const markers = []
    let lastMonth = null
    for (let i = 0; i < grid.length; i++) {
      const month = grid[i].key.slice(0, 7) // YYYY-MM
      if (month !== lastMonth) {
        markers.push({ colIndex: i, label: monthLabel(grid[i].key) })
        lastMonth = month
      }
    }
    return markers
  }, [grid])

  // SVG geometry (computed inline so we can respond to the actual rendered width)
  const totalGaps = (DAYS - 1) * BAR_GAP

  // We use a viewBox so the SVG scales to any container width.
  const viewBoxWidth = 600
  const barWidth = (viewBoxWidth - totalGaps) / DAYS

  // Mouse handlers for tooltip
  const handleMouseMove = useCallback(
    (e) => {
      if (!svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      const relX = e.clientX - rect.left
      const relY = e.clientY - rect.top
      // Map relX (in DOM pixels) → viewBox coordinate
      const vbX = (relX / rect.width) * viewBoxWidth
      const colIndex = Math.floor(vbX / (barWidth + BAR_GAP))
      if (colIndex < 0 || colIndex >= DAYS) {
        setTooltip(null)
        return
      }
      const day = grid[colIndex]
      setTooltip({
        // Position tooltip relative to the SVG element in DOM pixels
        x: relX,
        y: relY,
        date: day.key,
        count: day.count,
      })
    },
    [barWidth, grid]
  )

  const handleMouseLeave = useCallback(() => setTooltip(null), [])

  // Guard: not enough data
  const totalPings = pings.length
  if (totalPings < 2) {
    return (
      <div
        className="flex items-center justify-center text-xs rounded"
        style={{ height: SVG_HEIGHT, color: '#6b7280', background: DARK_BAR }}
      >
        Not enough ping data
      </div>
    )
  }

  return (
    <div className="relative select-none" style={{ width: '100%' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxWidth} ${SVG_HEIGHT}`}
        preserveAspectRatio="none"
        width="100%"
        height={SVG_HEIGHT}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'block', cursor: 'crosshair' }}
        aria-label="Ping activity over the last 90 days"
        role="img"
      >
        {/* Background */}
        <rect x={0} y={0} width={viewBoxWidth} height={SVG_HEIGHT} fill="transparent" />

        {/* Bars */}
        {grid.map((day, i) => {
          const x = i * (barWidth + BAR_GAP)
          const hasActivity = day.count > 0
          const barHeight = hasActivity ? BAR_AREA_HEIGHT : 2
          const y = hasActivity ? 0 : BAR_AREA_HEIGHT - 2
          return (
            <rect
              key={day.key}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={hasActivity ? ORANGE : DARK_BAR}
              rx={hasActivity ? 1 : 0}
              opacity={hasActivity ? 0.9 : 0.5}
            />
          )
        })}

        {/* X-axis line */}
        <line
          x1={0}
          y1={BAR_AREA_HEIGHT}
          x2={viewBoxWidth}
          y2={BAR_AREA_HEIGHT}
          stroke={TOOLTIP_BORDER}
          strokeWidth={0.5}
        />

        {/* Month labels */}
        {monthMarkers.map(({ colIndex, label }) => {
          const x = colIndex * (barWidth + BAR_GAP)
          // Don't render a label too close to the right edge
          if (x > viewBoxWidth - 20) return null
          return (
            <text
              key={label + colIndex}
              x={x + barWidth / 2}
              y={SVG_HEIGHT - 3}
              fill={AXIS_TEXT_COLOUR}
              fontSize={9}
              textAnchor="start"
              fontFamily="ui-monospace, monospace"
            >
              {label}
            </text>
          )
        })}
      </svg>

      {/* Tooltip (rendered in DOM, outside SVG so it can overflow) */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg"
          style={{
            left: tooltip.x + 8,
            top: Math.max(0, tooltip.y - 36),
            background: TOOLTIP_BG,
            border: `1px solid ${TOOLTIP_BORDER}`,
            color: '#e2e8f0',
          }}
        >
          <span className="font-semibold" style={{ color: ORANGE }}>
            {friendlyDate(tooltip.date)}
          </span>
          <br />
          {tooltip.count === 0
            ? 'No pings'
            : tooltip.count === 1
            ? '1 ping'
            : `${tooltip.count} pings`}
        </div>
      )}
    </div>
  )
}

export default SharkTimeline
