// Incubator, Wikidata and Commons helpers for the incubators module.
import languages from '@/data/languages-on-wd.json'
import { ETHNOLOGUE_STATUS_LABELS, ethnologStatusColor } from '@/js/ethnologue'

const INCUBATOR_API = 'https://incubator.wikimedia.org/w/api.php'
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'
const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql'

export const incubatorPageUrl = (code) => `https://incubator.wikimedia.org/wiki/Wp/${code}`
export const wikipediaApi = (code) => `https://${code}.wikipedia.org/w/api.php`
export const wikipediaPageUrl = (code) => `https://${code}.wikipedia.org`
export const commonsPageUrl = (title) =>
  `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_')).replace(/%2F/g, '/').replace(/%3A/g, ':')}`

const apiUrl = (base, params) =>
  `${base}?${new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params })}`

const getJson = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** Follow `continue` until exhausted, merging each response with `collect`. */
async function paginate(base, params, collect) {
  let cont = {}
  do {
    const data = await getJson(apiUrl(base, { ...params, ...cont }))
    if (data.error) throw new Error(data.error.info)
    collect(data.query)
    cont = data.continue
  } while (cont)
}

/* ---- Language lookup: Incubator codes are ISO 639-1 or 639-3 ---- */
const byCode = new Map()
for (const l of languages) {
  if (l.iso639_1) byCode.set(l.iso639_1, l)
}
for (const l of languages) {
  if (l.iso639_3 && !byCode.has(l.iso639_3)) byCode.set(l.iso639_3, l)
}
export const languageForCode = (code) => byCode.get(code) || null

/**
 * Wikipedia incubators: subcategories `Category:Wp/<code>` of
 * Category:Incubator:All_test_wikis, with their page counts and language data.
 * @returns {Promise<{code, pages, qid, label, nativeLabel, type}[]>}
 */
export async function fetchIncubatorsWpList() {
  const titles = []
  await paginate(
    INCUBATOR_API,
    {
      action: 'query',
      list: 'categorymembers',
      cmtitle: 'Category:Incubator:All_test_wikis',
      cmtype: 'subcat',
      cmlimit: 'max',
    },
    (q) => titles.push(...q.categorymembers.map((m) => m.title).filter((t) => t.startsWith('Category:Wp/'))),
  )

  const incubators = titles.map((t) => ({ code: t.slice('Category:Wp/'.length), pages: 0, type: 'incubator' }))
  const byTitle = new Map(titles.map((t, i) => [t, incubators[i]]))
  for (let i = 0; i < titles.length; i += 50) {
    const data = await getJson(
      apiUrl(INCUBATOR_API, { action: 'query', prop: 'categoryinfo', titles: titles.slice(i, i + 50).join('|') }),
    )
    for (const p of data.query.pages) {
      const entry = byTitle.get(p.title)
      if (entry) entry.pages = p.categoryinfo?.pages ?? 0
    }
  }

  return incubators
    .map((i) => {
      const l = languageForCode(i.code)
      return { ...i, qid: l?.value ?? '', label: l?.label ?? '', nativeLabel: l?.nativeLabel ?? '', population: l?.population ?? null }
    })
    .sort((a, b) => b.pages - a.pages)
}

/**
 * Small Wikipedias under 28,000 articles from Wikimedia Commons statistics.
 * Uses MediaWiki API to fetch the raw page content (CORS-friendly).
 * @returns {Promise<{code, pages, wpRank, type, qid, label, nativeLabel, population}[]>}
 */
export async function fetchSmallWikipedias() {
  // Use MediaWiki API with origin=* for CORS support
  const url = apiUrl(COMMONS_API, {
    action: 'query',
    titles: 'Data:Wikipedia_statistics/daily.tab',
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
  })
  const data = await getJson(url)

  const page = data.query.pages[Object.keys(data.query.pages)[0]]
  const content = page?.revisions?.[0]?.slots?.main?.content

  if (!content) {
    console.warn('Could not fetch Wikipedia statistics data')
    return []
  }

  // Parse the JSON content (the page contains JSON data)
  let jsonData
  try {
    jsonData = JSON.parse(content)
  } catch (e) {
    console.warn('Failed to parse Wikipedia statistics data', e)
    return []
  }

  const SMALL_WIKI_MAX_ARTICLES = 28000

  return jsonData.data
    .filter((row) => {
      const articles = row[4]
      return typeof articles === 'number' && articles > 0 && articles <= SMALL_WIKI_MAX_ARTICLES
    })
    .map((row) => {
      const lang = row[0]
      const pos = row[1]
      const articles = row[4]
      const l = languageForCode(lang)
      return {
        code: lang,
        pages: articles,
        wpRank: pos,
        type: 'wikipedia',
        qid: l?.value ?? '',
        label: l?.label ?? '',
        nativeLabel: l?.nativeLabel ?? '',
        population: l?.population ?? null,
      }
    })
    .sort((a, b) => b.pages - a.pages)
}

