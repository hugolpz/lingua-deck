<template>
  <div class="top-list">
    <h3>{{ title }}</h3>
    <ul>
      <li v-for="(data, itemKey) in paginatedItems" :key="itemKey" :class="['list-item', `item-${itemKey}`]">
        <div class="item-info">
          <span class="item-name" @click="$emit('filter-item', itemKey)">{{ itemKey }}</span>
        </div>
        <div v-if="linkBaseUrl">
            <a :href="`${linkBaseUrl}${encodeURIComponent(itemKey)}`" target="_blank" rel="noopener noreferrer" class="external-link" :title="`View ${itemKey}`">
                <img src="../../assets/Commons-logo.svg" class="site-logo" alt="Site logo" />
            </a>
        </div>
        <div class="bar-container">
          <div 
            v-for="(count, subGroup) in data.subCounts" 
            :key="subGroup"
            class="bar-segment" 
            :style="{ width: ((count / maxCount) * 100) + '%', backgroundColor: getSubGroupColor(subGroup) }"
            :title="`${getSubGroupName(subGroup)}: ${count} ${countLabel}`"
          ></div>
        </div>
        <span class="count">{{ data.total }} {{ countLabel }}</span>
      </li>
    </ul>
    <div class="pagination" v-if="totalPages > 1">
      <button @click="prevPage" :disabled="currentPage === 1">&laquo; Prev</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">Next &raquo;</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getSharedColor } from '../data/projectSatellitePlatforms.js';

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    default: 'Top Items'
  },
  pageSize: {
    type: Number,
    default: 20
  },
  groupKey: {
    type: String,
    default: 'author', // The field to group by (e.g., author)
  },
  subGroupKey: {
    type: String,
    default: 'ns', // The field for the stacked bar segments (e.g., ns)
  },
  countLabel: {
    type: String,
    default: 'items'
  },
  linkBaseUrl: {
    type: String,
    default: '' // e.g., 'https://commons.wikimedia.org/wiki/User:'
  },
  subGroupMapping: {
    type: [Object, Function],
    default: () => ({}) // Optional mapping for subGroup labels/colors
  },
  sortBy: {
    type: String,
    default: 'count', // 'count' or 'key'
  },
  sortDirection: {
    type: String,
    default: 'desc', // 'asc' or 'desc'
  }
});

defineEmits(['filter-item']);

const currentPage = ref(1);

const allItemsSorted = computed(() => {
  const items = {};
  props.data.forEach((e) => {
    const primary = e[props.groupKey] || 'Unknown';
    if (!items[primary]) {
      items[primary] = { total: 0, subCounts: {} };
    }
    items[primary].total += 1;
    
    const sub = e[props.subGroupKey] !== undefined ? String(e[props.subGroupKey]) : 'unknown';
    items[primary].subCounts[sub] = (items[primary].subCounts[sub] || 0) + 1;
  });
  
  return Object.entries(items).sort(([keyA, valA], [keyB, valB]) => {
    if (props.sortBy === 'key') {
      const cmp = String(keyA).localeCompare(String(keyB));
      return props.sortDirection === 'asc' ? cmp : -cmp;
    } else {
      const cmp = valA.total - valB.total;
      return props.sortDirection === 'asc' ? cmp : -cmp;
    }
  });
});

const totalPages = computed(() => Math.ceil(allItemsSorted.value.length / props.pageSize));

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize;
  const end = start + props.pageSize;
  return Object.fromEntries(allItemsSorted.value.slice(start, end));
});

const maxCount = computed(() => {
  if (allItemsSorted.value.length === 0) return 1;
  return Math.max(...allItemsSorted.value.map(item => item[1].total));
});

const getSubGroupName = (key) => {
  if (typeof props.subGroupMapping === 'function') {
    return props.subGroupMapping(key)?.name || key;
  }
  return props.subGroupMapping[key]?.name || `${props.subGroupKey} ${key}`;
};

const getSubGroupColor = (key) => {
  if (typeof props.subGroupMapping === 'function') {
    return props.subGroupMapping(key)?.color || getSharedColor(key);
  }
  return props.subGroupMapping[key]?.color || getSharedColor(key);
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};
</script>

<style scoped>
.top-list {
  margin-bottom: 2rem;
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.list-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}
.item-info {
  flex: 0 0 150px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
}
.external-link {
  display: inline-flex;
  align-items: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.site-logo {
  width: 16px;
  height: 16px;
  object-fit: contain;
  filter: grayscale(100%) opacity(0.5);
  transition: filter 0.4s ease-in-out;
}
.external-link:hover .site-logo {
  filter: grayscale(0%) opacity(1);
}
.item-name {
  cursor: pointer;
  color: #0056b3;
  text-decoration: underline;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bar-container {
  flex: 1;
  background-color: #e9ecef;
  height: 12px;
  border-radius: 6px;
  margin: 0 1rem;
  overflow: hidden;
  display: flex;
}
.bar-segment {
  height: 100%;
  cursor: help;
  transition: opacity 0.2s;
}
.bar-segment:hover {
  opacity: 0.8;
}
.count {
  white-space: nowrap;
  font-size: 0.85rem;
  color: #6c757d;
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
  gap: 1rem;
}
.pagination button {
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
}
.pagination button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.pagination span {
  font-size: 0.9rem;
  color: #6c757d;
}
/* Dark mode simple support */
@media (prefers-color-scheme: dark) {
  .top-list {
    background-color: #2d2d2d;
  }
  .item-name {
    color: #66b0ff;
  }
}
</style>