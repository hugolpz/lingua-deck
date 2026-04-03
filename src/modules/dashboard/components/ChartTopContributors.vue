<template>
  <div class="top-contributors">
    <h3>Contributors</h3>
    <ul>
      <li v-for="(data, user) in paginatedUsers" :key="user" :class="['contributor', `contributor-${user}`]">
        <div class="user-info">
          <span class="user" @click="$emit('filter-user', user)">{{ user }}</span>
        </div>
        <div>
            <a :href="`https://commons.wikimedia.org/wiki/User:${encodeURIComponent(user)}`" target="_blank" rel="noopener noreferrer" class="wm-site-link" title="View user on Wikimedia Commons">
                <img src="../../assets/Commons-logo.svg" class="wm-site-logo" alt="Wikimedia site logo" />
            </a>
        </div>
        <div class="bar-container">
          <div 
            v-for="(count, ns) in data.nsCounts" 
            :key="ns"
            class="bar-segment" 
            :style="{ width: ((count / maxCount) * 100) + '%', backgroundColor: getNsColor(ns) }"
            :title="`${getNsName(ns)}: ${count} edits`"
          ></div>
        </div>
        <span class="count">{{ data.total }} edits</span>
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

const props = defineProps({
  edits: {
    type: Array,
    required: true,
  },
});

defineEmits(['filter-user']);

const currentPage = ref(1);
const pageSize = 50;

const allUsersSorted = computed(() => {
  const users = {};
  props.edits.forEach((e) => {
    if (!users[e.author]) {
      users[e.author] = { total: 0, nsCounts: {} };
    }
    users[e.author].total += 1;
    const ns = e.ns !== undefined ? String(e.ns) : 'unknown';
    users[e.author].nsCounts[ns] = (users[e.author].nsCounts[ns] || 0) + 1;
  });
  return Object.entries(users).sort(([,a], [,b]) => b.total - a.total);
});

const totalPages = computed(() => Math.ceil(allUsersSorted.value.length / pageSize));

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return Object.fromEntries(allUsersSorted.value.slice(start, end));
});

const maxCount = computed(() => {
  return allUsersSorted.value.length > 0 ? allUsersSorted.value[0][1].total : 1;
});

const getNsName = (nsStr) => {
  const mapping = {
    '0': 'Main (Meta)',
    // '1': 'Talk',
    // '2': 'User',
    // '3': 'User talk',
    '4': 'Commons:Lingua Libre',
    // 'Commons:Lingua Libre/List/',
    '5': 'Commons talk:Lingua Libre',
    '6': 'File',
    // '7': 'File talk',
    // '8': 'MediaWiki',
    // '9': 'MediaWiki talk',
    '10': 'Template',
    '11': 'Template talk',
    '12': 'Help:Lingua Libre',
    '13': 'Help talk:Lingua Libre',
    '14': 'Category',
    // '15': 'Category talk',
    // '106': 'Institution',
    '200': 'Grants (Meta)',
    '1198': 'Translations',
    '6913': 'Phabricator (lingua-libre)',
    '3393': 'Phabricator (lingua-libre-legacy)',
    '-1': 'Gitlab Commits',
    '-2': 'Github Commits',
    'unknown': 'Others'
  };
  return mapping[nsStr] || `Namespace ${nsStr}`;
};

const getNsColor = (nsStr) => {
  // Try to give a distinct color to major namespaces
  const colors = {
    '0': '#ffc107',     // Yellow
    '2': '#17a2b8',     // Cyan
    '4': '#007bff',     // Blue
    '6': '#28a745',     // Green
    '10': '#e83e8c',    // Pink
    '12': '#fd7e14',    // Orange
    '14': '#6f42c1',    // Purple
    '1198': '#6c757d',  // Gray
    '-1': '#f03e3e', // Red
    '-2': '#4057c0', // Dark blue
    'unknown': '#adb5bd'
  };
  // Fallback hashing for other namespaces
  if (colors[nsStr]) return colors[nsStr];
  const hue = (parseInt(nsStr || 0) * 137.508) % 360;
  return `hsl(${hue}, 60%, 50%)`;
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};
</script>

<style scoped>
.top-contributors {
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
.contributor {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}
.user-info {
  flex: 0 0 150px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
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
.user {
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
  .top-contributors {
    background-color: #2d2d2d;
  }
  .user {
    color: #66b0ff;
  }
}
</style>
