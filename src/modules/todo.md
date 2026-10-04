## Module todo

## General

- [x] split into a new repository the modules : ./categories, ./dashboard, ./dictionary, ./transparency, ./gallery.

## Supports

- In components/DateRange.vue , inline the title and the time rage picker component.
- Add time range url parameter `start` and `end` to filter edits.
  See also components/DateRange.vue for the date range picker component.
- Create a RecentChanges.vue for all pages of Wikimedia Commons prefixed by `Commons:Lingua_Libre` or `Help:Lingua Libre`. Use the wikimedia API action query, generator recentchanges , for page titles use grcltitles=Commons:Lingua_Libre and grcltitles=Help:Lingua Libre. Merge both, sort by date. Add filter fields for user, page title, and date range. Display the results in a table with columns for date, user, page title, and edit summary. Include pagination if there are more than 250 results. Default to 90 days, 2000 changes or max.

I want to make @src/modules/supports/components/Linegraph.vue , @src/modules/supports/components/RecentChanges.vue , @src/modules/supports/components/TopChart.vue @src/modules/supports/components/TopList.vue @src/modules/supports/components/DateRange.vue available to all modules and move them to the shared /src/components . Check each if it can be generalized and moved out of the Dashboard module.

/* *********************************************************************** _/
/_ *********************************************************************** _/
/_ *********************************************************************** */

In @src/modules/supports/SupportsView.vue , the components stay invisible for a while and are no more loading the edits data as it loads. Why ?

/* *********************************************************************** _/
/_ *********************************************************************** _/
/_ *********************************************************************** _/
/_ *********************************************************************** */

### Digest

### Changelogs

Draft v0, to be rediscussed. Inspired by toolhub-evolved: Git history -> JSON file -> view. AI-written notes are a later phase.

#### Goal

A public `/changelog` page listing what changed in Lingua Deck, newest first, linked from the footer ("About").

#### Phase 1: deterministic, no AI

1. **Build script** `tools/build_changelog.mjs` (Node, no dependencies):
   - runs `git log` and parses each subject as `kind(scope): summary`;
   - groups by kind (feat, fix, perf, docs, refactor, chore, other) and by date (or by tag when tags exist);
   - writes `public/data/changelog.json`: `{ generatedAt, releases: [{ id, title, date, sha, groups: [{ label, items: [{ summary, scope, sha }] }] }] }`.
2. **Scripts**: `"changelog": "node tools/build_changelog.mjs"`, and run it before `vite build` (`"build": "npm run changelog && vite build"`).
3. **View** `src/views/ChangelogView.vue`, route `/changelog`:
   - `fetch(import.meta.env.BASE_URL + 'data/changelog.json')` (the site is served under `VITE_BASE` on GitHub Pages);
   - one `<section>` per release, groups as lists, each item linking to its commit on GitHub; empty and error states use `alert alert-info` / `alert alert-error`.
4. **CI**: `actions/checkout@v4` in `.github/workflows/pages.yml` is shallow by default, so add `fetch-depth: 0` or the script sees one commit.
5. **Footer / nav**: add the entry in `links.js` footer data (not the top bar).

#### Open questions

- **Commit style**: current history is mixed (`dashboard: fix`, `various adjustments`). Adopt Conventional Commits (`feat:`, `fix:`) from now on, with commitlint as toolhub-evolved does, or group by scope only and show "Other"?
- **Releases**: one block per day, per tag, or per deploy (push to main)? Tags are cheapest and give readable titles.
- **Noise**: filter `chore`, `docs`, `ci` and merge commits out of the public page, or hide them behind a "Technical details" toggle like toolhub-evolved?
- **Generated file**: commit `public/data/changelog.json`, or generate it only at build time (preferred: no churn in Git)?
- **Languages**: English only for now.

#### Phase 2 (later): AI-drafted user notes

- Script `tools/generate_release_notes.mjs`: sends only structured commit metadata of a bounded range to an LLM; accepts the reply only if it matches a fixed format (`<USER>` / `<TECHNICAL>` sections, length cap); writes a reviewed `docs/CHANGELOG-USER.md` that a human edits before commit.
- The view prefers the reviewed notes when present and falls back to the Phase 1 commit list.
- A CI freshness check warns when the latest release has no notes.

#### Verification

- `npm run changelog` produces valid JSON from the real history; `npm run build` and `npm run preview`, open `/changelog` under the base path, and reload on it (the `404.html` SPA fallback).
- A unit test (vitest) for the commit-subject parser.

### Top bar

-

### Footer

