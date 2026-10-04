<template>
  <section>
    <h2 class="mb-2">Corpus word list</h2>
    <p id="corpus-explainer" class="mb-4 text-sm text-secondary">
      Counts words in the {{ maxPages }} longest pages (wikitext cleaned, single letters dropped).
      <template v-if="statsText">{{ statsText }}</template>
    </p>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <button class="btn btn-primary" :disabled="running" @click="run">
        {{ words.length ? 'Recompute' : 'Build word list' }}
      </button>
      <button v-if="running" class="btn" @click="cancel">Cancel</button>
      <span v-if="running" class="text-sm text-secondary">{{ progress }}</span>
    </div>
    <div v-if="error" class="alert alert-error mb-4">{{ error }}</div>

    <WordListResults
      v-if="words.length"
      :words="kept"
      :filename="`wm-incubator-lexicon-${code}.json`"
      :excluded-count="words.length - kept.length"
      :stats-text="statsText"
    />
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { fetchExclusionList, fetchWikitexts, wikipediaApi } from '../data/incubators'
import { computeFrequencies } from '../js/main'
import WordListResults from '@/components/WordListResults.vue'

const props = defineProps({
  pages: { type: Array, required: true }, // [{ title, length }], longest first
  code: { type: String, required: true },
  type: { type: String, default: 'incubator' }, // 'incubator' | 'wikipedia'
})

const maxPages = 2000

const words = ref([])
const excluded = ref(new Set())
const running = ref(false)
const progress = ref('')
const error = ref(null)
const articleCount = ref(0)

let job = null
let cancelled = false

const run = async () => {
  running.value = true
  cancelled = false
  error.value = null
  try {
    const pageids = props.pages.slice(0, maxPages).map((p) => p.pageid)
    const texts = await fetchWikitexts(
      pageids,
      (done, total) => {
        progress.value = `Fetching pages ${done}/${total}`
      },
      props.type === 'wikipedia' ? wikipediaApi(props.code) : undefined,
    )
    if (cancelled) return
    articleCount.value = texts.length
    job = computeFrequencies(texts, {
      onProgress: (done, total) => (progress.value = `Counting words, page ${done}/${total}`),
    })
    words.value = await job.promise
    try {
      const { words: list } = await fetchExclusionList(props.code)
      excluded.value = new Set(list.map((w) => w.toLowerCase()))
    } catch (e) {
      excluded.value = new Set()
      error.value = `Could not load exclusion list, nothing excluded: ${e.message}`
    }
  } catch (e) {
    if (!cancelled) error.value = e.message
  } finally {
    running.value = false
    job = null
  }
}

const cancel = () => {
  cancelled = true
  job?.cancel()
  running.value = false
}
onBeforeUnmount(cancel)

// Words minus the Commons exclusion list
const kept = computed(() =>
  excluded.value.size ? words.value.filter((w) => !excluded.value.has(w.expression.toLowerCase())) : words.value,
)

// Total words counted = sum of all occurences (one pass over the merged list, cached until it changes)
const totalWords = computed(() => kept.value.reduce((sum, w) => sum + w.occurences, 0))
const statsText = computed(() =>
  words.value.length ? `From the largest ${articleCount.value} articles, ${totalWords.value} expressions.` : '',
)
</script>
