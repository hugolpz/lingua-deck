<template>
  <div class="kpi-cards">
    <KpiMetricCard title="Total Edits" :value="edits.length" />
    <KpiMetricCard title="Content Contributors" :value="uniqueContributors" />
    <KpiMetricCard v-if="activeSource === 'all' || activeSource === 'commons' || activeSource === 'meta'" title="Wikipages" :value="uniquePages" />
    <KpiMetricCard v-if="activeSource === 'all' || activeSource === 'gitlab' || activeSource === 'github'" title="Repositories" :value="uniqueRepos" />
    <KpiMetricCard v-if="activeSource === 'all' || activeSource === 'phabricator'" title="Tasks" :value="uniqueTasks" />
    <KpiMetricCard
      v-show="false"
      title="Net Volume"
      :value="`${netVolume > 0 ? '+' : ''}${netVolume < 10000 ? netVolume + '  bytes' : Math.round(netVolume / 1000) + ' kB'}`"
      :value-class="{ positive: netVolume > 0, negative: netVolume < 0 }"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import KpiMetricCard from '@/components/KpiMetricCard.vue';

const props = defineProps({
  edits: {
    type: Array,
    required: true,
  },
  activeSource: {
    type: String,
    required: true,
  }
});

const uniqueContributors = computed(() => {
  const users = new Set(props.edits.map((e) => e.author));
  return users.size;
});

const uniquePages = computed(() => {
  const pages = new Set(props.edits.filter(e => e.source === 'commons' || e.source === 'meta').map(e => e.title));
  return pages.size;
});

const uniqueRepos = computed(() => {
  const repos = new Set(props.edits.filter(e => e.source === 'github' || e.source === 'gitlab').map(e => e.title));
  return repos.size;
});

const uniqueTasks = computed(() => {
  const tasks = new Set(props.edits.filter(e => e.source === 'phabricator').map(e => e.task || e.title));
  return tasks.size;
});

const netVolume = computed(() => {
  // only calculate net volume for wiki edits where diff data is available
  const wikiEdits = props.edits.filter(e => (e.source === 'commons' || e.source === 'meta') && e.diff);
  return wikiEdits.reduce((acc, curr) => acc + (curr.diff || 0), 0);
});
</script>

<style scoped>
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
</style>
