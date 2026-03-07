import React, { useState, useEffect } from 'react'
import { getPaperSummary } from '../../utils/gemini'

export function PaperCard({ paper }) {
  const [expanded, setExpanded] = useState(false)
  const [geminiSummary, setGeminiSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  // Fetch Gemini summary only when expanded and no tldr exists
  useEffect(() => {
    if (!expanded || paper.tldr || !paper.abstract || geminiSummary) return
    setSummaryLoading(true)
    getPaperSummary(paper.abstract)
      .then(s => setGeminiSummary(s))
      .catch(() => {})
      .finally(() => setSummaryLoading(false))
  }, [expanded])

  const firstAuthor = paper.authors?.[0]?.name || 'Unknown'
  const authorStr = paper.authors?.length > 1 ? `${firstAuthor} et al.` : firstAuthor

  return (
    <div
      className="flex-shrink-0 cursor-pointer rounded-lg p-3 transition-all duration-200"
      style={{
        width: expanded ? '100%' : 200,
        background: '#0d2847',
        border: '1px solid #1a4a7a',
      }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* Title */}
      <p
        className={`text-xs font-semibold text-white leading-snug mb-1 ${
          expanded ? '' : 'line-clamp-2'
        }`}
      >
        {paper.title}
      </p>

      {/* Author + year + venue */}
      <p className="text-[10px] text-slate-400 mb-1">
        {authorStr}
        {paper.year ? ` · ${paper.year}` : ''}
        {paper.venue ? ` · ${paper.venue}` : ''}
      </p>

      {/* TL;DR — from Semantic Scholar, or Gemini fallback when expanded */}
      {paper.tldr ? (
        <div className="mb-2">
          <span className="text-[10px] font-medium" style={{ color: '#38bdf8' }}>
            In plain English:{' '}
          </span>
          <span className="text-[10px] text-slate-300 italic">{paper.tldr}</span>
        </div>
      ) : geminiSummary ? (
        <div className="mb-2">
          <span className="text-[10px] font-medium" style={{ color: '#38bdf8' }}>
            In plain English:{' '}
          </span>
          <span className="text-[10px] text-slate-300 italic">{geminiSummary}</span>
        </div>
      ) : summaryLoading ? (
        <div className="mb-2 h-3 rounded animate-pulse" style={{ background: '#1a4a7a', width: '90%' }} />
      ) : paper.abstract ? (
        <p
          className={`text-[10px] text-slate-400 mb-2 ${
            expanded ? '' : 'line-clamp-2'
          }`}
        >
          {paper.abstract}
        </p>
      ) : null}

      {/* Expanded: full abstract (when tldr is also present) */}
      {expanded && paper.abstract && paper.tldr && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid #1a4a7a' }}>
          <p className="text-[10px] text-slate-400 leading-relaxed">{paper.abstract}</p>
        </div>
      )}

      {/* Expanded: all authors */}
      {expanded && paper.authors?.length > 1 && (
        <p className="text-[10px] text-slate-500 mt-2">
          {paper.authors.map(a => a.name).join(', ')}
        </p>
      )}

      {/* Footer row */}
      <div className="flex items-center gap-2 mt-2" onClick={e => e.stopPropagation()}>
        {/* Citation count */}
        {paper.citationCount > 0 && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: '#1a4a7a', color: '#94a3b8' }}
          >
            {paper.citationCount} citations
          </span>
        )}

        {/* Open access PDF */}
        {paper.openAccessUrl && (
          <a
            href={paper.openAccessUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ background: '#14532d', color: '#4ade80' }}
          >
            PDF
          </a>
        )}

        {/* S2 link — right-aligned */}
        <a
          href={paper.s2Url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
        >
          S2 ↗
        </a>
      </div>
    </div>
  )
}
