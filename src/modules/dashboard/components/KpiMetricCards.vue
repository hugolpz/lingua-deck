<template>
  <div class="kpi-cards">
    <div class="card">
      <h3>Total Edits</h3>
      <div class="value">{{ edits.length.toLocaleString() }}</div>
    </div>
    <div class="card">
      <h3>Content Contributors</h3>
      <div class="value">{{ uniqueContributors.toLocaleString() }}</div>
    </div>
    <div class="card">
      <h3>Pages Tracked</h3>
      <div class="value">{{ uniquePages.toLocaleString() }}</div>
    </div>
    <div class="card" style="display:none;">
      <h3>Net Volume</h3>
      <div class="value" :class="{ positive: netVolume > 0, negative: netVolume < 0 }">
        {{ netVolume > 0 ? '+' : '' }}{{ netVolume.toLocaleString() }} bytes
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  edits: {
    type: Array,
    required: true,
  },
});

const uniqueContributors = computed(() => {
  const users = new Set(props.edits.map((e) => e.author));
  return users.size;
});

const uniquePages = computed(() => {
  const pages = new Set(props.edits.map((e) => e.title));
  return pages.size;
});

const netVolume = computed(() => {
  return props.edits.reduce((acc, curr) => acc + (curr.diff || 0), 0);
});
</script>

<style scoped>
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
.card {
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  text-align: center;
}
.card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #6c757d;
}
.value {
  font-size: 1.75rem;
  font-weight: bold;
}
.positive {
  color: #28a745;
}
.negative {
  color: #dc3545;
}
/* Dark mode simple support */
@media (prefers-color-scheme: dark) {
  .card {
    background-color: #2d2d2d;
    color: #e0e0e0;
  }
}
</style>
