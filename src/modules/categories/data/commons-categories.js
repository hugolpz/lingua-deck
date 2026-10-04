import { openDB } from 'idb'

// WIKIMEDIA COMMONS
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php',
  DEFAULT_CATEGORIES = [
    'Category:Lingua_Libre_pronunciation',
    'Category:Lingua_Libre_pronunciation-other',
  ]
async function fetchSubcategoriesInfo(categoryTitle) {
  const results = []
  let continueToken = undefined

  do {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'categorymembers',
      gcmtitle: categoryTitle,
      gcmtype: 'subcat',
      gcmlimit: 'max',
      prop: 'categoryinfo',
      format: 'json',
      origin: '*',
    })

    if (continueToken) {
      params.set('gcmcontinue', continueToken)
    }

    const response = await fetch(`${COMMONS_API}?${params}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching subcategories of "${categoryTitle}"`)
    }

    const data = await response.json()

    if (data.query?.pages) {
      for (const page of Object.values(data.query.pages)) {
        results.push({
          title: page.title,
          files: page.categoryinfo?.files ?? 0,
        })
      }
    }

    continueToken = data.continue?.gcmcontinue ?? null
  } while (continueToken)

  return results
}

function extractIdAndTypeFromTitle(title) {
  const qidMatch = title.match(/(Q\d+)/),
    isoMatch = title.match(/Lingua Libre pronunciation-(.+)$/),
    userMatch = title.match(/Lingua Libre pronunciation by (.+)$/)
  if (qidMatch) {
    return { code: qidMatch[1], type: 'qid' }
  } else if (isoMatch) {
    return { code: isoMatch[1], type: 'iso' }
  } else if (userMatch) {
    return { code: userMatch[1], type: 'user' }
  }
  return { code: undefined, type: undefined }
}

async function categoriesInfoWithId(categories = DEFAULT_CATEGORIES) {
  const categoriesInfo = []
  for (const category of categories) {
    const subcategories = await fetchSubcategoriesInfo(category)
    categoriesInfo.push(...subcategories)
  }
  return categoriesInfo
    .map(({ title, files }) => {
      const { code, type } = extractIdAndTypeFromTitle(title)
      return { title, code, type, files }
    })
    .filter(({ code }) => code)
}

// WIKIDATA
// LOCATION EXTRACTOR
const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql'

function generateSparql(codes) {
  const isoValues = codes
    .filter((code) => !/Q\d+/.test(code))
    .map((code) => `"${code}"`)
    .join(' ')
  const qidValues = codes
    .filter((code) => /Q\d+/.test(code))
    .map((qid) => `wd:${qid}`)
    .join(' ')

  return `
    SELECT DISTINCT ?qid ?iso ?labelEnglish ?llid ?coord
    WHERE {
      {
        VALUES ?iso { ${isoValues} }
        ?item wdt:P220 ?iso.
        BIND(?item AS ?qid)
      }
      UNION
      {
        VALUES ?qid { ${qidValues} }
      }
      OPTIONAL {
        ?qid rdfs:label ?labelEnglish.
        FILTER(LANG(?labelEnglish) = "en")
      }
      OPTIONAL { ?qid wdt:P10369 ?llid. }
      OPTIONAL { ?qid wdt:P625 ?coord. }
    }
  `
}

function parseWikidataResults(data) {
  return data.results.bindings.map((binding) => {
    let lat = '',
      lon = ''
    if (binding.coord?.value) {
      const matches = binding.coord.value.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/)
      if (matches) {
        lon = parseFloat(matches[1])
        lat = parseFloat(matches[2])
      }
    }
    const qidUri = binding.qid.value
    return {
      qid: qidUri.substring(qidUri.lastIndexOf('/') + 1),
      iso: binding.iso?.value ?? '',
      labelEnglish: binding.labelEnglish?.value ?? '',
      llid: binding.llid?.value ?? '',
      lat,
      lon,
    }
  })
}

async function fetchWikidataLanguages(codes) {
  const response = await fetch(
    `${WIKIDATA_SPARQL}?query=${encodeURIComponent(generateSparql(codes))}`,
    { headers: { Accept: 'application/json' } },
  )
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching Wikidata languages`)
  const data = await response.json()
  return parseWikidataResults(data)
}

// JOINING DATA FUNCTION
// NOTE: could use data/languages-on-wd.json ?
// Could rewrite the sparql to also gather P625 `location` ?
async function fetchLanguagesData(categories = DEFAULT_CATEGORIES) {
  const categoriesInfo = await categoriesInfoWithId(categories)
  const codes = categoriesInfo.map(({ code }) => code)
  const wikidataResults = await fetchWikidataLanguages(codes)

  return categoriesInfo.map((category) => {
    const wikidata = wikidataResults.find((w) => w.qid === category.code || w.iso === category.code)
    return {
      title: category.title,
      code: category.code,
      type: category.type,
      files: category.files,
      ...wikidata,
    }
  })
}
async function fetchUsersData(categories = DEFAULT_CATEGORIES) {
  const categoriesInfo = await categoriesInfoWithId(categories)
  return categoriesInfo.map((category) => {
    return {
      title: category.title,
      code: category.code,
      type: category.type,
      files: category.files,
    }
  })
}
// SINGLE CATEGORY
const MAX_CATEGORY_FILES = 50000
const CACHE_DB = 'lingualibre-dashboard'

const commonsGet = async (params) => {
  const url = `${COMMONS_API}?${new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params })}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.info)
  return data
}

/** Number of files directly in a category (one cheap query). */
async function fetchCategoryFileCount(categoryTitle) {
  const data = await commonsGet({ action: 'query', prop: 'categoryinfo', titles: categoryTitle })
  return data.query.pages[0]?.categoryinfo?.files ?? 0
}

