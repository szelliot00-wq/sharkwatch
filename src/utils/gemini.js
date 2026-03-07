import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// In-memory cache to avoid redundant API calls within a session
const cache = new Map()

/**
 * Generate text from Gemini, with caching.
 *
 * @param {string} cacheKey - Unique key identifying this request
 * @param {string} systemPrompt - Instruction context for the model
 * @param {string} userPrompt - The actual user-facing prompt
 * @returns {Promise<string|null>} Generated text, or null on error
 */
export async function generateText(cacheKey, systemPrompt, userPrompt) {
  if (cache.has(cacheKey)) return cache.get(cacheKey)

  try {
    const prompt = systemPrompt + '\n\n' + userPrompt
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    cache.set(cacheKey, text)
    return text
  } catch (err) {
    console.error('Gemini error:', err)
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
  // Use a hash of the first 100 chars as a cache key
  const cacheKey = `paper-${abstract.slice(0, 100)}`

  const systemPrompt =
    'You summarise academic abstracts in one clear sentence for a teenage audience with a strong interest in marine biology. Return only the sentence.'

  const userPrompt = `Summarise this abstract: ${abstract}`

  return generateText(cacheKey, systemPrompt, userPrompt)
}

/**
 * Generate a shark-scoped chat response using conversation history.
 * The assistant will redirect off-topic questions back to sharks.
 *
 * @param {string} userMessage - The latest message from the user
 * @param {Array<{ role: 'user'|'model', text: string }>} conversationHistory - Prior turns
 * @returns {Promise<string|null>}
 */
export async function getSharkChatResponse(userMessage, conversationHistory = []) {
  const systemPrompt =
    'You are SharkWatch Assistant. Answer questions ONLY about sharks — biology, behaviour, species, conservation, research, ocean science. If asked anything else, redirect back to sharks. Keep answers concise and age-appropriate. You are talking to a teenager with expert-level interest in sharks.'

  // Build a history string to include prior context
  const historyText = conversationHistory
    .map(turn => `${turn.role === 'user' ? 'User' : 'SharkWatch'}: ${turn.text}`)
    .join('\n')

  const userPrompt = historyText
    ? `${historyText}\nUser: ${userMessage}`
    : userMessage

  // Cache key includes last 3 turns + current message to avoid stale cache collisions
  const recentHistory = conversationHistory.slice(-3).map(t => t.text).join('|')
  const cacheKey = `chat-${recentHistory}-${userMessage}`.slice(0, 200)

  return generateText(cacheKey, systemPrompt, userPrompt)
}
