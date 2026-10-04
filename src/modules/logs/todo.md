Our project running for past 10 years has had a multiple sponsorships (aka grants, fundings).

Overall i can think about the variables :

- sponsors: see funds/data.js
- grants : see funds/data.js
- projects: see funds/projectsDataExtractor.js

Source texts with those information is : https://meta.wikimedia.org/wiki/Lingua_Libre/Supports 's wikitext, inside the `Lingua Libre/Support infobox` templates.

I want to Using Vuejs, wikimedia Codex and tailwinds, create : a dashboard to see the flow between grants, projects, and freelancers into summary tables and flowchards accross years.

What data json structure should i adopt for easier maintenance and datavisualization ? Is the current data structure in data.js and projectsDataExtractor.js sufficient ?

################

Use Vue.js/C3.js and files in @beautifulMentionto Using Vuejs, wikimedia Codex and tailwinds, create : a funds/Flowchart.vue component .

- Flow 1: Sponsor → Grant (Value: grant.amountEUR)
- Flow 2: Grant → Project (Value: project.budgetEUR)
- Flow 3: Project → Freelancer (Value: payoutEUR)

Each sponsor can fund one or multiple grants.
Each grant can fund one or multiple projects, in same currency.
Each project can have one or multiple freelancers.

Improve @beautifulMention and @beautifulMention as needed to feed a Sankey flowchart.

By default, flows are sorted by project's `starts` date (`YYYY-MM`), the oldest on the top of the chart. For readability, collapse years and months without projects.
On the central y axis, display years and year-tick.

Provide interactive sorting by project start date (default), by sponsor (largest on the top) or by freelancer (largest on the top).

Add route '/dashboard/funds' to
@beautifulMention

### Logs

In components/logs (logs)

- logs/logs-cleaner.js to process the data from upload_errors.log
  : split row into json object with `date` YYYY-MM-DD:HH-MM-SS, `type`=ERROR, `failure-message`, `recording` [number], `filename` (if exist), `code`, `info`, `*`, docref? .... ; return a nested json.

Using Vuejs, wikimedia Codex and tailwinds, create :

- logs/ErrorsUploadsTable.vue table component to view (max visible 500 row, display columns: `date`, `failure-message`, `recording`, `filename`, `code`, `info` ; do not display the other fields), filter (on top row), sort by field, count filtered items (bottom row) the logs, radio button to select a dominant column among : `failure-message`, `code`, `info`.

Using Vuejs, wikimedia Codex and tailwinds, create :

- logs/BarChart.vue for a height:600px, width 150px vertical chart to view the percentage and amount for each variation inside the dominant columns

Using Vuejs, wikimedia Codex and tailwinds, create :

- logs/ErrorLogs.vue to display the logs/ErrorsUploadsTable.vue and logs/BarChart.vue.

Use vue JS.
