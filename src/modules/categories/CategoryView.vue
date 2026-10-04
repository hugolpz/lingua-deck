<template>
  <div class="page">
    <AppBreadcrumb
      :items="[{ label: 'Categories', to: '/categories' }, { label: label, mono: true }]"
      :share-title="`Lingua Deck · ${label}`"
    >
      <a :href="categoryUrl" target="_blank" rel="noopener">{{ categoryTitle }} on Commons</a>
    </AppBreadcrumb>
    <h1 class="mb-4 mt-2">{{ label }}</h1>

    <div v-if="loading" class="alert alert-info">
      <template v-if="fileCount && !tooLarge">
        Fetching files: {{ loaded.toLocaleString() }} / {{ fileCount.toLocaleString() }}
        <progress class="mt-2 block w-full" :value="loaded" :max="fileCount"></progress>
      </template>
      <template v-else>Loading category…</template>
    </div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <template v-else-if="tooLarge">
      <div class="kpi-cards mb-4"><KpiMetricCard title="Files" :value="fileCount" /></div>
      <div class="alert alert-info">
        This category has over {{ MAX_CATEGORY_FILES.toLocaleString() }} recordings, far too many for your browser to roll on at once!
        Try a language or single recordist with fewer than {{ MAX_CATEGORY_FILES.toLocaleString() }} files instead.
      </div>
    </template>

    <template v-else>
      <CategoryKpiMetricCards :edits="edits" />
      <CategoryActivityLinegraph :edits="edits" class="mb-8" />
      <div class="mb-8 grid gap-4 md:grid-cols-3">
        <TopList :data="edits" title="Top authors" group-key="author" sub-group-key="author" count-label="files" :page-size="20" link-base-url="https://commons.wikimedia.org/wiki/User:" :link-logo="commonsLogo" />
        <TopList :data="edits" title="Top locutors" group-key="locutor" sub-group-key="locutor" count-label="files" :page-size="20" />
        <TopList :data="edits" title="Top expressions" group-key="expression" sub-group-key="locutor" count-label="files" :page-size="20" />
      </div>
      <RecentChangesTable :edits="edits.slice(0, 50)" :endpoints="{ commons: { name: 'Wikimedia Commons', logo: commonsLogo } }" title="Recent uploads" class="mb-8" />
      <CategoryLexicon :edits="edits" :slug="slug" class="mb-8" />
      <CategoryRequestedList v-if="isoCode" :iso-code="isoCode" />
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import KpiMetricCard from '@/components/KpiMetricCard.vue'
import TopList from '@/components/TopList.vue'
import RecentChangesTable from '@/components/RecentChangesTable.vue'
import commonsLogo from '@/assets/Commons-logo.svg'
import languages from '@/data/languages-on-wd.json'
import CategoryKpiMetricCards from './components/CategoryKpiMetricCards.vue'
import CategoryActivityLinegraph from './components/CategoryActivityLinegraph.vue'
import CategoryLexicon from './components/CategoryLexicon.vue'
import CategoryRequestedList from './components/CategoryRequestedList.vue'
import {
  MAX_CATEGORY_FILES,
  extractIdAndTypeFromTitle,
  fetchCategoryFileCount,
  fetchCategorymembers,
} from './data/commons-categories'

const route = useRoute()
const slug = computed(() => route.params.title)
const categoryTitle = computed(() => `Category:${slug.value.replace(/_/g, ' ')}`)
const categoryUrl = computed(() => `https://commons.wikimedia.org/wiki/${encodeURI(categoryTitle.value.replace(/ /g, '_'))}`)
const info = computed(() => extractIdAndTypeFromTitle(categoryTitle.value))
const label = computed(() => info.value.code ?? slug.value.replace(/_/g, ' '))

// The requested list is keyed by ISO 639-3 code; users have none
const isoCode = computed(() => {
  const { code, type } = info.value
  if (type === 'iso') return code
  if (type === 'qid') return languages.find((l) => l.value === code)?.iso639_3 ?? ''
  return ''
})

const edits = ref([])
const fileCount = ref(0)
const loaded = ref(0)
const tooLarge = ref(false)
const loading = ref(true)
const error = ref(null)

const load = async () => {
  loading.value = true
  error.value = null
  tooLarge.value = false
  loaded.value = 0
  edits.value = []
  try {
    fileCount.value = await fetchCategoryFileCount(categoryTitle.value)
    if (fileCount.value >= MAX_CATEGORY_FILES) tooLarge.value = true
    else edits.value = await fetchCategorymembers(categoryTitle.value, (n) => (loaded.value = n))
  } catch (e) {
    error.value = `Could not load category: ${e.message}`
  } finally {
    loading.value = false
  }
}
watch(slug, load, { immediate: true })
</script>

<style scoped>
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
</style>
