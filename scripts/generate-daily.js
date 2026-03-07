#!/usr/bin/env node
/**
 * generate-daily.js — Pre-generates daily shark flashcard questions via Gemini API.
 * Saves JSON files to ~/sharkwatch-dist/daily/ for serving as static files.
 *
 * The browser app checks /daily/flashcards-YYYY-MM-DD.json first and only
 * falls back to the live Gemini API if the file isn't available.
 *
 * Usage:  node generate-daily.js [YYYY-MM-DD]
 * Cron:   0 2 * * * /Users/steveelliott/.nvm/versions/node/v24.14.0/bin/node /Users/steveelliott/sharks-cron/generate-daily.js >> /Users/steveelliott/sharks-cron/daily.log 2>&1
 */

'use strict'

const fs   = require('fs')
const path = require('path')

// ── Config ────────────────────────────────────────────────────────────────────

const DATE_STR = process.argv[2] || new Date().toISOString().slice(0, 10)
const DIST_DIR = path.join(process.env.HOME, 'sharkwatch-dist', 'daily')
const MODEL    = 'gemini-2.5-flash'

// Read API key from .env file or environment variable
const API_KEY = process.env.GEMINI_API_KEY || readEnvKey()

function readEnvKey() {
  const candidates = [
    path.join(process.env.HOME, 'Claude-projects/Sharks/.env'),
    path.join(__dirname, '../.env'),
    path.join(__dirname, '.env'),
  ]
  for (const p of candidates) {
    try {
      const text = fs.readFileSync(p, 'utf8')
      const m = text.match(/VITE_GEMINI_API_KEY=([^\n\r]+)/)
      if (m) return m[1].trim()
    } catch { /* try next */ }
  }
  console.error('ERROR: Could not find GEMINI_API_KEY. Set the env var or ensure .env exists.')
  process.exit(1)
}

// ── Gemini REST call ──────────────────────────────────────────────────────────

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null
}

function parseJSONArray(raw) {
  if (!raw) return null
  try {
    const p = JSON.parse(raw)
    if (Array.isArray(p)) return p
  } catch { /* fall through */ }
  try {
    const m = raw.match(/\[[\s\S]*\]/)
    if (m) {
      const p = JSON.parse(m[0])
      if (Array.isArray(p)) return p
    }
  } catch { /* fall through */ }
  return null
}

// ── Generate flashcards ───────────────────────────────────────────────────────

async function generateFlashcards(dateStr) {
  const prompt =
    'You generate shark myth-vs-fact True/False flashcard questions for an 18-year-old with expert-level interest in marine biology. Questions must be scientifically accurate, surprising, and varied across species biology, behaviour, ocean science, conservation, and research. Mix true and false statements. Return a JSON array of exactly 5 objects, each with: statement (string), isTrue (boolean), explanation (string, 1-2 sentences of scientific context), category (one of: biology|behaviour|conservation|ocean|history).' +
    '\n\n' +
    `Generate 5 shark True/False flashcards for ${dateStr}. Avoid obvious myths like "sharks must swim to breathe" — go deeper and more surprising. Each should make the reader think.`

  const raw = await callGemini(prompt)
  return parseJSONArray(raw)
}

// ── Generate history ─────────────────────────────────────────────────────────

function monthDay(dateStr) {
  return dateStr.slice(5) // YYYY-MM-DD → MM-DD
}

function dateLabel(dateStr) {
  const [, m, d] = dateStr.split('-')
  const dt = new Date(dateStr + 'T12:00:00Z')
  return dt.toLocaleDateString('en-US', { day: 'numeric', month: 'long', timeZone: 'UTC' })
}

async function generateHistory(dateStr) {
  const md = monthDay(dateStr)
  const dl = dateLabel(dateStr)
  const prompt =
    'You are a shark science historian generating "on this day / this week in shark history" events. Events can be real or plausibly constructed from the history of shark research — first expeditions, species discoveries, landmark conservation laws, famous research milestones, first cage dives, important publications, tagging firsts. Be specific with years, places, and names. Content should inspire a teenage marine biology enthusiast. Return a JSON array of exactly 4 objects with: year (number), title (string, max 70 chars), narrative (string, 2-3 vivid sentences), category (one of: research|discovery|conservation|encounter|milestone).' +
    '\n\n' +
    `Generate 4 shark history events for "this week in shark history" — events that happened around ${dl}. Span different decades between 1930 and 2020. Make each one feel like a significant moment in shark science.`

  const raw = await callGemini(prompt)
  return parseJSONArray(raw)
}

// ── Cleanup old files ─────────────────────────────────────────────────────────

function cleanup() {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  try {
    for (const file of fs.readdirSync(DIST_DIR)) {
      const fp = path.join(DIST_DIR, file)
      if (fs.statSync(fp).mtimeMs < cutoff) {
        fs.unlinkSync(fp)
        console.log(`  Deleted old file: ${file}`)
      }
    }
  } catch { /* ignore if dir is empty or missing */ }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(DIST_DIR, { recursive: true })

  const ts = new Date().toISOString()
  console.log(`\n[${ts}] Generating daily content for ${DATE_STR}`)

  // ── Flashcards ──────────────────────────────────────────────────────────────
  const flashFile = path.join(DIST_DIR, `flashcards-${DATE_STR}.json`)
  if (fs.existsSync(flashFile)) {
    console.log(`  Already exists: flashcards-${DATE_STR}.json — skipping.`)
  } else {
    try {
      const cards = await generateFlashcards(DATE_STR)
      if (cards && cards.length > 0) {
        fs.writeFileSync(flashFile, JSON.stringify(cards, null, 2))
        console.log(`  ✓ Flashcards saved (${cards.length} cards)`)
      } else {
        console.error('  ✗ Flashcards: empty or unparseable response')
      }
    } catch (err) {
      console.error(`  ✗ Flashcards failed: ${err.message}`)
    }
  }

  // ── History ──────────────────────────────────────────────────────────────────
  const histFile = path.join(DIST_DIR, `history-${monthDay(DATE_STR)}.json`)
  if (fs.existsSync(histFile)) {
    console.log(`  Already exists: history-${monthDay(DATE_STR)}.json — skipping.`)
  } else {
    try {
      const events = await generateHistory(DATE_STR)
      if (events && events.length > 0) {
        fs.writeFileSync(histFile, JSON.stringify(events, null, 2))
        console.log(`  ✓ History saved (${events.length} events)`)
      } else {
        console.error('  ✗ History: empty or unparseable response')
      }
    } catch (err) {
      console.error(`  ✗ History failed: ${err.message}`)
    }
  }

  cleanup()
  console.log(`[${new Date().toISOString()}] Done.\n`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
