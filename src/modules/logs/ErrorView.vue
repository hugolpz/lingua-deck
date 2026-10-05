<template>
  <div class="page">
    <AppBreadcrumb :items="crumbs" share-title="Lingua Libre · Upload errors" />

    <header class="dashboard-header">
      <p class="subtitle">Upload errors reported by the Lingua Libre recorder, by failure type, language and period.</p>
      <p v-if="latestDate" class="latest" :class="{ stale: isStale }" :title="isStale ? `Older than ${STALE_DAYS} days: fetch a fresh log (see the guide)` : 'Date of the most recent logged error'">
        Logs to: {{ latestDate }}<span v-if="isStale"> ⚠ outdated</span>
      </p>
    </header>

    <div v-if="loading" class="alert alert-info">Loading upload errors…</div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <template v-else>
      <LogsTutorial class="mb-4" :open="!logsData.length" @loaded="logsData = $event" @cleared="logsData = []" />
      <p v-if="!logsData.length" class="alert alert-info">No upload errors loaded yet. Follow the guide above.</p>
    </template>

    <template v-if="!loading && !error && logsData.length">
      <DateRange :data="logsData" @filter="handleDateFilter" />

      <ErrorsKpiMetricCards :logs="tableFilteredLogs ?? filteredLogs" />

      <div class="flex flex-col items-start gap-4 lg:flex-row">
        <div class="flex shrink-0 flex-col gap-2">
          <BarChart :data="chartData" :title="dominantColumnTitle" />
        </div>

        <div class="w-full flex-1 overflow-hidden">
          <ErrorsUploadsTable :logs="filteredLogs" v-model:dominant="dominantColumn" @filter="tableFilteredLogs = $event" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import DateRange from '@/components/DateRange.vue'
import ErrorsKpiMetricCards from './components/ErrorsKpiMetricCards.vue'
import ErrorsUploadsTable from './components/ErrorsUploadsTable.vue'
import BarChart from './components/BarChart.vue'
import LogsTutorial from './components/LogsTutorial.vue'
import { loadCleanedLogs } from './data/logsStore.js'

const crumbs = [{ label: 'App logs', to: '/logs' }]

const loading = ref(true)
const error = ref('')
const logsData = ref([])
const dominantColumn = ref('failure-message')

// null until DateRange has emitted: then the whole dataset is shown
const dateFilteredLogs = ref(null)
const handleDateFilter = (filtered) => {
  dateFilteredLogs.value = filtered
}
const filteredLogs = computed(() => dateFilteredLogs.value ?? logsData.value)

// Rows left after the table's column filters (null until the table has mounted): feeds the KPI cards
const tableFilteredLogs = ref(null)

// Stored upload first, else the optional developer copy (loaded on demand: several MB, kept out of the app bundle)
onMounted(async () => {
  try {
    logsData.value = await loadCleanedLogs()
  } catch (e) {
    error.value = `Could not load the upload errors: ${e.message}`
  } finally {
    loading.value = false
  }
})

// `timestamp` is YYYY-MM-DD, so the lexicographic max is the latest day
const STALE_DAYS = 7
const latestDate = computed(() => logsData.value.reduce((max, row) => (row.timestamp > max ? row.timestamp : max), ''))
const isStale = computed(() => latestDate.value && (Date.now() - new Date(latestDate.value).getTime()) / 86400000 > STALE_DAYS)

const COLUMN_TITLES = {
  'failure-message': 'Failure Msg',
  iso_639: 'ISO',
  code: 'Code',
  info: 'Info',
}
const dominantColumnTitle = computed(() => COLUMN_TITLES[dominantColumn.value] ?? 'Stats')

const chartData = computed(() => {
  const counts = {};

  (tableFilteredLogs.value ?? filteredLogs.value).forEach((row) => {
    let value = ''
    if (dominantColumn.value === 'code') {
      value = row.details?.code || ''
    } else if (dominantColumn.value === 'info') {
      value = row.details?.info || ''
    } else {
      value = row[dominantColumn.value] || ''
    }

    value = String(value).trim() || '(empty)'
    counts[value] = (counts[value] || 0) + 1
  })

  return Object.keys(counts).map((key) => ({ label: key, count: counts[key] }))
})
</script>

<style scoped>
.dashboard-header {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1rem;
}
.subtitle {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
  margin: 0;
}
.latest {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}
.latest.stale {
  color: var(--color-destructive, #d33);
  font-weight: 600;
}
</style>
