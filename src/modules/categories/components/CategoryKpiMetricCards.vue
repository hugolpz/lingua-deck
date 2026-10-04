<template>
  <div class="kpi-cards">
    <KpiMetricCard title="Files" :value="edits.length" />
    <KpiMetricCard title="Locutors" :value="count('locutor')" />
    <KpiMetricCard title="Authors" :value="count('author')" />
    <KpiMetricCard title="Expressions" :value="count('expression')" />
  </div>
</template>

<script setup>
import KpiMetricCard from '@/components/KpiMetricCard.vue'

const props = defineProps({
  edits: { type: Array, required: true },
})

const count = (key) => new Set(props.edits.map((e) => e[key])).size
</script>

<style scoped>
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
</style>
