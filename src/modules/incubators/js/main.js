// Main-thread side: runs the frequency worker without blocking the UI.
export const CHUNK_SIZE = 100

/**
 * @param {string[]} wikitexts raw Wikitext of each page
 * @param {{ onProgress?: (done:number, total:number) => void, chunkSize?: number }} [options]
 * @returns {{ promise: Promise<{expression:string, occurences:number}[]>, cancel: () => void }}
 */
export function computeFrequencies(wikitexts, { onProgress, chunkSize = CHUNK_SIZE } = {}) {
  const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
  const promise = new Promise((resolve, reject) => {
    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') {
        onProgress?.(data.done, data.total)
      } else if (data.type === 'done') {
        worker.terminate()
        resolve(data.frequencies)
      }
    }
    worker.onerror = (e) => {
      worker.terminate()
      reject(new Error(e.message || 'Worker failed'))
    }
    worker.postMessage({ type: 'start', pages: wikitexts, chunkSize })
  })
  return { promise, cancel: () => worker.terminate() }
}
