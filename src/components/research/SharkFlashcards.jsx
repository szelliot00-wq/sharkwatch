import { useState, useEffect } from 'react'
import { getSharkFlashcards } from '../../utils/gemini'

const CATEGORY_COLOR = {
  biology:      '#38bdf8',
  behaviour:    '#a78bfa',
  conservation: '#4ade80',
  ocean:        '#22d3ee',
  history:      '#fb923c',
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function scoreKey() {
  return `shark_flashcard_score_${todayStr()}`
}

function loadScore() {
  try {
    const s = sessionStorage.getItem(scoreKey())
    return s ? JSON.parse(s) : { correct: 0, wrong: 0, answers: {} }
  } catch { return { correct: 0, wrong: 0, answers: {} } }
}

function saveScore(score) {
  try { sessionStorage.setItem(scoreKey(), JSON.stringify(score)) } catch {}
}

export function SharkFlashcards({ onClose }) {
  const [cards,    setCards]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)
  const [current,  setCurrent]  = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [score,    setScore]    = useState(loadScore)

  useEffect(() => {
    setLoading(true)
    getSharkFlashcards(todayStr())
      .then(data => {
        if (!data || data.length === 0) { setError(true); return }
        setCards(data)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  function answer(guessTrue) {
    if (revealed) return
    const card  = cards[current]
    const right = guessTrue === card.isTrue

    setRevealed(true)

    const idx = String(current)
    if (score.answers[idx] !== undefined) return  // already answered this card

    const next = {
      ...score,
      correct:  score.correct + (right ? 1 : 0),
      wrong:    score.wrong   + (right ? 0 : 1),
      answers:  { ...score.answers, [idx]: right },
    }
    setScore(next)
    saveScore(next)
  }

  function nextCard() {
    setCurrent(i => i + 1)
    setRevealed(false)
  }

  function restart() {
    setCurrent(0)
    setRevealed(false)
  }

  const total    = cards.length
  const answered = Object.keys(score.answers).length

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors text-base leading-none" title="Close" type="button">✕</button>
        )}
        <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Generating today's questions…</p>
      </div>
    )
  }

  if (error || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors text-base leading-none" title="Close" type="button">✕</button>
        )}
        <p className="text-4xl" aria-hidden="true">🃏</p>
        <p className="text-slate-300 text-sm">Couldn't generate today's cards.</p>
        <button
          onClick={() => { setError(false); setLoading(true); getSharkFlashcards(todayStr()).then(setCards).catch(() => setError(true)).finally(() => setLoading(false)) }}
          className="text-xs text-[#38bdf8] hover:underline"
          type="button"
        >
          Try again
        </button>
      </div>
    )
  }

  // ── Finished ─────────────────────────────────────────────────────────────────
  if (current >= total) {
    const pct = Math.round((score.correct / total) * 100)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 p-6 text-center relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors text-base leading-none" title="Close" type="button">✕</button>
        )}
        <p className="text-5xl" aria-hidden="true">{pct === 100 ? '🦈' : pct >= 60 ? '🌊' : '📚'}</p>
        <div>
          <p className="text-xl font-bold text-white">{score.correct}/{total} correct</p>
          <p className="text-slate-400 text-sm mt-1">
            {pct === 100 ? 'Perfect score! You really know your sharks.' :
             pct >= 80  ? 'Excellent shark knowledge!' :
             pct >= 60  ? 'Good effort — check the explanations to go deeper.' :
                         'Sharks are full of surprises — try again tomorrow!'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={restart}
            type="button"
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid #38bdf8' }}
          >
            Review cards again
          </button>
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid #475569' }}
            >
              Done
            </button>
          )}
        </div>
        <p className="text-[10px] text-slate-600">New questions tomorrow</p>
      </div>
    )
  }

  const card       = cards[current]
  const catColor   = CATEGORY_COLOR[card.category] || '#94a3b8'
  const myAnswer   = score.answers[String(current)]
  const wasCorrect = myAnswer !== undefined ? myAnswer : null

  return (
    <div className="flex flex-col h-full p-4 gap-4">

      {/* ── Score bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[#4ade80] font-semibold">✓ {score.correct}</span>
          <span className="text-red-400 font-semibold">✗ {score.wrong}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{current + 1} / {total}</span>
          {onClose && (
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-base leading-none" title="Close" type="button">✕</button>
          )}
        </div>
      </div>

      {/* ── Progress dots ──────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 justify-center flex-shrink-0">
        {cards.map((_, i) => {
          const a = score.answers[String(i)]
          return (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: a === true  ? '#4ade80'
                          : a === false ? '#f87171'
                          : i === current ? '#f97316'
                          : '#1a4a7a',
              }}
            />
          )
        })}
      </div>

      {/* ── Card ───────────────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col rounded-xl p-5 gap-4"
        style={{ background: '#070f1c', border: `2px solid ${revealed ? (wasCorrect ? '#4ade80' : '#f87171') : catColor + '55'}` }}
      >
        {/* Category badge */}
        <span
          className="self-start text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
          style={{ background: catColor + '22', color: catColor }}
        >
          {card.category}
        </span>

        {/* Statement */}
        <p className="text-white font-semibold text-base leading-snug flex-1">
          {card.statement}
        </p>

        {/* Answer reveal */}
        {revealed && (
          <div
            className="rounded-lg p-3 space-y-1.5"
            style={{ background: wasCorrect ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${wasCorrect ? '#4ade8066' : '#f8717166'}` }}
          >
            <p className="text-sm font-bold" style={{ color: wasCorrect ? '#4ade80' : '#f87171' }}>
              {wasCorrect ? '✓ Correct!' : '✗ Not quite —'}{' '}
              <span className="font-normal text-slate-300">
                This statement is <strong>{card.isTrue ? 'TRUE' : 'FALSE'}</strong>
              </span>
            </p>
            <p className="text-xs text-slate-300 leading-snug">{card.explanation}</p>
          </div>
        )}
      </div>

      {/* ── Action buttons ─────────────────────────────────────────────────── */}
      {!revealed ? (
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={() => answer(true)}
            type="button"
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid #4ade80' }}
          >
            TRUE
          </button>
          <button
            onClick={() => answer(false)}
            type="button"
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid #f87171' }}
          >
            FALSE
          </button>
        </div>
      ) : (
        <button
          onClick={nextCard}
          type="button"
          className="flex-shrink-0 w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
          style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid #f97316' }}
        >
          {current + 1 < total ? 'Next question →' : 'See results'}
        </button>
      )}
    </div>
  )
}
