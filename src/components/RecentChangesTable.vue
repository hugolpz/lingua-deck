<template>
  <div class="edit-history-table">
    <div class="table-header">
      <h3>{{ title }}</h3>
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
            {{ edit.timestamp.slice(0, 10) }}
            <span v-if="edit.count > 1" class="edit-count-badge">{{ edit.count }} edits</span>
          </td>
          <td><a href="#" @click.prevent="$emit('filter-user', edit.author)">{{ edit.author }}</a></td>
          <td class="page-title-cell">
            <a :href="`${edit.url}`" target="_blank" rel="noopener noreferrer" class="wm-site-link" :title="`View on ${sourceName(edit)}`">
              <img v-if="endpoints[edit.source]?.logo" :src="endpoints[edit.source].logo" class="wm-site-logo" :alt="` ${sourceName(edit)} logo`" />
              <AppIcon v-else name="external" :size="16" />
            </a>
            <span>
              <a href="#" @click.prevent="$emit('filter-page', edit.title)">{{ edit.title }}</a>
              {{ edit.comment? ' > '+edit.comment:'' }}
            </span>
          </td>
          <td>
            <a :href="`${edit.url}`" target="_blank" rel="noopener noreferrer" class="diff-link" :class="getDiffClass(edit)" :title="`View on ${sourceName(edit)}`">
              {{ typeof edit.diff === 'number' && edit.diff > 0 ? '+' : '' }}{{ edit.diff ?? '' }}
            </a>
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
import AppIcon from '@/components/AppIcon.vue';

const props = defineProps({
  edits: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    default: 'Recent Edits',
  },
  /** { [edit.source]: { name, logo } }, optional: edits of an unknown source get a generic icon. */
  endpoints: {
    type: Object,
    default: () => ({}),
  },
});

const sourceName = (edit) => props.endpoints[edit.source]?.name || edit.source || 'source';

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
        existing.diff = (existing.diff ?? 0) + edit.diff;
      }
    }
  });

  return grouped;
});

const visibleEdits = computed(() => processedEdits.value.slice(0, limit.value));

const loadMore = () => {
  limit.value += 50;
};

// Numeric diffs are byte changes; anything else (commit hash, task id) has no direction
const getDiffClass = (edit) => {
  if (typeof edit.diff === 'number') {
    if (edit.diff > 0) return 'positive';
    if (edit.diff < 0) return 'negative';
  }
  return 'commit-diff';
};
</script>

<style scoped>
.edit-history-table {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--color-border);
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
  background-color: var(--color-surface-muted);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}
.toggle-group button {
  border: none;
  background: none;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--color-text);
}
.toggle-group button.active {
  background-color: var(--color-progressive);
  color: white;
  font-weight: 600;
}
.edit-count-badge {
  display: inline-block;
  font-size: 0.75rem;
  background: var(--color-surface-muted);
  color: var(--color-text);
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
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}
th {
  background-color: var(--color-surface-muted);
  font-weight: 600;
}
.col-date {
  width: 12rem;
}
.positive { color: green; }
.negative { color: red; }
.commit-diff { color: var(--color-text-secondary); }
.diff-link { text-decoration: none; }
.diff-link:hover { text-decoration: underline; }
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
  width: 22px;
  height: 22px;
  object-fit: contain;
  filter: grayscale(50%) opacity(0.5);
  transition: filter 0.4s ease-in-out;
}
.wm-site-link:hover .wm-site-logo {
  filter: grayscale(0%) opacity(1);
}

.load-more-btn {
  padding: 0.5rem 1rem;
  cursor: pointer;
  background-color: var(--color-progressive);
  color: white;
  border: none;
  border-radius: 4px;
}
.load-more-btn:hover {
  background-color: var(--color-progressive-hover);
}
/* Dark mode simple support */

</style>
