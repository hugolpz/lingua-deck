# Modules

## Dashboard: edits data format

[SupportsView.vue](supports/SupportsView.vue) only renders the breadcrumb and header. The edits are loaded and consumed by its child
[SupportsView.vue](supports/SupportsView.vue), which gets them from `projectsActivityData()` in
[projectActivityData.js](supports/data/projectActivityData.js) (`projectEdits`, a `ref([])`).

An **edit** is one flat record, whatever its origin (MediaWiki revision, Git commit or Phabricator comment). Records are
sorted newest first and cached in IndexedDB (`lingualibre-dashboard`, store `cache`, keys `projectEdits` and `projectEditsOnPage`).
The cache is dropped when its newest edit is not from the current month.

### Fields

| Field       | Type             | Required | Meaning |
|-------------|------------------|----------|---------|
| `source`    | string           | yes      | Key of `API_ENDPOINTS` in [projectSatellitePlatforms.js](supports/data/projectSatellitePlatforms.js): `commons`, `meta`, `wikipedia`, `wikidata`, `gitlab`, `github`, `phabricator`, … Drives the source filter and logos. |
| `title`     | string           | yes      | Page title (MediaWiki), repository name (Git) or task title (Phabricator). Must be a string: it is lower-cased and matched by regex. |
| `author`    | string           | yes      | Username after `multipleUsernamesMerger()`, which maps aliases to one canonical name. |
| `timestamp` | string           | yes      | Date as `YYYY-MM-DD` (time stripped). Sorted and filtered as a date, and `slice(0, 7)` gives the month. |
| `ns`        | string or number | yes      | Namespace key, see below. |
| `diff`      | number or string | no       | Size delta in bytes (MediaWiki), 8-char short SHA (Git) or `T<taskId>` (Phabricator). When absent, the history table shows an empty cell and the net-volume KPI skips the edit. |
| `url`       | string           | yes      | Link opened from the history table. |
| `revid`     | string or number | no       | Revision id, commit SHA or comment id. Used in the table row key. Empty for a Phabricator task creation. |
| `group`     | string           | no       | `<date>_<author>_<title>` with whitespace as `_`. The history table merges rows sharing a `group` and sums numeric `diff`. |
| `comment`   | string           | no       | First line of the commit message (Git only). |
| `previd`    | number           | no       | Parent revision id (MediaWiki only). |
| `name`      | string           | no       | Phabricator project name (Phabricator only). |

`SupportsView` adds one derived field before passing edits to the charts:

- `source_ns`: `` `${source}:${ns}` ``. It is the grouping key for namespace breakdowns and is resolved to a label and color by `getNamespaceInfo(ns, source)`.

### `ns` values

| Origin      | `ns` |
|-------------|------|
| MediaWiki   | The numeric namespace of the page (`0` main, `4` project, `6` File, …), as returned by the API. |
| GitLab      | `"-1"` |
| GitHub      | `"-2"` |
| Phabricator | The Phabricator project id (a number, e.g. `6913`). |

Negative and Phabricator values are conventions of this dashboard, not MediaWiki namespaces. They are labeled through `namespaceMapping`
in [projectSatellitePlatforms.js](supports/data/projectSatellitePlatforms.js); an unmapped key falls back to `Namespace <ns>` and a shared color.

### Filters applied by SupportsView

Edits pass through these steps in order. The first and last depend on the page URL query that SupportsView also reads for its breadcrumb.

1. Date range (`DateRange`), starting from `2015Q1`.
2. `source` (the logo toggle).
3. Bots, hidden by default: author starts or ends with `bot`, starts with `translatewiki`, or title starts with `Update output files`.
4. Translation subpages, hidden by default: title ending in `/xx` or `/xx-yyyy`.
5. `?username=` equals `author` exactly.
6. `?title=` equals `title` exactly. With a title, edits are fetched for that page only instead of the whole project.

### Example

```js
// MediaWiki revision
{
  revid: 812345678, previd: 812345001,
  title: 'Commons:Lingua Libre', ns: 4, source: 'commons',
  author: 'Yug', timestamp: '2024-03-18', diff: 412,
  url: 'https://commons.wikimedia.org/wiki/index.php?oldid=812345001&diff=812345678',
  group: '2024-03-18_Yug_Commons:Lingua_Libre',
}

// GitHub commit
{
  revid: '4f2a9c1d…', title: 'Upload2Commons', comment: 'Fix retry on 429',
  ns: '-2', source: 'github', author: 'Yug', timestamp: '2024-03-18',
  diff: '4f2a9c1d', url: 'https://github.com/lingua-libre/Upload2Commons/commit/4f2a9c1d…',
  group: '2024-03-18_hugolpz_Upload2Commons',
}
```

### Known inconsistencies

- `ns` mixes strings and numbers; `getNamespaceInfo` compares both for `0` only.
- `diff` is a number for MediaWiki and a string otherwise, so the table decides how to render it from its type and length (`< 7` or `< 8` characters).
- The MediaWiki `url` is built with `index.php?oldid=…` appended to `API_ENDPOINTS[source].link`, which already ends in `/wiki/`.

## Categories: edits data format

`fetchCategorymembers(categoryTitle)` in [commons-categories.js](categories/data/commons-categories.js) returns one edit per file of a Commons category, using the dashboard edit shape above plus two fields parsed from the file name (`File:LL-Q<qid>_(<iso>)-<locutor>-<expression>.<ext>`).
It runs one `generator=categorymembers` + `prop=imageinfo` query (namespace 6), merges pages split across continuation responses by `pageid`, and caches the result in IndexedDB until the end of the month.

| Field        | Meaning |
|--------------|---------|
| `source`     | Always `commons`. |
| `title`      | File title, spaces as `_`. |
| `author`     | Uploader (`imageinfo.user`), spaces as `_`. |
| `timestamp`  | Upload date, `YYYY-MM-DD`. |
| `ns`         | `6` (File). |
| `url`        | Commons file page (`descriptionurl`). The audio URL can be derived with `https://commons.wikimedia.org/wiki/Special:FilePath/<title>`. |
| `comment`    | Upload comment. |
| `group`      | `<date>_<author>_<title>`. |
| `expression` | Recorded word, from the file name. |
| `qid`        | Wikidata item of the recorded language, from the `LL-Q<qid>_` file name prefix; `''` if absent. |
| `locutor`    | Speaker, from the file name. Equals `author` when the file name starts with the uploader. When it does not, the first hyphen splits locutor from expression, so a hyphenated locutor name is cut short. |

There is no `diff` field. Categories with 50,000 files or more are not fetched (`MAX_CATEGORY_FILES`): `CategoryView.vue` shows the file count and asks for a smaller category instead.
