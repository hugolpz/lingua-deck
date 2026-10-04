<template>
  <div class="kpi-cards">
    <KpiMetricCard title="Upload errors" :value="logs.length" />
    <KpiMetricCard title="Recordings affected" :value="uniqueRecordings" />
    <KpiMetricCard title="Languages" :value="uniqueLanguages" />
    <KpiMetricCard title="Failure types" :value="uniqueFailures" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import KpiMetricCard from '@/components/KpiMetricCard.vue'

const props = defineProps({
  logs: {
    type: Array,
    required: true,
  },
})

const countUnique = (values) => new Set(values.filter(Boolean)).size

const uniqueRecordings = computed(() => countUnique(props.logs.map((l) => l.recording)))
const uniqueLanguages = computed(() => countUnique(props.logs.map((l) => l.iso_639)))
const uniqueFailures = computed(() => countUnique(props.logs.map((l) => l['failure-message'])))
</script>

<style scoped>
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
</style>
