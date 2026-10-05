import { cacheGet, cachePut, cacheDelete } from '@/js/cacheDb.js'

const CLEANED_KEY = 'uploadErrorsCleaned'

// Optional build-time copy, written by `node data/logs-cleaner.js`. Gitignored, so usually absent.
const bundled = import.meta.glob('./upload_errors_cleaned.json')

/** Rows of the last upload, [] when none. */
export async function loadStoredLogs() {
  return (await cacheGet(CLEANED_KEY)) || []
}

/** Cleaned rows: stored upload first, else the bundled developer copy, else []. */
export async function loadCleanedLogs() {
  const stored = await loadStoredLogs()
  if (stored.length) return stored
  const loader = bundled['./upload_errors_cleaned.json']
  return loader ? (await loader()).default : []
}

/** Persist the cleaned rows. Returns false when storage failed. */
export const saveLogs = (rows) => cachePut(CLEANED_KEY, rows)

export async function clearLogs() {
  await cacheDelete(CLEANED_KEY)
}
