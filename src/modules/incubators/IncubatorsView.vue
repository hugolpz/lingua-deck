<template>
  <div class="page">
    <div id="incubator-header" class="mb-4 flow-root">
    <!-- Floats right on top of the page: text wraps around it instead of being pushed down -->
      <div v-if="!loading && !error && coordinates.length" class="mx-auto mb-4 w-fit sm:float-right sm:mb-2 sm:ml-4 sm:mr-0">
        <LocalisatorMap :data="coordinates" title="Incubator and small Wikipedia languages" :width="270" legend />
      </div>
      <h1 class="mb-2">Wikipedia incubators and small Wikipedias</h1>
      <p class="prose mb-6 text-secondary">
        Wikimedia Incubators are "baby Wikipedias", there are 700+ of them, and small Wikipedias under 28,000 articles. Together they are a great opportunity to build word-frequency corpus for rare and minority languages. Frequency lists are powerful tools to guide language revitalisation and language education efforts.
      </p>

      <h2 class="mb-2">List of Wikipedia incubators and small Wikipedias</h2>
      <div v-if="loading" class="alert alert-info">Loading…</div>
      <div v-else-if="error" class="alert alert-error">{{ error }}</div>
      <template v-else>
        <!-- Flex row: narrows beside the floating globe instead of dropping below it -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <input v-model="query" type="search" class="field !w-auto min-w-0 max-w-md flex-1 basis-56" placeholder="Filter by language code or label" aria-label="Filter languages" />
          <select v-model="typeFilter" class="field !w-auto" aria-label="Filter by type">
            <option value="">All types</option>
            <option value="incubator">Incubators only</option>
            <option value="wikipedia">Small Wikipedias only</option>
          </select>
          <p class="text-sm text-secondary">{{ filtered.length }} of {{ allItems.length }} items</p>
        </div>
      </template>
    </div>

    <IncubatorsLists v-if="!loading && !error" :incubators="filtered" :coordinates-ready="coordinatesReady" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import LocalisatorMap from '@/components/LocalisatorMap.vue'
import IncubatorsLists from './components/IncubatorsLists.vue'
import { fetchIncubatorsWpList, fetchSmallWikipedias, fetchLanguagesDataSPARQL } from './data/incubators'

const allItems = ref([])
const coordinatesReady = ref(false)
const loading = ref(true)
const error = ref(null)
const query = ref('')
const typeFilter = ref('')

const filtered = computed(() => {
  let result = allItems.value
  const q = query.value.trim().toLowerCase()
  if (q) {
    result = result.filter(
      (i) => i.code.toLowerCase().includes(q) || i.label.toLowerCase().includes(q) || i.nativeLabel.toLowerCase().includes(q),
    )
  }
  if (typeFilter.value) {
    result = result.filter((i) => i.type === typeFilter.value)
  }
  return result
})

// Globe markers follow the filter - extracted from enhanced items
const coordinates = computed(() =>
  filtered.value
    .map((i) => ({
      lat: i.lat,
      lon: i.lon,
      color: i.color,
      label: i.label || i.code,
    }))
    .filter((c) => c.lat !== undefined && c.lon !== undefined),
)

onMounted(async () => {
  try {
    const [incubators, wikipedias] = await Promise.all([
      fetchIncubatorsWpList(),
      fetchSmallWikipedias(),
    ])
    // A code that already has a Wikipedia is no longer an incubator
    const wikipediaCodes = new Set(wikipedias.map((w) => w.code))
    const remaining = incubators.filter((i) => !wikipediaCodes.has(i.code))
    allItems.value = [...remaining, ...wikipedias].sort((a, b) => b.pages - a.pages)
  } catch (e) {
    error.value = `Could not load data: ${e.message}`
    return
  } finally {
    loading.value = false
  }
  // Enhance items with SPARQL data (coordinates, status, color)
  try {
    const qids = [...new Set(allItems.value.map((i) => i.qid).filter(Boolean))]
    const sparqlData = await fetchLanguagesDataSPARQL(qids)
    // Merge SPARQL data into each item
    for (const item of allItems.value) {
      if (item.qid && sparqlData[item.qid]) {
        Object.assign(item, sparqlData[item.qid])
      }
    }
  } catch (e) {
    console.warn('Could not load SPARQL data', e)
  } finally {
    coordinatesReady.value = true
  }
})
</script>
