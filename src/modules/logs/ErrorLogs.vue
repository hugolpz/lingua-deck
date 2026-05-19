<template>
  <div class="flex gap-4 p-4 items-start w-full">
    <!-- Bar Chart -->
    <div class="shrink-0 flex flex-col gap-2">
      <BarChart :data="chartData" :title="dominantColumnTitle" />
    </div>
    
    <!-- Table -->
    <div class="flex-1 w-full overflow-hidden">
      <ErrorsUploadsTable :logs="logsData" :dominant="dominantColumn" @update:dominant="dominantColumn = $event" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ErrorsUploadsTable from './ErrorsUploadsTable.vue'
import BarChart from './BarChart.vue'

// Assume we import the JSON data directly for the demonstration or fetch it
import uploadErrorsData from './upload_errors_cleaned.json'

const logsData = ref([])
const dominantColumn = ref('failure-message')

onMounted(() => {
  // Load data
  logsData.value = uploadErrorsData
})

const dominantColumnTitle = computed(() => {
  if (dominantColumn.value === 'failure-message') return 'Failure Msg'
  if (dominantColumn.value === 'iso_639') return 'ISO'
  if (dominantColumn.value === 'code') return 'Code'
  if (dominantColumn.value === 'info') return 'Info'
  return 'Stats'
})

const chartData = computed(() => {
  const counts = {}
  
  logsData.value.forEach(row => {
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
  
  const formattedData = Object.keys(counts).map(key => ({
    label: key,
    count: counts[key]
  }))
  
  return formattedData
})
</script>