- Learn a well balanced footer from https://toolhub-evolved.toolforge.org
  - Study the layout, the columns, the links, the icons, the colors, the fonts, the spacing, the alignment, the responsiveness.
  - Study the indexed content.
- I'm interested to move toward an AI-driven digest and changelog, place will be needed.
- Add footer with columns then indented items. You may use `›` and `››`.

#### Personal content

Below is the list of my own content to map. Implemented in `src/router/footer.js` (data) and `src/components/AppFooter.vue`; keep the two in sync with this list.

```
- Foundational tools :
  - [Small Wikis Lexicons](/incubators)
  - [Recording app](https://lingualibre.org/app)
    - [Source](https://gitlab.wikimedia.org/lingua-libre/)
  - Userscripts:
    - [RoR.js](https://meta.wikimedia.org/wiki/User:Yug/RenameOrReplace) - Rename or Replace
    - [Swadesh augmenter](https://meta.wikimedia.org/wiki/User:Yug/Lingualibre_list_augmenter)
  - [Rapid Dictionary](/dictionary) ([doc](https://commons.wikimedia.org/wiki/Commons:Lingua_Libre/Dictionary))
- Explore Lingua Libre:
  - [Recording app](https://lingualibre.org)
  - [Commons:Lingua Libre](https://commons.wikimedia.org/wiki/Commons:Lingua_Libre)
  - [Chatroom](https://commons.wikimedia.org/wiki/Commons_talk:Lingua_Libre)
  - [Lists](https://commons.wikimedia.org/wiki/Commons:Lingua_Libre/List) (live count of languages)
    - [Lists by method](https://commons.wikimedia.org/wiki/Category:Lingua_Libre_lists_by_method) (live count)
    - [Lists by quality](https://commons.wikimedia.org/wiki/Category:Lingua_Libre_lists_by_quality) (live count)
    - [Lists of most requested by language](https://commons.wikimedia.org/wiki/Category:Lingua_Libre_list/Method:refreshed) (live count)
    - [Exclusion lists](https://commons.wikimedia.org/wiki/Category:Lingua_Libre_exclusion_lists) (live count)
- Analyse Lingua Libre :
  - [Gallery](/gallery)
  - [Languages](/languages)
  - [Recordists](/recordists)
  - [Editors](/supports)
  - [App logs](/logs)
  - [Transparency](/transparency)
    - [Lingua Libre](/transparency/lingualibre)
    - [WMFR spendings](/transparency/wmfr)
- About :
  - [About Lingua Libre](https://meta.wikimedia.org/wiki/Lingua_Libre)
  - [About Lingua Deck](https://github.com/hugolpz/lingua-plus)
  - Changelog (/changelog, hidden until built)
  - Digest (/digest, hidden until built)
  - About author
    - [GitHub](https://github.com/hugolpz)
    - [Gitlab](https://gitlab.wikimedia.org/users/yug/contributed)
    - [Meta](https://meta.wikimedia.org/wiki/User:Yug)
    - [Toolhub+](https://toolhub-evolved.toolforge.org/people/yug-d746)
```

## Categories

