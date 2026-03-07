/**
 * Lightweight XML RSS/Atom parser using the native browser DOMParser.
 * Handles RSS 2.0 and Atom feed formats.
 *
 * @param {string} xmlString - Raw XML string from a feed endpoint
 * @param {string} sourceName - Human-readable label for the feed source
 * @returns {Array<{ title: string, link: string, pubDate: string|null, source: string, description: string }>}
 */
export function parseRSS(xmlString, sourceName) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')

  // Check for parse errors
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    console.warn(`[rssParser] Failed to parse feed from "${sourceName}":`, parserError.textContent)
    return []
  }

  const isAtom = xmlString.trimStart().includes('<feed')

  if (isAtom) {
    return parseAtom(doc, sourceName)
  }

  return parseRSS2(doc, sourceName)
}

/**
 * Parse an RSS 2.0 document.
 * @param {Document} doc
 * @param {string} sourceName
 * @returns {Array}
 */
function parseRSS2(doc, sourceName) {
  const items = Array.from(doc.querySelectorAll('item'))

  return items.map(item => {
    const title = getTextContent(item, 'title')
    const link = getTextContent(item, 'link') || getTextContent(item, 'guid')
    const pubDate = getTextContent(item, 'pubDate')
    const description = getTextContent(item, 'description')

    return {
      title: title || 'Untitled',
      link: link || '',
      pubDate: pubDate || null,
      source: sourceName,
      description: stripHtml(description || ''),
    }
  })
}

/**
 * Parse an Atom feed document.
 * @param {Document} doc
 * @param {string} sourceName
 * @returns {Array}
 */
function parseAtom(doc, sourceName) {
  const entries = Array.from(doc.querySelectorAll('entry'))

  return entries.map(entry => {
    const title = getTextContent(entry, 'title')

    // Atom link is an element with href attribute, not text content
    const linkEl = entry.querySelector('link[rel="alternate"]') || entry.querySelector('link')
    const link = linkEl?.getAttribute('href') || getTextContent(entry, 'id') || ''

    const pubDate = getTextContent(entry, 'updated') || getTextContent(entry, 'published')
    const description =
      getTextContent(entry, 'summary') || getTextContent(entry, 'content')

    return {
      title: title || 'Untitled',
      link,
      pubDate: pubDate || null,
      source: sourceName,
      description: stripHtml(description || ''),
    }
  })
}

/**
 * Get trimmed text content of the first matching child element.
 * @param {Element} parent
 * @param {string} selector
 * @returns {string}
 */
function getTextContent(parent, selector) {
  const el = parent.querySelector(selector)
  return el ? (el.textContent || '').trim() : ''
}

/**
 * Strip HTML tags from a string, returning plain text.
 * @param {string} html
 * @returns {string}
 */
function stripHtml(html) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || tmp.innerText || '').trim()
}
