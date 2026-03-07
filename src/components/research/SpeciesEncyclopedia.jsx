import React, { useState, useMemo } from 'react'
import { SPECIES_DATA, IUCN_CONFIG } from '../../data/speciesData'

const MAX_LENGTH_M = 12 // Whale shark — 100% bar width

// ─── IUCN Badge ───────────────────────────────────────────────────────────────

function IucnBadge({ code, size = 'sm' }) {
  const cfg = IUCN_CONFIG[code]
  if (!cfg) return null
  const dot = size === 'sm' ? 6 : 8
  const fontSize = size === 'sm' ? 10 : 12
  return (
    <span
      className="flex items-center gap-1 font-bold rounded"
      style={{
        background: 'rgba(5,14,26,0.85)',
        border: `1px solid ${cfg.color}`,
        color: cfg.color,
        fontSize,
        padding: size === 'sm' ? '1px 5px' : '2px 8px',
        lineHeight: 1.4,
      }}
    >
      <span
        style={{
          width: dot,
          height: dot,
          borderRadius: '50%',
          background: cfg.color,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {cfg.short}
    </span>
  )
}

// ─── Size Bar ─────────────────────────────────────────────────────────────────

function SizeBar({ maxLengthM }) {
  const pct = Math.min((maxLengthM / MAX_LENGTH_M) * 100, 100)
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: 4, background: '#1a4a7a' }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: '#f97316',
            borderRadius: 9999,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span style={{ color: '#f97316', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
        {maxLengthM}m
      </span>
    </div>
  )
}

// ─── Species Card ─────────────────────────────────────────────────────────────

function SpeciesCard({ species, onClick }) {
  const [imgError, setImgError] = useState(false)
  const showImg = species.imageUrl && !imgError

  return (
    <button
      onClick={() => onClick(species)}
      className="text-left rounded-lg overflow-hidden flex flex-col transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
      style={{
        background: '#0d2847',
        border: '1px solid #1a4a7a',
        cursor: 'pointer',
        width: '100%',
      }}
      type="button"
    >
      {/* Image / Placeholder */}
      <div className="relative w-full" style={{ aspectRatio: '16/9', background: '#071a30' }}>
        {showImg ? (
          <img
            src={species.imageUrl}
            alt={species.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: '#0d2847' }}>
            <span style={{ fontSize: 28, opacity: 0.35 }}>🦈</span>
          </div>
        )}
        {/* IUCN badge overlay */}
        <div className="absolute top-1.5 right-1.5">
          <IucnBadge code={species.iucn} size="sm" />
        </div>
      </div>

      {/* Text content */}
      <div className="flex flex-col gap-1 p-2">
        <p
          className="font-bold leading-tight truncate"
          style={{ color: '#ffffff', fontSize: 12 }}
        >
          {species.name}
        </p>
        <p
          className="italic leading-tight truncate"
          style={{ color: '#94a3b8', fontSize: 10 }}
        >
          {species.scientific}
        </p>
        <SizeBar maxLengthM={species.maxLengthM} />
      </div>
    </button>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ species, onBack }) {
  const [imgError, setImgError] = useState(false)
  const showImg = species.imageUrl && !imgError
  const cfg = IUCN_CONFIG[species.iucn]
  const wikiName = species.scientific.replace(/ /g, '_')
  const wikiUrl = `https://en.wikipedia.org/wiki/${wikiName}`

  return (
    <div className="p-4 flex flex-col gap-4" style={{ color: '#fff' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium self-start transition-colors"
        style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        type="button"
        onMouseEnter={e => e.currentTarget.style.color = '#f97316'}
        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
      >
        ← Back
      </button>

      {/* Header row: image + name block */}
      <div className="flex gap-4 flex-wrap">
        <div
          className="rounded-lg overflow-hidden flex-shrink-0"
          style={{ width: 180, aspectRatio: '16/9', background: '#071a30' }}
        >
          {showImg ? (
            <img
              src={species.imageUrl}
              alt={species.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: '#0d2847' }}>
              <span style={{ fontSize: 40, opacity: 0.35 }}>🦈</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 justify-center min-w-0">
          <h2 className="font-bold leading-tight" style={{ color: '#fff', fontSize: 18 }}>
            {species.name}
          </h2>
          <p className="italic" style={{ color: '#94a3b8', fontSize: 13 }}>
            {species.scientific}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <IucnBadge code={species.iucn} size="lg" />
            {cfg && (
              <span style={{ color: cfg.color, fontSize: 12 }}>
                {cfg.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #1a4a7a' }} />

      {/* Stats grid */}
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        <Stat label="Max Length" value={`${species.maxLengthM} m`} />
        <Stat label="Avg Length" value={`${species.avgLengthM} m`} />
        <Stat label="Max Weight" value={`${species.maxWeightKg.toLocaleString()} kg`} />
        <Stat label="Depth Range" value={species.depthRange} />
        <Stat label="Order" value={species.order} />
        <Stat label="Family" value={species.family} />
        <Stat label="Lifespan" value={species.lifespan} />
      </div>

      {/* Wider details */}
      <div className="flex flex-col gap-2">
        <DetailRow label="Habitat" value={species.habitat} />
        <DetailRow label="Distribution" value={species.distribution} />
        <DetailRow label="Diet" value={species.diet} />
      </div>

      {/* Fun fact */}
      <div
        className="rounded-lg p-3 flex gap-2"
        style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}
      >
        <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
        <p style={{ color: '#fdba74', fontSize: 13, lineHeight: 1.5 }}>{species.funFact}</p>
      </div>

      {/* Wikipedia link */}
      <a
        href={wikiUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start text-sm underline transition-colors"
        style={{ color: '#60a5fa' }}
        onMouseEnter={e => e.currentTarget.style.color = '#93c5fd'}
        onMouseLeave={e => e.currentTarget.style.color = '#60a5fa'}
      >
        Wikipedia →
      </a>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div
      className="rounded-lg p-2 flex flex-col gap-0.5"
      style={{ background: '#071a30', border: '1px solid #1a4a7a' }}
    >
      <span style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
        {value}
      </span>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex gap-2" style={{ fontSize: 13 }}>
      <span style={{ color: '#94a3b8', flexShrink: 0, minWidth: 90 }}>{label}:</span>
      <span style={{ color: '#e2e8f0' }}>{value}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const STATUS_FILTERS = ['all', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD']
const SORT_OPTIONS = [
  { value: 'az',      label: 'A–Z' },
  { value: 'largest', label: 'Largest First' },
  { value: 'deepest', label: 'Deepest First' },
]

export function SpeciesEncyclopedia() {
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy]           = useState('az')
  const [selected, setSelected]       = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = SPECIES_DATA.filter(s => {
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.scientific.toLowerCase().includes(q)
      const matchStatus =
        statusFilter === 'all' || s.iucn === statusFilter
      return matchSearch && matchStatus
    })

    if (sortBy === 'az') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'largest') {
      list = [...list].sort((a, b) => b.maxLengthM - a.maxLengthM)
    } else if (sortBy === 'deepest') {
      list = [...list].sort((a, b) => b.depthMax - a.depthMax)
    }

    return list
  }, [search, statusFilter, sortBy])

  if (selected) {
    return (
      <div style={{ background: '#050e1a', minHeight: '100%' }}>
        <DetailPanel species={selected} onBack={() => setSelected(null)} />
      </div>
    )
  }

  return (
    <div style={{ background: '#050e1a', minHeight: '100%' }}>
      {/* Search + count row */}
      <div
        className="flex items-center gap-2 px-3 pt-3 pb-2"
        style={{ borderBottom: '1px solid #1a4a7a' }}
      >
        <div className="relative flex-1">
          <span
            className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: '#94a3b8', fontSize: 13 }}
          >
            🔍
          </span>
          <input
            type="search"
            placeholder="Search species..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded pl-7 pr-3 py-1.5 text-sm outline-none"
            style={{
              background: '#0d2847',
              border: '1px solid #1a4a7a',
              color: '#fff',
              fontSize: 12,
            }}
          />
        </div>
        <span style={{ color: '#94a3b8', fontSize: 11, whiteSpace: 'nowrap' }}>
          {filtered.length} species
        </span>
      </div>

      {/* Filter chips + sort row */}
      <div
        className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto flex-wrap"
        style={{ borderBottom: '1px solid #1a4a7a' }}
      >
        {STATUS_FILTERS.map(f => {
          const isActive = statusFilter === f
          const cfg = f === 'all' ? null : IUCN_CONFIG[f]
          return (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(prev => prev === f ? 'all' : f)}
              className="rounded-full font-medium transition-colors flex-shrink-0"
              style={{
                fontSize: 11,
                padding: '2px 10px',
                border: isActive
                  ? `1px solid ${cfg ? cfg.color : '#f97316'}`
                  : '1px solid #1a4a7a',
                background: isActive
                  ? (cfg ? `${cfg.color}22` : 'rgba(249,115,22,0.15)')
                  : 'transparent',
                color: isActive
                  ? (cfg ? cfg.color : '#f97316')
                  : '#94a3b8',
                cursor: 'pointer',
              }}
            >
              {f === 'all' ? 'All' : f}
            </button>
          )
        })}

        {/* Sort dropdown — push to right */}
        <div className="ml-auto flex-shrink-0 flex items-center gap-1">
          <span style={{ color: '#94a3b8', fontSize: 11 }}>Sort:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="rounded outline-none"
            style={{
              background: '#0d2847',
              border: '1px solid #1a4a7a',
              color: '#fff',
              fontSize: 11,
              padding: '2px 6px',
              cursor: 'pointer',
            }}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Species grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <span style={{ fontSize: 32, opacity: 0.3 }}>🦈</span>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>No species match your search.</p>
        </div>
      ) : (
        <div
          className="p-3"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 10,
          }}
        >
          {filtered.map(s => (
            <SpeciesCard key={s.id} species={s} onClick={setSelected} />
          ))}
        </div>
      )}
    </div>
  )
}
