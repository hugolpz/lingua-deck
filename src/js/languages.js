import languages from '@/data/languages-on-wd.json'

// Single source of truth: languages-on-wd.json. Indexes are derived at load time,
// then extended in place by loadLanguagesExtension().
export const languagesByQid = Object.fromEntries(languages.map(l => [l.value, l]))
export const languagesByIso = Object.fromEntries(
  languages.filter(l => l.iso639_3).map(l => [l.iso639_3, l])
)

/* **************************************************************** */
/* Fetching extension JSON data from Commons. ********************* */
export const EXTENSION_URL =
  'https://commons.wikimedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main' +
  '&titles=User:Yug/LinguaLibre/languages-extension.json&format=json&formatversion=2&origin=*'

const STRING_KEYS = ['label', 'type', 'iso639_1', 'iso639_3', 'nativeLabel']

// An entry is valid if it has a QID `value`, and any of the known keys is a string.
export const isValidLanguage = (l) =>
  l !== null &&
  typeof l === 'object' &&
  typeof l.value === 'string' &&
  /^Q\d+$/.test(l.value) &&
  typeof l.label === 'string' &&
  STRING_KEYS.every(k => l[k] === undefined || typeof l[k] === 'string')

/**
 * Fetch the extension JSON from Commons. Returns only the valid entries
 * (invalid ones are skipped with a console warning). Throws if the payload
 * is not a JSON array.
 */
export const fetchLanguagesExtension = async (url = EXTENSION_URL) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Languages extension: HTTP ${response.status}`)
  const content = (await response.json()).query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content
  if (typeof content !== 'string') throw new Error('Languages extension: page content not found')
  const data = JSON.parse(content)
  if (!Array.isArray(data)) throw new Error('Languages extension: expected a JSON array')
  return data.filter(l => {
    const ok = isValidLanguage(l)
    if (!ok) console.warn('Languages extension: skipped invalid entry', l)
    return ok
  })
}

/**
 * Merge entries into the indexes in place. Existing QIDs and ISO codes are never
 * overridden. Returns the number of entries added.
 */
export const appendLanguages = (entries) => {
  let added = 0
  for (const l of entries) {
    if (languagesByQid[l.value]) continue
    languagesByQid[l.value] = l
    if (l.iso639_3 && !languagesByIso[l.iso639_3]) languagesByIso[l.iso639_3] = l
    added++
  }
  return added
}

/** Fetch + validate + append. Never throws: on failure the base data is kept. */
export const loadLanguagesExtension = async (url) => {
  try {
    return appendLanguages(await fetchLanguagesExtension(url))
  } catch (e) {
    console.warn('Languages extension not loaded:', e)
    return 0
  }
}
