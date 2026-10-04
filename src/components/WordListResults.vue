<template>
  <div>
    <div id="corpus-result-header" class="mb-4 flex flex-wrap items-center gap-2">
      <button id="corpus-display" class="btn btn-icon" :title="inline ? 'Inline' : 'One per line'" :aria-label="inline ? 'Inline' : 'One per line'" @click="inline = !inline">
        <AppIcon :name="inline ? 'view-compact' : 'vertical-ellipsis'" />
      </button>
      <button id="corpus-separator" class="btn btn-icon" :title="useHash ? 'Numbered list (#)' : 'Comma separated'" aria-label="Separator" @click="useHash = !useHash">
        <span aria-hidden="true">{{ useHash ? '#' : ',' }}</span>
      </button>
      <button id="corpus-order" class="btn btn-icon" :title="desc ? 'Descending' : 'Ascending'" :aria-label="desc ? 'Descending' : 'Ascending'" @click="desc = !desc">
        <AppIcon :name="desc ? 'triangle-down' : 'triangle-up'" />
      </button>
      <button v-if="hasOccurences" id="corpus-sort-by" class="btn" :title="byOccurences ? 'Sorted by occurences' : 'Sorted by expression'" aria-label="Sort by" @click="byOccurences = !byOccurences">
        <span aria-hidden="true">{{ byOccurences ? '123' : 'A-Z' }}{{ desc ? '↓' : '↑' }}</span>
      </button>
      <button v-if="hasOccurences" id="corpus-show-occurences" class="btn btn-icon" :title="showOccurences ? 'Showing occurences' : 'Hiding occurences'" :aria-label="showOccurences ? 'Hide occurences' : 'Show occurences'" @click="showOccurences = !showOccurences">
        <AppIcon :name="showOccurences ? 'eye' : 'eye-off'" />
      </button>
      <select id="corpus-quantity" v-model="quantity" class="field !w-auto" aria-label="Quantity">
        <option v-for="q in quantities" :key="q" :value="q">{{ q === 'all' ? 'All' : `${q} per page` }}</option>
      </select>
      <button id="corpus-download" class="btn btn-icon" title="Download as JSON" aria-label="Download as JSON" @click="downloadJson">
        <AppIcon name="download" />
      </button>
      <span class="text-sm text-secondary">{{ rangeText }} of {{ words.length }} unique expressions.<template v-if="excludedCount"> ({{ excludedCount }} excluded)</template></span>
      <span class="ml-auto text-sm text-secondary">{{ statsText }}</span>
    </div>

    <div class="card max-h-[600px] overflow-auto p-4">
      <component :is="inline ? 'p' : 'div'" :class="inline ? 'break-words' : 'font-sans'">
        <span v-for="w in shown" :key="w.expression" :class="inline ? 'mr-1' : 'block'">
          {{ prefix(w) }}<a v-if="w.url" :href="w.url" target="_blank" rel="noopener">{{ w.expression }}</a><template v-else>{{ w.expression }}</template>{{ suffix }}
          <a v-if="editLinkFor" :href="editLinkFor(w)" target="_blank" rel="noopener" class="ml-1 text-secondary" title="Edit" aria-label="Edit"><AppIcon name="pencil" :size="14" /></a>
        </span>
      </component>
    </div>

    <nav v-if="pageCount > 1" id="corpus-pagination" class="mt-4 flex items-center justify-center gap-2" aria-label="Pagination">
      <button class="btn" :disabled="page === 0" aria-label="First page" @click="page = 0">«</button>
      <button class="btn" :disabled="page === 0" aria-label="Previous page" @click="page--">‹</button>
      <span class="text-sm text-secondary">Page {{ page + 1 }} / {{ pageCount }}</span>
      <button class="btn" :disabled="page >= pageCount - 1" aria-label="Next page" @click="page++">›</button>
      <button class="btn" :disabled="page >= pageCount - 1" aria-label="Last page" @click="page = pageCount - 1">»</button>
    </nav>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
  words: { type: Array, required: true }, // [{ expression, occurences?, url? }], exclusions already removed
  /** Name of the downloaded JSON file. */
  filename: { type: String, default: 'lexicon.json' },
  /** False when words carry no counts: hides the sort-by and show-occurences buttons. */
  hasOccurences: { type: Boolean, default: true },
  /** Optional (word) => URL of an edit page, rendered as a pencil icon on each row. */
  editLinkFor: { type: Function, default: null },
  excludedCount: { type: Number, default: 0 },
  statsText: { type: String, default: '' },
})

const quantities = [100, 500, 2000, 5000, 'all']

const inline = ref(false)
const useHash = ref(true)
const desc = ref(true)
const byOccurences = ref(props.hasOccurences)
const quantity = ref(500) // page size
const page = ref(0)
const showOccurences = ref(true)

const sorted = computed(() => {
  const dir = desc.value ? -1 : 1
  return [...props.words].sort((a, b) =>
    byOccurences.value
      ? dir * (a.occurences - b.occurences) || a.expression.localeCompare(b.expression)
      : dir * a.expression.localeCompare(b.expression),
  )
})

const pageCount = computed(() =>
  quantity.value === 'all' ? 1 : Math.max(1, Math.ceil(sorted.value.length / quantity.value)),
)
const shown = computed(() =>
  quantity.value === 'all'
    ? sorted.value
    : sorted.value.slice(page.value * quantity.value, (page.value + 1) * quantity.value),
)
const rangeText = computed(() => {
  if (!shown.value.length) return '0'
  const start = quantity.value === 'all' ? 0 : page.value * quantity.value
  return `${start + 1}–${start + shown.value.length}`
})
// Back to the first page whenever the ordering, page size or words change
watch([quantity, desc, byOccurences, () => props.words], () => (page.value = 0))

// Whole lexicon (most frequent first when counted) as [{ expression, occurence?, url? }]
const downloadJson = () => {
  const data = [...props.words]
    .sort((a, b) => (props.hasOccurences ? b.occurences - a.occurences : 0) || a.expression.localeCompare(b.expression))
    .map((w) => ({
      expression: w.expression,
      ...(props.hasOccurences && { occurence: w.occurences }),
      ...(w.url && { url: w.url }),
    }))
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = props.filename
  a.click()
  URL.revokeObjectURL(url)
}

// `# ` (numbered list) or nothing, with an optional `[occurences] ` before the word; `, ` after the word when comma separated
const prefix = (w) => (useHash.value ? '# ' : '') + (props.hasOccurences && showOccurences.value ? `[${w.occurences}] ` : '')
const suffix = computed(() => (useHash.value ? '' : ','))
</script>
