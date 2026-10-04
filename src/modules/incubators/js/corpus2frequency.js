// Wikitext -> word frequencies. Pure functions, usable in the main thread and in a Web Worker.
import wtf from 'wtf_wikipedia'

/** Strip Wikitext markup to plain text with wtf_wikipedia. */
export function wikitextToPlain(wikitext) {
  if (!wikitext) return ''
  try {
    return wtf(wikitext).text() || ''
  } catch {
    return ''
  }
}

/** Lowercase text; drop HTML tags, numbers, punctuation and other non-letters. Marks are kept (Indic scripts etc.). */
export function cleanText(text) {
  return text
    .replace(/<[^>]*>/g, ' ')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\s]/gu, ' ')
}

/** Count words of already plain text; single-letter words are ignored. */
export function countWords(plainText, counts = new Map()) {
  for (const word of cleanText(plainText).split(/\s+/)) {
    if (!word || [...word].length < 2) continue
    counts.set(word, (counts.get(word) || 0) + 1)
  }
  return counts
}

const toArray = (counts) =>
  [...counts].map(([expression, occurences]) => ({ expression, occurences }))

/** Wikitext pages -> [{ expression, occurences }] */
export function pagesToFrequencies(wikitexts) {
  const counts = new Map()
  for (const wikitext of wikitexts) countWords(wikitextToPlain(wikitext), counts)
  return toArray(counts)
}

/** Combine several frequency arrays, summing matching expressions. */
export function mergeFrequencies(...arrays) {
  const counts = new Map()
  for (const array of arrays) {
    for (const { expression, occurences } of array) {
      counts.set(expression, (counts.get(expression) || 0) + occurences)
    }
  }
  return toArray(counts)
}