/**
 * Split `File:LL-Q150_(fra)-Yug-bonjour.wav` into language qid, locutor and expression.
 * The uploader (`author`) anchors the split, since locutors and words may contain hyphens.
 * `qid` is '' when the title does not follow the Lingua Libre naming.
 */
function parseRecordingTitle(title, author) {
  const qid = title.match(/^File:LL-(Q\d+)_/)?.[1] ?? ''
  const m = title.match(/^File:LL-Q\d+_\(([a-z-]+)\)-(.+)\.[A-Za-z0-9]+$/)
  const rest = m ? m[2] : title.replace(/^File:/, '').replace(/\.[A-Za-z0-9]+$/, '')
  const at = rest.indexOf(`${author}-`)
  if (at !== -1) {
    return { qid, locutor: author, expression: rest.slice(at + author.length + 1).replace(/_/g, ' ') }
  }
  // Locutor differs from the uploader: first hyphen separates locutor from expression
  const i = rest.indexOf('-')
  return i === -1
    ? { qid, locutor: author, expression: rest.replace(/_/g, ' ') }
    : { qid, locutor: rest.slice(0, i), expression: rest.slice(i + 1).replace(/_/g, ' ') }
}

/** Remap one `generator=categorymembers&prop=imageinfo` page to the dashboard edit format. */
function pageToEdit(page) {
  const info = page.imageinfo?.[0]
  if (!info) return null
  const date = info.timestamp.split('T')[0]
  const author = info.user.replace(/ /g, '_')
  const title = page.title.replace(/ /g, '_')
  const { qid, locutor, expression } = parseRecordingTitle(title, author)
  return {
    source: 'commons',
    title,
    author,
    timestamp: date,
    ns: page.ns,
    url: info.descriptionurl,
    comment: info.comment,
    group: `${date}_${author}_${title}`,
    expression,
    locutor,
    qid
  }
}

/**
 * Run `produce`, with a monthly IndexedDB cache in front of it.
 * The cache is optional: if IndexedDB is unavailable, blocked or broken, `produce` still runs.
 */
async function cached(key, produce) {
  const month = new Date().toISOString().slice(0, 7)
  let db = null
  try {
    db = await Promise.race([
      openDB(CACHE_DB, 1, { upgrade: (d) => d.createObjectStore('cache') }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('IndexedDB open timed out')), 3000)),
    ])
    const hit = await db.get('cache', key)
    if (hit?.month === month) return hit.value
  } catch (e) {
    console.warn('Category cache unavailable, fetching directly', e)
    db = null
  }
  const value = await produce()
  try {
    await db?.put('cache', { month, value }, key)
  } catch (e) {
    console.warn('Could not cache category edits', e)
  }
  return value
}

/**
 * All files of a category as edits. Categories of MAX_CATEGORY_FILES or more are refused: use `fetchCategoryFileCount` first.
 * @param {(loaded: number) => void} [onProgress] - called after each response with the number of files fetched so far
 * @returns {Promise<{source, title, author, timestamp, ns, url, comment, group, expression, locutor, qid}[]>}
 */
async function fetchCategorymembers(categoryTitle, onProgress) {
  return cached(`categoryEdits:v2:${categoryTitle}`, async () => {
    const pages = new Map() // pageid -> page, imageinfo continuation splits a page over several responses
    let cont = {}
    do {
      const data = await commonsGet({
        action: 'query',
        generator: 'categorymembers',
        gcmtitle: categoryTitle,
        gcmnamespace: '6',
        gcmlimit: 'max',
        prop: 'imageinfo',
        iiprop: 'url|timestamp|user|userid|size|comment',
        ...cont,
      })
      for (const p of data.query?.pages ?? []) {
        const known = pages.get(p.pageid)
        if (known) known.imageinfo = known.imageinfo ?? p.imageinfo
        else pages.set(p.pageid, p)
      }
      onProgress?.(pages.size)
      cont = data.continue
    } while (cont)
    return [...pages.values()]
      .map(pageToEdit)
      .filter(Boolean)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  })
}

// REQUESTED LIST
/** Wikitext of `Commons:Lingua_Libre/List/<Code>/Entries-without-audio-sorted-by-number-of-wiktionaries`. Returns null if missing. */
async function fetchRequestedList(isoCode) {
  const capitalized = isoCode.charAt(0).toUpperCase() + isoCode.slice(1)
  const title = `Commons:Lingua_Libre/List/${capitalized}/Entries-without-audio-sorted-by-number-of-wiktionaries`
  const data = await commonsGet({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: title })
  const content = data.query.pages[0]?.revisions?.[0]?.slots?.main?.content
  if (content == null) return null
  const words = stripLeadingTemplate(content)
    .split('\n')
    .map((l) => l.match(/^#\s*(.+)$/)?.[1].trim())
    .filter(Boolean)
  return { title, words }
}

/** Remove a leading `{{ ... }}` (may span lines and nest). */
function stripLeadingTemplate(text) {
  const t = text.trimStart()
  if (!t.startsWith('{{')) return text
  let depth = 0
  for (let i = 0; i < t.length - 1; i++) {
    if (t.startsWith('{{', i)) { depth++; i++ }
    else if (t.startsWith('}}', i)) { depth--; i++; if (depth === 0) return t.slice(i + 1) }
  }
  return ''
}

// EXPORT
export {
  MAX_CATEGORY_FILES,
  categoriesInfoWithId,
  extractIdAndTypeFromTitle,
  fetchWikidataLanguages,
  fetchLanguagesData,
  fetchUsersData,
  fetchCategoryFileCount,
  fetchCategorymembers,
  fetchRequestedList,
  parseRecordingTitle,
}
