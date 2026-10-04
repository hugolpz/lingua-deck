// Background worker: counts word frequencies by chunks of pages, reports progress after each chunk.
// In:  { type: 'start', pages: string[], chunkSize?: number }
// Out: { type: 'progress', done, total } ... then { type: 'done', frequencies }
import { mergeFrequencies, pagesToFrequencies } from './corpus2frequency'

self.onmessage = ({ data }) => {
  if (data.type !== 'start') return
  const { pages, chunkSize = 100 } = data
  let frequencies = []
  for (let i = 0; i < pages.length; i += chunkSize) {
    frequencies = mergeFrequencies(frequencies, pagesToFrequencies(pages.slice(i, i + chunkSize)))
    self.postMessage({ type: 'progress', done: Math.min(i + chunkSize, pages.length), total: pages.length })
  }
  self.postMessage({ type: 'done', frequencies })
}
