<template>
  <div class="edit-history-table">
    <div class="table-header">
      <h3>Recent Edits</h3>
      <div class="toggle-group">
        <button :class="{ active: isSummarized }" @click="isSummarized = true; limit = 50">Summarized</button>
        <button :class="{ active: !isSummarized }" @click="isSummarized = false; limit = 50">Detailed</button>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th class="col-date">Date</th>
          <th>Contributor</th>
          <th>Title</th>
          <th>Changes</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="edit in visibleEdits" :key="edit.timestamp + edit.title + edit.author + (edit.revid || Math.random())">
          <td>
            {{ edit.timestamp.split('T')[0] }}
            <span v-if="edit.count > 1" class="edit-count-badge">{{ edit.count }} edits</span>
          </td>
          <td><a href="#" @click.prevent="$emit('filter-user', edit.author)">{{ edit.author }}</a></td>
          <td class="page-title-cell">
            <a :href="`${edit.url}`" target="_blank" rel="noopener noreferrer" class="wm-site-link" :title="`View on ${endpoints[edit.source || 'commons'].name}`">
              <img :src="endpoints[edit.source || 'commons'].logo" class="wm-site-logo" alt="Project logo" />
            </a>
            <a href="#" @click.prevent="$emit('filter-page', edit.title)">{{ edit.title }}</a>
          </td>
          <td>
            <span :class="{ 'positive': edit.diff > 0, 'negative': edit.diff < 0 }">
              {{ edit.diff > 0 ? '+' : '' }}{{ edit.diff }}
            </span>
          </td>
        </tr>
        <tr>
          <td colspan="4" class="text-center" v-if="visibleEdits.length < processedEdits.length">
            <button @click="loadMore" class="load-more-btn">Load More...</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  edits: {
    type: Array,
    required: true,
  },
  endpoints: {
    type: Object,
    required: true,
  }
});

defineEmits(['filter-user', 'filter-page']);

const isSummarized = ref(true);
const limit = ref(50);

const processedEdits = computed(() => {
  if (!isSummarized.value) {
    return props.edits.map(e => ({ ...e, count: 1 }));
  }

  const grouped = [];
  const map = new Map();

  props.edits.forEach(edit => {
    const key = edit.group || `${edit.timestamp.split('T')[0].replace(/-/g, '')}_${edit.author}_${edit.title}`;
    
    if (!map.has(key)) {
      const newEntry = { 
        ...edit, 
        timestamp: edit.timestamp.split('T')[0], 
        count: 1, 
        diff: edit.diff
      };
      map.set(key, newEntry);
      grouped.push(newEntry);
    } else {
      const existing = map.get(key);
      existing.count += 1;
      if (typeof edit.diff === 'number') {
        existing.diff += edit.diff;
      }
    }
  });

  return grouped;
});

const visibleEdits = computed(() => processedEdits.value.slice(0, limit.value));

const loadMore = () => {
  limit.value += 50;
};
</script>

<style scoped>
.edit-history-table {
  width: 100%;
  overflow-x: auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  padding: 1rem;
}
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.table-header h3 {
  margin: 0;
}
.toggle-group {
  display: flex;
  background-color: #f1f3f5;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #ddd;
}
.toggle-group button {
  border: none;
  background: none;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: #495057;
}
.toggle-group button.active {
  background-color: #007bff;
  color: white;
  font-weight: 600;
}
.edit-count-badge {
  display: inline-block;
  font-size: 0.75rem;
  background: #e9ecef;
  color: #495057;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  margin-left: 0.5rem;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  text-align: left;
}
th {
  background-color: #f4f6f8;
  font-weight: 600;
}
.col-date {
  width: 12rem;
}
.positive { color: green; }
.negative { color: red; }
.text-center { text-align: center; }

.page-title-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.wm-site-link {
  display: inline-flex;
  align-items: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.wm-site-logo {
  width: 16px;
  height: 16px;
  object-fit: contain;
  filter: grayscale(100%) opacity(0.5);
  transition: filter 0.4s ease-in-out;
}
.wm-site-link:hover .wm-site-logo {
  filter: grayscale(0%) opacity(1);
}

.load-more-btn {
  padding: 0.5rem 1rem;
  cursor: pointer;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
}
.load-more-btn:hover {
  background-color: #0056b3;
}
/* Dark mode simple support */
@media (prefers-color-scheme: dark) {
  .edit-history-table {
    background-color: #2d2d2d;
    border-color: #444;
  }
  .toggle-group {
    background-color: #333;
    border-color: #444;
  }
  .toggle-group button {
    color: #ccc;
  }
  .toggle-group button.active {
    background-color: #0056b3;
    color: white;
  }
  .edit-count-badge {
    background-color: #444;
    color: #ccc;
  }
  th {
    background-color: #3d3d3d;
  }
  td {
    border-color: #444;
  }
}
</style>
