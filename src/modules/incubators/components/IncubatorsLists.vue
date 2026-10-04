<template>
  <section>
    <div class="flex justify-end mb-2">
      <a href="#" @click.prevent="downloadJson" class="flex items-center gap-1 btn btn-sm" title="Download table as JSON" aria-label="Download table as JSON">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download JSON
      </a>
    </div>
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Label</th>
            <th>Native label</th>
            <th class="text-right">Pages</th>
            <th>Type</th>
            <th>Links</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in incubators" :key="i.code">
            <td class="font-mono">
              {{ i.code }}<sup v-if="coordinatesReady && i.qid && !i.lat && !i.lon" class="missing-coordinate">
                <a
                  :href="`https://www.wikidata.org/wiki/${i.qid}#P625`"
                  target="_blank"
                  rel="noopener"
                  :title="`Add geocoordinate (P625) to ${i.qid} on Wikidata`"
                  :aria-label="`Add a geocoordinate (P625) to ${i.qid} on Wikidata`"
                >*</a>
              </sup>
            </td>
            <td>{{ i.label || '—' }}</td>
            <td>{{ i.nativeLabel }}</td>
            <td class="text-right">{{ i.pages }}</td>
            <td class="font-mono text-sm">{{ i.type }}</td>
            <td class="column-links">
              <div class="flex items-center gap-3 whitespace-nowrap">
                <a :href="i.type === 'wikipedia' ? wikipediaPageUrl(i.code) : incubatorPageUrl(i.code)" target="_blank" rel="noopener" class="flex" :title="i.type === 'wikipedia' ? `${i.code}.wikipedia.org` : `Wp/${i.code} on Wikimedia Incubator`" :aria-label="i.type === 'wikipedia' ? `${i.code}.wikipedia.org` : `Wp/${i.code} on Wikimedia Incubator`">
                  <img :src="i.type === 'wikipedia' ? wikipediaLogo : incubatorLogo" alt="" width="20" height="20" />
                </a>
                <a v-if="i.qid" :href="`https://www.wikidata.org/wiki/${i.qid}#P625`" target="_blank" rel="noopener" class="flex" :title="`${i.qid} on Wikidata`" :aria-label="`${i.qid} on Wikidata`">
                  <img :src="wikidataLogo" alt="" width="20" height="20" />
                </a>
                <router-link :to="i.type === 'wikipedia' ? `/wikipedias/${i.code}` : `/incubators/${i.code}`">Lexicon</router-link>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import incubatorLogo from '@/assets/Incubator-logo.svg'
import wikipediaLogo from '@/assets/Wikipedia-logo-v2.svg'
import wikidataLogo from '@/assets/Wikidata_Favicon_color.svg'
import { incubatorPageUrl, wikipediaPageUrl } from '../data/incubators'

const props = defineProps({
  incubators: { type: Array, required: true }, // already filtered
  coordinatesReady: { type: Boolean, default: false },
})

const downloadJson = () => {
  const data = JSON.stringify(props.incubators, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'wikipedia-incubators-list.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.missing-coordinate {
  color: var(--color-destructive);
  font-size: 0.85em;
}

.missing-coordinate a {
  color: inherit;
}
</style>
