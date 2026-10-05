import { openDB } from 'idb'

const DB_NAME = 'lingualibre-dashboard'
const STORE = 'cache'
const OPEN_TIMEOUT = 3000

let dbPromise = null

const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('IndexedDB open timed out')), OPEN_TIMEOUT)),
  ])

async function open(version) {
  const db = await openDB(DB_NAME, version, {
    upgrade: (d) => {
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE)
    },
    // Another tab wants to upgrade/delete the database: let go so it is not blocked.
    blocking() {
      dbPromise = null
      this.close?.()
    },
    terminated() {
      dbPromise = null
    },
  })
  if (db.objectStoreNames.contains(STORE)) return db
  // Database exists without the store (e.g. partially cleared): bump the version to recreate it.
  const next = db.version + 1
  db.close()
  return open(next)
}

/** Shared connection to the app's IndexedDB cache, or null when unavailable. Never throws. */
export function getCacheDb() {
  if (!dbPromise) {
    dbPromise = withTimeout(open())
      .then((db) => db)
      .catch((e) => {
        console.warn('IndexedDB cache unavailable', e)
        dbPromise = null
        return null
      })
  }
  return dbPromise
}

/** Read a cached value, `undefined` when missing or when the cache is unavailable. */
export async function cacheGet(key) {
  try {
    return await (await getCacheDb())?.get(STORE, key)
  } catch (e) {
    console.warn('Cache read failed', e)
    return undefined
  }
}

/** Write a cached value. Returns false when it could not be stored (unavailable, quota...). */
export async function cachePut(key, value) {
  try {
    const db = await getCacheDb()
    if (!db) return false
    await db.put(STORE, value, key)
    return true
  } catch (e) {
    console.warn('Could not save to IndexedDB, it might be too large.', e)
    return false
  }
}

export async function cacheDelete(key) {
  try {
    await (await getCacheDb())?.delete(STORE, key)
  } catch (e) {
    console.warn('Cache delete failed', e)
  }
}
