<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-3">
      <label class="cursor-pointer rounded border border-line bg-surface px-3 py-1 text-sm font-medium hover:bg-surface-muted">
        Upload <code>upload_errors.log</code>
        <input type="file" accept=".log,.txt,text/plain" class="sr-only" :disabled="state === 'loading'" @change="onFile" />
      </label>
      <span v-if="state === 'loading'" class="tag">Loading…</span>
      <span v-else-if="state === 'success'" class="tag">Success</span>
      <button v-if="hasStored" type="button" class="text-sm text-progressive hover:underline" @click="onClear">Clear stored logs</button>
    </div>
    <p v-if="message" class="m-0 text-sm" :class="state === 'error' ? 'text-destructive' : 'text-secondary'">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { processLogText } from '../data/logs-parser.js'
import { loadStoredLogs, saveLogs, clearLogs } from '../data/logsStore.js'

const emit = defineEmits(['loaded', 'cleared'])

const state = ref('idle') // idle | loading | success | error
const message = ref('')
const hasStored = ref(false)

onMounted(async () => {
  hasStored.value = !!(await loadStoredLogs()).length
})

// Let the browser paint the "Loading…" badge before the synchronous parse blocks the thread
const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)))

async function onFile(event) {
  const input = event.target
  const file = input.files?.[0]
  if (!file) return
  state.value = 'loading'
  message.value = ''
  try {
    const uploaded = await file.text()
    await nextPaint()
    // Each upload replaces the previously stored logs
    const rows = processLogText(uploaded)
    if (!rows.length) throw new Error('No upload error line recognised in this file.')
    const saved = await saveLogs(rows)
    hasStored.value = saved
    state.value = 'success'
    message.value = `${rows.length} records.${saved ? '' : ' Could not be saved in this browser: they will be lost on reload.'}`
    emit('loaded', rows)
  } catch (e) {
    state.value = 'error'
    message.value = `Could not process this file: ${e.message}`
  } finally {
    input.value = ''
  }
}

async function onClear() {
  await clearLogs()
  hasStored.value = false
  state.value = 'idle'
  message.value = 'Stored logs removed.'
  emit('cleared')
}
</script>
