<template>
  <section>
    <h2 class="mb-2">Lexicon</h2>
    <p class="mb-4 text-sm text-secondary">Expressions recorded in this category, each linking to its file on Wikimedia Commons.</p>
    <WordListResults :words="words" :has-occurences="false" :filename="`lingua-libre-lexicon-${slug}.json`" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import WordListResults from '@/components/WordListResults.vue'

const props = defineProps({
  edits: { type: Array, required: true }, // from fetchCategorymembers()
  slug: { type: String, required: true },
})

// One row per expression, linking to its first recording
const words = computed(() => {
  const seen = new Map()
  for (const e of props.edits) if (!seen.has(e.expression)) seen.set(e.expression, { expression: e.expression, url: e.url })
  return [...seen.values()]
})
</script>
