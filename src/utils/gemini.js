import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

const MODEL = 'claude-haiku-4-5'

// In-memory cache to avoid redundant API calls within a session
const cache = new Map()

/**
 * Generate text from Claude, with caching.
 *
 * @param {string} cacheKey - Unique key identifying this request
 * @param {string} systemPrompt - Instruction context for the model
 * @param {string} userPrompt - The actual user-facing prompt
 * @returns {Promise<string|null>} Generated text, or null on error
 */
export async function generateText(cacheKey, systemPrompt, userPrompt) {
  if (cache.has(cacheKey)) return cache.get(cacheKey)

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
    const text = message.content[0].text
    cache.set(cacheKey, text)
    return text
  } catch (err) {
    console.error('Claude error:', err)
    return null
  }
}

/**
 * Generate a 3-sentence engaging narrative about a named OCEARCH shark.
 * Targeted at a teenage marine biology audience.
 *
 * @param {object} shark - Normalised shark object from useSharkData
 * @param {string} shark.name
 * @param {string} shark.species
 * @param {object|null} shark.lastPing
 * @param {number} shark.totalPings
 * @returns {Promise<string|null>}
 */
export async function getSharkNarrative(shark) {
  const locationStr = shark.lastPing
    ? `${shark.lastPing.lat?.toFixed(2) ?? '?'}, ${shark.lastPing.lon?.toFixed(2) ?? '?'}`
    : 'an unknown location'

  const dateStr = shark.lastPing?.date
    ? new Date(shark.lastPing.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'an unknown date'

  const cacheKey = `narrative-${shark.id ?? shark.name}-${shark.lastPing?.date ?? 'noping'}`

  const systemPrompt =
    'You write engaging 3-sentence narratives about named sharks for a teenage audience interested in marine biology. Always positive, never sensational. Return only the narrative, no headers or markdown.'

  const userPrompt = `Write about ${shark.name}, a ${shark.species} last spotted near ${locationStr} on ${dateStr}. Total pings: ${shark.totalPings}.`

  return generateText(cacheKey, systemPrompt, userPrompt)
}

/**
 * Generate 3 surprising fun facts about a shark species.
 * Returns an array of 3 strings, parsed from the model's JSON output.
 *
 * @param {string} commonName - Common name of the species
 * @param {string} scientificName - Scientific name of the species
 * @returns {Promise<string[]>} Array of 3 fact strings, or empty array on error
 */
export async function getSpeciesFunFacts(commonName, scientificName) {
  const cacheKey = `facts-${scientificName || commonName}`

  const systemPrompt =
    'You generate surprising, age-appropriate fun facts about shark species for a teenage audience. Focus on biology, behaviour, conservation. Never mention attacks. Return a JSON array of exactly 3 strings.'

  const userPrompt = `Give 3 surprising facts about ${commonName} (${scientificName}).`

  const raw = await generateText(cacheKey, systemPrompt, userPrompt)
  if (!raw) return []

  // Attempt strict JSON parse first
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.slice(0, 3).map(String)
  } catch {
    // Fall through to extraction
  }

  // Fallback: extract strings from the text using regex
  try {
    const jsonMatch = raw.match(/\[[\s\S]*?\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(parsed)) return parsed.slice(0, 3).map(String)
    }

    // Last resort: split on numbered list patterns
    const lines = raw
      .split(/\n/)
      .map(l => l.replace(/^\s*[\d\-\*\.\)]+\s*/, '').trim())
      .filter(l => l.length > 20)
    return lines.slice(0, 3)
  } catch {
    return []
  }
}

/**
 * Summarise an academic abstract in one plain-English sentence
 * suitable for a teenage marine biology audience.
 *
 * @param {string} abstract - The raw abstract text
 * @returns {Promise<string|null>}
 */
export async function getPaperSummary(abstract) {
  const cacheKey = `paper-${abstract.slice(0, 100)}`

  const systemPrompt =
    'You summarise academic abstracts in one clear sentence for a teenage audience with a strong interest in marine biology. Return only the sentence.'

  const userPrompt = `Summarise this abstract: ${abstract}`

  return generateText(cacheKey, systemPrompt, userPrompt)
}

/** Parse a JSON array from a Claude response, with bracket-extraction fallback. */
function parseJSONArray(raw) {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch { /* fall through */ }
  try {
    const m = raw.match(/\[[\s\S]*\]/)
    if (m) {
      const parsed = JSON.parse(m[0])
      if (Array.isArray(parsed)) return parsed
    }
  } catch { /* fall through */ }
  return null
}

/**
 * Generate 5 shark myth-vs-fact True/False flashcard questions for a given date.
 *
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {Promise<Array<{ statement: string, isTrue: boolean, explanation: string, category: string }>>}
 */