- Assets are in ../supports/ and ../../js/
- First, clean up the model modules/supports/*.
- Prerequires :
  - Move and rename @src/modules/supports/components/CategoriesDataFetcher.vue to /catetories/CategoriesView.vue
  - Move and CategoriesLists.vue into /categories/components/
- Context: all /categories/ pages with @src/components/AppBreadcrumb.vue navigation.
- Components to improve:
  - ./CategoriesView.vue : a dashboard for categories, loads other components and displays them in a grid layout.
  - Helpers logics in ./data/commons-categories.js
    - if category has <50,000 members, create a fetchCategorymembers() usign API query and `action=query&generator=categorymembers&gcmtitle=Category:Lingua_Libre_pronunciation by Yug&prop=imageinfo&iiprop=url|timestamp|ids|timestamp|user|userid|size|comment&gcmnamespace=6&gcmlimit=max&format=json&formatversion=2`. Return an array of edits with remap such as :
  ```
  let date = item.imageinfo[0].timestamp.split('T')[0],
      author = item.imageinfo[0].user.replace(/ /g, '_'),
      title = item.title.replace(/ /g, '_'),
      group = `${date}_${author}_${title}` ;
  {
    source: "commons",
    title: title,
    author: author,
    timestamp: date,
    ns: item.ns,
    url: item.imageinfo[0].url,
    comment: item.imageinfo[0].comment,
    group: group,
    expression: title.split(author)[-1].replace(/^\)?-/,'').split(".wav"
  ```

),
locutor: title.replace(/^File:LL-Q\d+_\([a-z]+-?[a-z]\*\)-/,'').split(author)[0].replace(/(_\(?$/,'') || author,

```
  - CategoriesLists.vue : already exist, add link to CategoriesCategory.vue .
- Components to improve or create:
  - CategoryView.vue : leverage fetchCategorymembers(), then pass edits data to down.
  - CategoryKpiMetricCards.vue: from src/modules/supports/components/SupportsKpiMetricCards.vue, create to display the KPIs for a category. Number of files, number of locutors, number of authors, number of expressions.
    - Create modules/components/KPIMetricCard.vue : a card to display a KPI metric with a title, value, and icon [optional]. Migrate src/modules/supports/components/KpiMetricCard.vue to this new component as well.
  - CategoryActivityLinegraph.vue : from edits timestamps and users, sort by timestamp ASC, rely on src/modules/supports/components/Linegraph.vue.
  - Top authors : use src/modules/supports/components/TopList.vue, pass it the edits data, focus on authors.
  - Top locutors : use src/modules/supports/components/TopList.vue, pass it the edits data, focus on locutors. Display 20.
  - Top expressions : use src/modules/supports/components/TopList.vue, pass it the edits data, focus on expressions. Display 20.
  - Recent Uploads: use src/modules/supports/components/RecentChanges.vue, pass it the edits data, sort by date with most recent first. Display 50.
  - CategoryLexicon.vue: from edits, list recorded expression. Display in src/modules/incubators/components/CorpusResults.vue. Since there is `url`, add a link to the file on Wikimedia Commons. Since there is no "occurences", add logic to add the view occurences button.
  - CategoryRequestedList.vue: if https://commons.wikimedia.org/wiki/Commons:Lingua_Libre/List/${code.capitalized()}/Entries-without-audio-sorted-by-number-of-wiktionaries wikitext content exist, then display this list in Corpus results.vue. If not, display a message "No requested list found for this category". Add a link to the page on Wikimedia Commons for each row. Use cdxIconEdit.

Move shared components to src/modules/components/ and import them in incubators, categories and dashboard modules.


## Incubators
Create src/modules/IncubatorsView.vue : a dashboard for wikimedia incubators.

### Create component IncubatorsLists.vue :
- Title: List of wikipedia incubators
- Data:
  - Fetch categorymembers from on `https://incubator.wikimedia.org/wiki/Category:Incubator:All_test_wikis` (use API:Categorymembers), filter items whose page title starts with `Wp`, create array of object `incubators_wp = []` with language code (2nd part of the pagetitle `Wp/fra` -> code: "fra"), and number of pages in tat category.
  - From the code and languages-on-wd.json , augment `incubator_wp` with languages data (qid, label, optional: nativeLabel, population) to this array of object.
  - Display the list of incubators in a table with columns for language code, label, native label, and number of pages. Sort by number of pages descending. Add a filter field for language code and label. Add a link to the incubator page on Wikimedia Incubator for each row. Add a link to the IncubatorLexicons.vue for that language.
Use src/modules/supports/components/LocalisatorMap.vue to localize those languages on a globe.

### Create data cleaner
Create a client-side ES module (corpus2frequency.js) and Web Worker workflow to perform word frequency counting on ~2,000 Wikitext pages without freezing the browser UI.

Requirements:
- Wikitext & Text Cleaning: (1) Use wtf_wikipedia to strip Wikitext markup to plain text ; (2) Remove remaining punctuation, numbers, HTML tags, non-alphanumeric characters, and single-letter words.
- Frequency Counting: Split cleaned text by whitespace and return: [{ expression: "word", occurences: 5 }]
- Merging: Provide a mergeFrequencies(...arrays) helper to combine multiple frequency arrays by summing matching expressions.
- Performance Architecture: Demonstrate non-blocking execution using Web Workers with batch processing (e.g., 100 pages/chunk) and live progress reporting.

Deliverables in modules/incubators/js/:
- corpus2frequency.js (parser + count/merge logic)
- worker.js (background worker using wtf_wikipedia and batch processing)
- main.js (worker initialization, progress logging, and final results handling)

### Create component IncubatorLexiconsView.vue
- Title: Lexicon of your incubator
- Given a language code, fetch the list of pages in that incubator from `https://incubator.wikimedia.org/wiki/Special:AllPages/Wp/<code>`, creation date, page size, sort by article length descending.

### Create component CorpusList.vue & ExistingLists.vue for IncubatorLexiconsView.vue
- Create CorpusList.vue component to display sorted word list with options
- Create iteration logic : Iterate over the list of pages, fetch raw text, process with corpus2frequency.js, addition them all.
- Build the UI, the list of expressions has the following options:
  - display: inline using cdxIconViewCompact, else: by line using cdxIconVerticalEllipsis.
  - separator: use `#` as title then return `# ${expression}` for the items, else: use `, ` and return `{expression}, `
  - sort order: descending using cdxIconDownTriangle (else: ascending using cdxIconUpTriangle)
  - sorted by: occurences using `#` (else expression using cdxIconLanguage).
  - quantity: 50, else: 100, else: 200, else: 500, else: 1000, else: all.
  - show occurences: using cdxIconEyeOn, else: hide using cdxIconEyeOff.
- Create a ExistingLists.vue : using wikimedia Commons API and prefix, list all pagestitles under `https://commons.wikimedia.org/wiki/Commons:Lingua_Libre/List/${code.capitalized()/}`, display page title and number of lines in its raw text. Add a link to the page on Wikimedia Commons for each row. Use cdxIconEdit.
- Create ExclusionList.vue : using wikimedia Commons API, show an edit pen icon and a link to edit `https://commons.wikimedia.org/wiki/Commons:Lingua_Libre/Exclusion_list:${code.capitalized()}`, display page title and current number of lines in its raw text. If number of lines == 0, edit pen icon must blink.
- Include ExistingLists.vue and CorpusList.vue in IncubatorLexicons.vue.

Pen icon :

<template>
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  width="20"
  height="20"
  viewBox="0 0 20 20"
  aria-hidden="true"
>
  <g>
    <path class="pen-eraser" d="m16.77 8 1.94-2a1 1 0 000-1.41l-3.34-3.3a1 1 0 00-1.41 0L12 3.23z"></path>
    <path class="pen-body" d="M1 14.25V19h4.75l9.96-9.96-4.75-4.75z"
    ></path>
  </g>
</svg>

</template>

<style>
.edits-welcome svg .pen-eraser { fill: #333333; }
.edits-welcome svg .pen-body { fill: #333333; }

.edits-needed {
  /* Layout for a perfect circle around the icon */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;

  /* Initial states */
  background-color: transparent;

  /* Link both animations to run infinitely every 600 seconds */
  animation: IconEditEffect 10s infinite;
}
.edits-needed svg .pen-eraser { fill: #c94f60; }
.edits-needed svg .pen-body { fill: #edbe00; }

/* 2. Color transition effect (lasts for 2 seconds out of the 600s loop) */
@keyframes IconEditEffect {
  0%, 60%, 100% {
    background-color: transparent;
    border: 2px solid transparent;
  }
  15%, 45% {
    background-color: #c94f6022;
  }
}
</style>
```

### Integrate "Small Wikipedias"

Objective: add supports for 200+ "Small Wikipedias" under 28,000 articles, to incubator lexicon dashboard ( src/modules/incubators/components/IncubatorsLists.vue ).

Requirements:

- From source https://commons.wikimedia.org/wiki/Data:Wikipedia_statistics/daily.tab , the list of wikipedias by keeping properties `lang` -> `code`, `articles` -> 'pages', `pos` (rank) -> `wp-rank`, `"type":"wikipedia"`.
- Filters items, only keep small wikis with `articles <= 28,000`.
- Use js/languages.js and data/languages-on-wd.json to augment the data with label, nativeLabel, population, qid when available.
- Merge this data with the incubators list ; add `type:"wikipedia"` or `type:"incubator"` to keep the distinction ; sort by number of pages descending.
- In .table, in `Links` column : if type == "wikipedia" change the incubator link and logo for the wikipedia homepage and logo.
- Add a control to filter by type (incubator or wikipedia).
- Rename files accordingly to reflect the new functionality.

ext install anthropic.claude-code

### Academic

The Incubators module fetches textual data from 694 incubators and 233 small Wikipedias to create frequency lists for modest languages, and displays them in a table. The user can click on a link to view the lexicon of each incubator or small Wikipedia. The lexicon is a list of words and their frequencies, which can be used for language revitalization and education efforts.

create an `ethnologStatusColor(<integer>)` function :

- input: integer string between 0 and 9
- returns a green-yellow-red color gradiant following `integer` from "0" to "8". If integer == "9", color = black.

### Git management

Over the past week and whole project, I did not commit along the days. Can you help me :

- commit the different modules and other elements we worked on today, following the fix, feat, doc, convention.
- create a changelog module, a message component.
- write the first monthly message with the form "For users vs Technical"
- Repeat for previous days of the week (no commits) and for previous months (commited)
