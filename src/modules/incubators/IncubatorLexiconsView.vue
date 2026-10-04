<template>
  <div class="page">
    <AppBreadcrumb
      :items="[
        { label: isWikipedia ? 'All Wikipedias' : 'All incubators', to: '/incubators', id: 'breadcrumb-link-incubators' },
        { label: code, to: basePath, mono: true, id: 'breadcrumb-link-incubator' },
      ]"
      :share-url="basePath"
      :share-label="shareLabel"
      :share-title="`Lingua Deck · ${code}`"
    >
      <template v-if="language">{{ language.label }}<template v-if="language.nativeLabel"> ({{ language.nativeLabel }})</template> ·</template>
      <a v-if="isWikipedia" :href="wikipediaPageUrl(code)" target="_blank" rel="noopener">{{ code }}.wikipedia.org</a>
      <a v-else :href="incubatorPageUrl(code)" target="_blank" rel="noopener">Wp/{{ code }} on Incubator</a>
    </AppBreadcrumb>
    <h1 class="mb-1 mt-2">Lexicon of your {{ isWikipedia ? 'Wikipedia' : 'incubator' }}</h1>

    <div v-if="loading" class="alert alert-info">Loading pages…</div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <template v-else>
      <section class="mb-8">
        <h2 class="mb-2">Pages in corpus ({{ pages.length }})</h2>
        <div class="max-h-96 overflow-auto">
          <table class="table">
            <thead>
              <tr><th>Title</th><th class="text-right">Size (bytes)</th><th>Last edit</th></tr>
            </thead>
            <tbody>
              <tr v-for="p in pages" :key="p.title">
                <td>
                  <a :href="pageUrl(p.title)" target="_blank" rel="noopener">
                    {{ isWikipedia ? p.title : p.title.replace(`Wp/${code}/`, '') }}
                  </a>
                </td>
                <td class="text-right">{{ p.length }}</td>
                <td class="whitespace-nowrap">{{ p.touched?.slice(0, 10) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="space-y-8">
        <ExistingLists :code="code" />
        <ExclusionList :code="code" />
        <CorpusList :pages="pages" :code="code" :type="isWikipedia ? 'wikipedia' : 'incubator'" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import CorpusList from './components/CorpusList.vue'
import ExclusionList from './components/ExclusionList.vue'
import ExistingLists from './components/ExistingLists.vue'
import { fetchIncubatorPages, fetchWikipediaPages, incubatorPageUrl, languageForCode, wikipediaPageUrl } from './data/incubators'

const route = useRoute()
const code = computed(() => route.params.code)
const isWikipedia = computed(() => route.meta.type === 'wikipedia')
const shareLabel = computed(() => `Share this ${isWikipedia.value ? 'Wikipedia' : 'incubator'}`)
const basePath = computed(() => `/${isWikipedia.value ? 'wikipedias' : 'incubators'}/${code.value}`)
const pageUrl = (title) =>
  isWikipedia.value
    ? `${wikipediaPageUrl(code.value)}/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`
    : `https://incubator.wikimedia.org/wiki/${encodeURIComponent(title)}`
const language = computed(() => languageForCode(code.value))

const pages = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    pages.value = await (isWikipedia.value ? fetchWikipediaPages : fetchIncubatorPages)(code.value)
    if (!pages.value.length) error.value = isWikipedia.value ? `No articles found on ${code.value}.wikipedia.org` : `No pages found under Wp/${code.value}/`
  } catch (e) {
    error.value = `Could not load pages: ${e.message}`
  } finally {
    loading.value = false
  }
})
</script>