export async function getSharkFlashcards(dateStr) {
  const cacheKey = `flashcards-${dateStr}`

  if (cache.has(cacheKey)) return cache.get(cacheKey)

  // Try pre-generated static file first (fast, no API quota used)
  try {
    const res = await fetch(`/daily/flashcards-${dateStr}.json`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        cache.set(cacheKey, data)
        return data
      }
    }
  } catch { /* fall through to live API */ }

  const systemPrompt =
    'You generate shark myth-vs-fact True/False flashcard questions for an 18-year-old with expert-level interest in marine biology. Questions must be scientifically accurate, surprising, and varied across species biology, behaviour, ocean science, conservation, and research. Mix true and false statements. Return a JSON array of exactly 5 objects, each with: statement (string), isTrue (boolean), explanation (string, 1-2 sentences of scientific context), category (one of: biology|behaviour|conservation|ocean|history).'

  const userPrompt = `Generate 5 shark True/False flashcards for ${dateStr}. Avoid obvious myths like "sharks must swim to breathe" — go deeper and more surprising. Each should make the reader think.`

  const raw = await generateText(cacheKey, systemPrompt, userPrompt)
  const result = parseJSONArray(raw) ?? []
  if (result.length > 0) cache.set(cacheKey, result)
  return result
}

/**
 * Generate 4 "on this day in shark history" events for a given date.
 *
 * @param {string} monthDay - MM-DD
 * @param {string} dateLabel - Human-readable date (e.g. "7 March")
 * @returns {Promise<Array<{ year: number, title: string, narrative: string, category: string }>>}
 */
export async function getSharkHistory(monthDay, dateLabel) {
  const cacheKey = `history-${monthDay}`

  if (cache.has(cacheKey)) return cache.get(cacheKey)

  // Try pre-generated static file first
  try {
    const res = await fetch(`/daily/history-${monthDay}.json`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        cache.set(cacheKey, data)
        return data
      }
    }
  } catch { /* fall through to live API */ }

  const systemPrompt =
    'You are a shark science historian generating "on this day / this week in shark history" events. Events can be real or plausibly constructed from the history of shark research — first expeditions, species discoveries, landmark conservation laws, famous research milestones, first cage dives, important publications, tagging firsts. Be specific with years, places, and names. Content should inspire a teenage marine biology enthusiast. Return a JSON array of exactly 4 objects with: year (number), title (string, max 70 chars), narrative (string, 2-3 vivid sentences), category (one of: research|discovery|conservation|encounter|milestone).'

  const userPrompt = `Generate 4 shark history events for "this week in shark history" — events that happened around ${dateLabel}. Span different decades between 1930 and 2020. Make each one feel like a significant moment in shark science.`

  const raw = await generateText(cacheKey, systemPrompt, userPrompt)
  const result = parseJSONArray(raw) ?? []
  if (result.length > 0) cache.set(cacheKey, result)
  return result
}

/**
 * Generate a short "what's happening in the ocean right now" daily digest.
 *
 * @param {object} params
 * @returns {Promise<string|null>}
 */
export async function getDailyDigest({ moonEmoji, moonPhase, moonNote, sharkName, sharkSpecies, newsHeadline, dateStr }) {
  const cacheKey = `digest-${dateStr}`

  const systemPrompt =
    'You write a single-paragraph "what\'s happening in the ocean right now" daily digest for an 18-year-old marine biology enthusiast. Exactly 3 sentences. Weave together: the current moon phase and what it means for shark behaviour, the day\'s most active tracked shark, and one current news headline. Present tense, vivid, scientifically grounded. Plain text only — no markdown, no headers, no bullet points.'

  const userPrompt = `Moon: ${moonEmoji} ${moonPhase} — ${moonNote}. Most active tracked shark: ${sharkName} (${sharkSpecies}). Today's news: "${newsHeadline}". Write today's ocean digest.`

  return generateText(cacheKey, systemPrompt, userPrompt)
}

/**
 * Generate a shark-scoped chat response using conversation history.
 *
 * @param {string} userMessage - The latest message from the user
 * @param {Array<{ role: 'user'|'model', text: string }>} conversationHistory - Prior turns
 * @returns {Promise<string|null>}
 */
export async function getSharkChatResponse(userMessage, conversationHistory = []) {
  const systemPrompt =
    'You are SharkWatch Assistant. Answer questions ONLY about sharks — biology, behaviour, species, conservation, research, ocean science. If asked anything else, redirect back to sharks. Keep answers concise and age-appropriate. You are talking to a teenager with expert-level interest in sharks.'

  // Build Claude messages array from conversation history
  const messages = conversationHistory.map(turn => ({
    role: turn.role === 'user' ? 'user' : 'assistant',
    content: turn.text,
  }))
  messages.push({ role: 'user', content: userMessage })

  const recentHistory = conversationHistory.slice(-3).map(t => t.text).join('|')
  const cacheKey = `chat-${recentHistory}-${userMessage}`.slice(0, 200)

  if (cache.has(cacheKey)) return cache.get(cacheKey)

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })
    const text = message.content[0].text
    cache.set(cacheKey, text)
    return text
  } catch (err) {
    console.error('Claude error:', err)
    return null
  }
}