/** Wikidata data of languages -> { [qid]: { lat, lon, status, population, color } } */
export async function fetchLanguagesDataSPARQL(qids) {
  const out = {}
  for (let i = 0; i < qids.length; i += 200) {
    const values = qids.slice(i, i + 200).map((q) => `wd:${q}`).join(' ')
    const query = `SELECT ?qid ?coord ?status ?population WHERE { 
      VALUES ?qid { ${values} } 
      ?qid wdt:P625 ?coord. 
      OPTIONAL { ?qid wdt:P3823 ?status. } 
      OPTIONAL { ?qid wdt:P1098 ?population. }
    }`
    const data = await getJson(`${WIKIDATA_SPARQL}?${new URLSearchParams({ query, format: 'json' })}`)
    for (const b of data.results.bindings) {
      const qid = b.qid.value.split('/').pop()
      const result = {}
      const m = b.coord?.value?.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/)
      if (m) {
        result.lat = parseFloat(m[2])
        result.lon = parseFloat(m[1])
      }
      const statusQid = b.status?.value?.split('/').pop()
      result.status = ETHNOLOGUE_STATUS_LABELS[statusQid] || ""
      result.population = b.population?.value || ""
      result.color = ethnologStatusColor(result.status)
      out[qid] = result
    }
  }
  return out
}

/**
 * Pages of an incubator (Special:AllPages/Wp/<code>), longest first.
 * `touched` is the last edit/touch date: creation dates would need one request per page.
 * @returns {Promise<{pageid, title, length, touched}[]>}
 */
export async function fetchIncubatorPages(code) {
  const pages = []
  await paginate(
    INCUBATOR_API,
    { action: 'query', generator: 'allpages', gapprefix: `Wp/${code}/`, gaplimit: 'max', prop: 'info' },
    (q) => pages.push(...(q?.pages ?? []).map((p) => ({ pageid: p.pageid, title: p.title, length: p.length, touched: p.touched }))),
  )
  return pages.sort((a, b) => b.length - a.length)
}

/**
 * Articles of a small Wikipedia (main namespace, no redirects), longest first.
 * @returns {Promise<{pageid, title, length, touched}[]>}
 */
export async function fetchWikipediaPages(code) {
  const pages = []
  await paginate(
    wikipediaApi(code),
    { action: 'query', generator: 'allpages', gapnamespace: '0', gapfilterredir: 'nonredirects', gaplimit: 'max', prop: 'info' },
    (q) => pages.push(...(q?.pages ?? []).map((p) => ({ pageid: p.pageid, title: p.title, length: p.length, touched: p.touched }))),
  )
  return pages.sort((a, b) => b.length - a.length)
}

/**
 * Raw Wikitext of pages, 50 page IDs per request. Returns an array of strings.
 * IDs rather than titles: 50 titles in a non-Latin script (e.g. Gothic on got.wikipedia.org,
 * 12 chars per letter once URL-encoded) overflow the URL limit and fail with a 414, which the
 * browser reports as a CORS error.
 * If this error returns, the preferred alternative is to keep titles but control the URL length:
 * fill each batch until its encoded query reaches ~6 KB, instead of a fixed count.
 */
export async function fetchWikitexts(pageids, onProgress, api = INCUBATOR_API) {
  const texts = []
  for (let i = 0; i < pageids.length; i += 50) {
    const data = await getJson(
      apiUrl(api, {
        action: 'query',
        prop: 'revisions',
        rvprop: 'content',
        rvslots: 'main',
        pageids: pageids.slice(i, i + 50).join('|'),
      }),
    )
    for (const p of data.query.pages) {
      const content = p.revisions?.[0]?.slots?.main?.content
      if (content) texts.push(content)
    }
    onProgress?.(Math.min(i + 50, pageids.length), pageids.length)
  }
  return texts
}

/** Commons lists under Commons:Lingua_Libre/List/<Code>/ with their number of lines. */
export async function fetchExistingLists(code) {
  const capitalized = code.charAt(0).toUpperCase() + code.slice(1)
  const prefix = `Commons:Lingua Libre/List/${capitalized}/`
  const lists = []
  await paginate(
    COMMONS_API,
    { action: 'query', list: 'allpages', apprefix: prefix.replace('Commons:', ''), apnamespace: '4', aplimit: 'max' },
    (q) => lists.push(...q.allpages.map((p) => ({ title: p.title, lines: null }))),
  )
  for (let i = 0; i < lists.length; i += 50) {
    const batch = lists.slice(i, i + 50)
    const data = await getJson(
      apiUrl(COMMONS_API, {
        action: 'query',
        prop: 'revisions',
        rvprop: 'content',
        rvslots: 'main',
        titles: batch.map((l) => l.title).join('|'),
      }),
    )
    const lines = new Map(
      data.query.pages.map((p) => {
        const content = p.revisions?.[0]?.slots?.main?.content ?? ''
        return [p.title, content.split('\n').filter((l) => l.trim()).length]
      }),
    )
    for (const l of batch) l.lines = lines.get(l.title) ?? 0
  }
  return lists
}

/** Commons exclusion list for a language, with its number of non-empty lines. */
export async function fetchExclusionList(code) {
  const capitalized = code.charAt(0).toUpperCase() + code.slice(1)
  const title = `Commons:Lingua Libre/Exclusion list:${capitalized}`
  const data = await getJson(
    apiUrl(COMMONS_API, {
      action: 'query',
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
      titles: title,
    }),
  )
  const page = data.query.pages[0]
  const content = page?.revisions?.[0]?.slots?.main?.content ?? ''
  const lines = content.split('\n').filter((line) => line.trim())
  // Entries may be written as `# word`, `* word` or `word`
  const words = lines.map((line) => line.replace(/^[#*\s]+/, '').trim()).filter(Boolean)
  return { title, lines: lines.length, words }
}
