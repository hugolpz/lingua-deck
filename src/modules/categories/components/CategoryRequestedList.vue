<template>
  <section>
    <h2 class="mb-2">Requested expressions</h2>
    <div v-if="loading" class="alert alert-info">Loading…</div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>
    <p v-else-if="!list" class="text-sm text-secondary">No requested list found for this category.</p>
    <template v-else>
      <p class="mb-4 text-sm text-secondary">
        Expressions without audio, from <a :href="pageUrl(list.title)" target="_blank" rel="noopener">{{ list.title.replace('Commons:', '') }}</a>.
      </p>
      <WordListResults
        :words="list.words.map((expression) => ({ expression, url: pageUrl(list.title) }))"
        :has-occurences="false"
        :edit-link-for="() => `${pageUrl(list.title)}?action=edit`"
        :filename="`lingua-libre-requested-${isoCode}.json`"
      />
    </template>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import WordListResults from '@/components/WordListResults.vue'
import { fetchRequestedList } from '../data/commons-categories'

const props = defineProps({
  isoCode: { type: String, required: true },
})

const list = ref(null)
const loading = ref(true)
const error = ref(null)
const pageUrl = (title) => `https://commons.wikimedia.org/wiki/${encodeURI(title)}`

onMounted(async () => {
  try {
    list.value = await fetchRequestedList(props.isoCode)
  } catch (e) {
    error.value = `Could not load the requested list: ${e.message}`
  } finally {
    loading.value = false
  }
})
</script>
