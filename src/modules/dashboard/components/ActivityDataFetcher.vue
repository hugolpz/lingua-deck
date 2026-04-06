<template>
  <div class="wiki-data-fetcher">
    
    <div class="system-status">
      <div class="status-header">
        <div class="status-badge" :class="{ 'is-loading': status.includes('Fetching') || status.includes('Checking') }">
          <span class="dot"></span>
          {{ status }}
        </div>

        <div id="sources" class="toggle-group">
          <button :class="{ active: activeSource === 'all' }" @click="activeSource = 'all'">All</button>
          <button v-for="(endpoint, key) in API_ENDPOINTS" :key="key" :class="{ active: activeSource === key }" @click="activeSource = key" :title="endpoint.name">
            <img :src="endpoint.logo" :alt="endpoint.name" class="source-logo" />
          </button>
        </div>

        <div id="types-filters" class="toggle-group">
          <button :class="{ active: hideBots }" @click="hideBots = true">Humans only</button>
          <button :class="{ active: !hideBots }" @click="hideBots = false">Include bots</button>
          <button :class="{ active: hideTranslations }" @click="hideTranslations = !hideTranslations">Hide translations</button>
        </div>
      </div>
      <div class="info-callout" v-if="!showLists">
        <strong>Note:</strong> Lists are not included to avoid API limits, as most of our 6000 lists are bot-created.
      </div>
      
      <div v-if="anyApiLimitReached && missingPagesCount > 0" class="info-callout error">
        <strong>API rate limit reached:</strong> data from {{ missingPagesCount }} wikipages could not be fetch. Please reload this page in 1 hour to continue processing.
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-if="filteredEdits.length > 0" class="dashboard-content">
      <KpiMetricCards :edits="filteredEdits" :activeSource="activeSource" />
      <div class="charts-area">
        <TopList 
          id="TopContriborsList" 
          :data="filteredEdits" 
          :title="`Authorship (${activeSource})`"
          groupKey="author"
          subGroupKey="ns"
          countLabel="edits"
          linkBaseUrl="https://commons.wikimedia.org/wiki/User:"
          :subGroupMapping="namespaceMapping"
          @filter-item="(u) => { username = u; updateUrl() }" 
        />

        <TopList
          id="MonthlyNamespaceContributionsList" 
          :data="filteredEdits.map(edit => {  return {  ...edit, timestamp: edit.timestamp.slice(0,7) }; })"
          :title="`Monthly contributions by namespace (${activeSource})`"
          groupKey="timestamp"
          subGroupKey="ns"
          countLabel="edits"
          :subGroupMapping="namespaceMapping"
          sortBy="key"
          sortDirection="desc"
        />
        <Linegraph
          :data="filteredEdits"
          groupKey="author"
          timeGrouping="quarter"
          :limit="14"
          :topicTitle="`Author (${activeSource})`"
          :dateBrush="true"
        />
      </div>
      <TopChart 
        :data="filteredEdits" 
        counting="author" 
        :title="`Author (${activeSource})`" 
        mode="piechart"
        :limit="12"
      />
      <EditHistoryTable 
        :edits="filteredEdits" 
        :endpoints="API_ENDPOINTS"
        @filter-user="(u) => { username = u; updateUrl() }"
        @filter-page="(p) => { title = p; updateUrl() }"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import KpiMetricCards from './KpiMetricCards.vue';
import TopList from './TopList.vue';
import EditHistoryTable from './EditHistoryTable.vue';
import TopChart from './TopChart.vue';
import Linegraph from './Linegraph.vue';
import { API_ENDPOINTS, namespaceMapping } from './projectSatellitePlatforms.js';
import { projectsActivityData } from './projectActivityData.js';

const route = useRoute();
const router = useRouter();

const username = ref(route.query.username || '');
const title = ref(route.query.title || '');
const showLists = ref(!route.query.list === 'false');
const hideBots = ref(true);
const hideTranslations = ref(false);
const activeSource = ref('all');

const {
  status, 
  apiLimitReached,
  anyApiLimitReached,
  missingPagesCount, 
  projectEdits, 
  getWikipages, 
  getEdits 
} = projectsActivityData();

const filteredEdits = computed(() => {
  let edits = projectEdits.value;
  
  if (activeSource.value !== 'all') {
    edits = edits.filter((e) => e.source === activeSource.value);
  }

  if (hideBots.value) {
    edits = edits.filter((e) => {
      const lowerAuthor = e.author.toLowerCase();
      // Only keep humans (filter out 'bot' at start or end)
      return !lowerAuthor.startsWith('bot') && !lowerAuthor.endsWith('bot') && !lowerAuthor.startsWith('translatewiki') && !e.title.startsWith('Update output files') ;
    });
  }

  if (hideTranslations.value) {
    edits = edits.filter((e) => {
      const pageTitle = e.title.toLowerCase();
      // Use regex test rather than endsWith which doesn't support regex in JS
      return !/\/[a-z]{2,3}(-[a-z]{2,4})?$/.test(pageTitle);
    });
  }

  if (username.value) {
    edits = edits.filter((e) => e.author === username.value);
  }
  if (title.value) {
    edits = edits.filter((e) => e.title === title.value);
  }
  return edits;
});

const updateUrl = () => {
  const query = {};
  if (username.value) query.username = username.value;
  if (title.value) query.title = title.value;
  if (!showLists.value) query.list = 'false';
  router.push({ query });
};

onMounted(async () => {
  await getWikipages(showLists.value);
  await getEdits(title.value);
});
</script>

<style scoped>
.wiki-data-fetcher {
  padding: 1rem;
}
.system-status {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
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

.source-logo {
  width: 16px;
  height: 16px;
  object-fit: contain;
  vertical-align: middle;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #d4edda;
  color: #155724;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 500;
  align-self: flex-start;
}

.status-badge.is-loading {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
}

.status-badge.is-loading .dot {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%   { opacity: 0.4; }
  50%  { opacity: 1; }
  100% { opacity: 0.4; }
}

.info-callout {
  background-color: #e9ecef;
  border-left: 4px solid #6c757d;
  padding: 1rem;
  border-radius: 4px;
  color: #495057;
  font-size: 0.95rem;
}

.info-callout.error {
  background-color: #f8d7da;
  border-left-color: #dc3545;
  color: #721c24;
}

@media (prefers-color-scheme: dark) {
  .status-badge { background-color: #1e4620; color: #75b798; }
  .status-badge.is-loading { background-color: #503d0b; color: #ffda6a; }
  .info-callout { background-color: #2d2d2d; border-left-color: #adb5bd; color: #e9ecef; }
  .info-callout.error { background-color: #442726; border-left-color: #e4606d; color: #ffb3b8; }
  
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
}

.dashboard-content {
  margin-top: 2rem;
}
.charts-area {
  margin-bottom: 2rem;
}
</style>