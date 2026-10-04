<template>
  <div class="gitlab-cards">
    <!-- Status bar -->
    <div class="status-bar">
      <div class="status-badge" :class="{ 'is-loading': loading }">
        <span class="dot"></span>
        {{ loading ? 'Analyzing repository…' : error ? 'Error' : 'Complete' }}
      </div>
      <span v-if="error" class="error-message">{{ error }}</span>
    </div>

    <!-- Loading progress -->
    <div v-if="loading" class="alert alert-info">
      Fetching files... ({{ progress }} / {{ toProcess }})
    </div>

    <!-- KPI Cards -->
    <div class="kpi-cards">
      <div class="card">
        <h3>Repository</h3>
        <div class="value">{{ repositoryName }}</div>
      </div>
      <div class="card">
        <h3>Coded Lines</h3>
        <div class="value">{{ totalLines.toLocaleString() }}</div>
      </div>
      <div class="card">
        <h3>Matched Files</h3>
        <div class="value">{{ files.length.toLocaleString() }}</div>
      </div>
      <div class="card">
        <h3>Average Lines</h3>
        <div class="value">{{ averageLines.toLocaleString() }}</div>
      </div>
    </div>

    <!-- File details table -->
    <div v-if="files.length > 0" class="files-table-section">
      <h4>Matched Files Breakdown</h4>
      <table class="files-table">
        <thead>
          <tr>
            <th>File</th>
            <th>Lines</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in files" :key="f.path">
            <td class="file-path">{{ f.path }}</td>
            <td class="file-lines">{{ f.lines.toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

type Config = {
  repoUrl: string
  patterns: string[]
  privateToken?: string
}

const props = defineProps<{ config: Config }>()

const loading = ref(false)
const error = ref<string | null>(null)
const files = ref<Array<{ path: string; lines: number }>>([])
const progress = ref(0)
const toProcess = ref(0)

const matchedFilesCount = ref(0)

const totalLines = computed(() => files.value.reduce((a, b) => a + b.lines, 0))

const repositoryName = computed(() => {
  try {
    const u = new URL(props.config.repoUrl)
    return u.pathname.replace("/raw/master/","").split('/').filter(Boolean).pop() || 'Repository'
  } catch {
    return 'Repository'
  }
})

const averageLines = computed(() => files.value.length > 0 ? Math.round(totalLines.value / files.value.length) : 0)

function normalizeRepoInput(url: string) {
  try {
    const u = new URL(url)
    const host = `${u.protocol}//${u.host}`
    const path = u.pathname.replace(/^\//, '')
    // Support both '/-/raw/{branch}/...' and older '/raw/{branch}/...' URL forms
    let rawIdx = path.indexOf('/-/raw/')
    let rawPrefix = '/-/raw/'
    if (rawIdx === -1) {
      rawIdx = path.indexOf('/raw/')
      rawPrefix = '/raw/'
    }
    if (rawIdx !== -1) {
      const projectPath = path.slice(0, rawIdx)
      const branchAndRest = path.slice(rawIdx + rawPrefix.length)
      const parts = branchAndRest.split('/')
      const branch = parts[0] || undefined
      return { host, projectPath, branch }
    }
    const projectPath = path.replace(/\/$/,'')
    return { host, projectPath, branch: undefined }
  } catch (e) {
    throw new Error('Invalid repoUrl')
  }
}

async function fetchJson(url: string, headers: any = {}) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

async function fetchText(url: string, headers: any = {}) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.text()
}

function globToRegExp(glob: string) {
  let s = glob.replace(/([.+^=!:${}()|[\]\\])/g, '\\$1')
  s = s.replace(/\*\*/g, '<<<TWOSTAR>>>')
  s = s.replace(/\*/g, '[^/]*')
  s = s.replace(/\?/g, '.')
  s = s.replace(/<<<TWOSTAR>>>/g, '.*')
  return new RegExp('^' + s + '$')
}

function patternToMatcher(pat: string): (path: string) => boolean {
  const normalizedPattern = pat.replace(/^\.\//, '')
  const idx = pat.indexOf('/^')
  if (idx > 0) {
    const prefix = normalizedPattern.slice(0, idx + 1)
    const regexPart = normalizedPattern.slice(idx + 1)
    const rx = new RegExp(regexPart)
    return (path: string) => {
      const normalizedPrefix = prefix.replace(/\/$/, '')
      if (!path.startsWith(normalizedPrefix)) return false
      const after = path.slice(normalizedPrefix.length + (prefix.endsWith('/') ? 1 : 0))
      return rx.test(after)
    }
  }

  if (normalizedPattern.startsWith('^') || (normalizedPattern.startsWith('/') && normalizedPattern.endsWith('/'))) {
    const inner = normalizedPattern.startsWith('/') ? normalizedPattern.slice(1, -1) : normalizedPattern
    const rx = new RegExp(inner)
    return (path: string) => rx.test(path)
  }

  if (/[\*\?\[]/.test(normalizedPattern)) {
    const rx = globToRegExp(normalizedPattern)
    return (path: string) => rx.test(path)
  }

  return (path: string) => path === normalizedPattern || path.startsWith(normalizedPattern.replace(/\/$/, '') + '/')
}

async function getDefaultBranch(host: string, projectPath: string, headers: any) {
  try {
    const info = await fetchJson(`${host}/api/v4/projects/${encodeURIComponent(projectPath)}`, headers)
    return info.default_branch || 'main'
  } catch (e) {
    return 'main'
  }
}

async function fetchTree(host: string, projectPath: string, branch: string, headers: any) {
  const results: Array<{ path: string; type: string }> = []
  let page = 1
  while (true) {
    const url = `${host}/api/v4/projects/${encodeURIComponent(projectPath)}/repository/tree?recursive=true&per_page=100&page=${page}&ref=${encodeURIComponent(branch)}`
    const res = await fetch(url, { headers })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new Error(`Failed fetching tree: ${res.status} ${res.statusText} ${txt}`)
    }
    const json = await res.json()
    if (!Array.isArray(json) || !json.length) break
    for (const e of json) results.push(e)
    const next = res.headers.get('x-next-page')
    if (!next) break
    page = Number(next)
    if (!page) break
  }
  return results
}

async function fetchTreeWithBranchFallback(host: string, projectPath: string, preferredBranch: string | undefined, headers: any) {
  const tried = new Set<string>()
  const candidates = [preferredBranch, 'main', 'master'].filter((b): b is string => !!b)

  for (const candidate of candidates) {
    if (tried.has(candidate)) continue
    tried.add(candidate)
    try {
      const tree = await fetchTree(host, projectPath, candidate, headers)
      return { tree, branch: candidate }
    } catch (e: any) {
      const message = String(e?.message || e)
      const isNotFound = message.includes('404') || message.includes('Tree Not Found')
      if (!isNotFound) throw e
    }
  }

  throw new Error(`Failed fetching tree for branches: ${Array.from(tried).join(', ')}`)
}

async function fetchFileRawViaApi(host: string, projectPath: string, filePath: string, branch: string, headers: any) {
  const url = `${host}/api/v4/projects/${encodeURIComponent(projectPath)}/repository/files/${encodeURIComponent(filePath)}/raw?ref=${encodeURIComponent(branch)}`
  return fetchText(url, headers)
}

async function fetchFileRawViaWeb(host: string, projectPath: string, filePath: string, branch: string, headers: any) {
  const url = `${host}/${projectPath}/-/raw/${encodeURIComponent(branch)}/${filePath}`
  return fetchText(url, headers)
}

async function run() {
  loading.value = true
  error.value = null
  files.value = []
  progress.value = 0
  toProcess.value = 0
  matchedFilesCount.value = 0

  try {
    const { host, projectPath, branch: branchFromUrl } = normalizeRepoInput(props.config.repoUrl)
    const headers: any = {}
    if (props.config.privateToken) {
      headers['PRIVATE-TOKEN'] = props.config.privateToken
      headers['Authorization'] = `Bearer ${props.config.privateToken}`
    }

    const discoveredDefaultBranch = branchFromUrl ? branchFromUrl : await getDefaultBranch(host, projectPath, headers)
    const { tree, branch } = await fetchTreeWithBranchFallback(host, projectPath, discoveredDefaultBranch, headers)
    const blobs = tree.filter((e: any) => e.type === 'blob')

    const matchers = props.config.patterns.map(patternToMatcher)
    const matched = blobs.filter((b: any) => matchers.some((m) => m(b.path)))
    matchedFilesCount.value = matched.length
    toProcess.value = matched.length

    for (const entry of matched) {
      try {
        let txt: string | null = null
        try {
          txt = await fetchFileRawViaApi(host, projectPath, entry.path, branch, headers)
        } catch (e) {
          txt = await fetchFileRawViaWeb(host, projectPath, entry.path, branch, headers)
        }
        const lines = txt.split(/\r\n|\r|\n/).length
        files.value.push({ path: entry.path, lines })
      } catch (e) {
        files.value.push({ path: entry.path, lines: 0 })
      }
      progress.value += 1
    }

  } catch (e: any) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (props.config.repoUrl && props.config.patterns.length > 0) {
    run()
  }
})
</script>

<style scoped>
.gitlab-cards {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.status-bar {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-success-subtle);
  color: var(--color-success);
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-badge.is-loading {
  background-color: var(--color-warning-subtle);
  color: var(--color-warning-text);
}

.status-badge .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
}

.status-badge.is-loading .dot {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%   { opacity: 0.4; }
  50%  { opacity: 1; }
  100% { opacity: 0.4; }
}

.error-message {
  color: var(--color-destructive);
  font-weight: 500;
}

.progress-bar {
  padding: 0.75rem 1rem;
  background-color: var(--color-progressive-subtle);
  border-left: 4px solid var(--color-progressive);
  border-radius: 4px;
  color: var(--color-progressive);
  font-size: 0.9rem;
}

.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
}

.card {
  padding: 1.5rem;
  background-color: var(--color-surface-muted);
  border-radius: 8px;
  box-shadow: var(--shadow);
  text-align: center;
}

.card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  font-weight: 600;
}

.card .value {
  font-size: 1.75rem;
  font-weight: bold;
  color: var(--color-text);
  word-break: break-word;
}

.files-table-section {
  margin-top: 1rem;
}

.files-table-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: var(--color-text);
}

.files-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.files-table thead {
  background-color: var(--color-surface-muted);
  border-bottom: 2px solid var(--color-border);
}

.files-table th {
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: var(--color-text);
}

.files-table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.file-path {
  color: var(--color-text);
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}

.file-lines {
  text-align: right;
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* Dark mode support */

</style>
