<template>
  <div class="page">
    <AppBreadcrumb :items="crumbs" share-title="Lingua Deck · Wiki Dashboard" />

    <header class="dashboard-header">
      <p class="subtitle">Revealing community-supporting edits, contributors, and page activity across Lingua Libre projects.</p>
    </header>

    <div class="system-status">
      <div class="status-header flex-col items-start sm:flex-row sm:items-center">
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
          <button :class="{ active: !hideTranslations }" @click="hideTranslations = !hideTranslations">Hide translations</button>
        </div>
      </div>

      <div class="info-callout">
        <strong>Disclaimer:</strong> This dashboard is a work in progress. List, discussions, userpages, social web, Translatewiki, Toolhub, Toolforge, WMcloud and others are not included, their data being either marginal, mixed, or out-of-reach. Nicolas Vion's 2005-2015 contributions and IRL events supports are not included.
      </div>

      <div v-if="anyApiLimitReached && missingPagesCount > 0" class="info-callout error">
        <strong>API rate limit reached:</strong> data from {{ missingPagesCount }} wikipages could not be fetch. Please reload this page in 1 hour to continue processing.
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-if="filteredEdits.length > 0" class="dashboard-content">
      <DateRange :data="projectEdits" start="2015Q1" @filter="handleDateFilter" />

      <SupportsKpiMetricCards :edits="filteredEdits" :activeSource="activeSource" />

      <div class="charts-area">
        <TopList
          id="TopContriborsList"
          :data="filteredEdits"
          :title="`Authorship (${activeSource})`"
          :pageSize="20"
          groupKey="author"
          subGroupKey="source_ns"
          countLabel="edits"
          linkBaseUrl="https://commons.wikimedia.org/wiki/User:"
          :linkLogo="API_ENDPOINTS.commons.logo"
          :subGroupMapping="getDynamicNsMapping"
          @filter-item="(u) => { username = u; updateUrl() }"
        />
        <TopChart
          :data="filteredEdits"
          counting="author"
          :title="`Author (${activeSource})`"
          mode="piechart"
          :limit="12"
        />

        <TopList
          id="MonthlyNamespaceContributionsList"
          :data="filteredEdits.map(edit => {  return {  ...edit, timestamp: edit.timestamp.slice(0,7) }; })"
          :title="`Monthly contributions by namespace (${activeSource})`"
          :pageSize="12"
          groupKey="timestamp"
          subGroupKey="source_ns"
          countLabel="edits"
          :subGroupMapping="getDynamicNsMapping"
          sortBy="key"
          sortDirection="desc"
        />
        <Linegraph
          :data="filteredEdits"
          groupKey="author"
          timeGrouping="quarter"
          :limit="14"
          dateStart="2015-01-01"
          :topicTitle="`Author (${activeSource})`"
          :dateBrush="true"
        />
      </div>
      <RecentChangesTable
        :edits="filteredEdits"
        :endpoints="API_ENDPOINTS"
        @filter-user="(u) => { username = u; updateUrl() }"
        @filter-page="(p) => { title = p; updateUrl() }"
      />
    </div>

    <div class="gitlab-section" style="margin-top:2rem">
      <h3>Repository analysis</h3>
      <GitlabLinesCards :config="gitlabConfig" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
import SupportsKpiMetricCards from './components/SupportsKpiMetricCards.vue';
import TopList from '@/components/TopList.vue';
import RecentChangesTable from '@/components/RecentChangesTable.vue';
import TopChart from '@/components/TopChart.vue';
import Linegraph from '@/components/Linegraph.vue';
import DateRange from '@/components/DateRange.vue';
import { API_ENDPOINTS, getNamespaceInfo } from '@/modules/supports/data/projectSatellitePlatforms.js';
import { projectsActivityData } from '@/modules/supports/data/projectActivityData.js';
import GitlabLinesCards from '@/modules/supports/components/GitlabLinesCards.vue';
import contributions from '@/modules/supports/data/gitlabContributions.js';

const route = useRoute();
const router = useRouter();

const crumbs = computed(() => [
  { label: 'Wiki Dashboard', to: { path: route.path } },
  ...(route.query.title ? [{ label: `Page: ${route.query.title}`, to: { path: route.path, query: { title: route.query.title } } }] : []),
  ...(route.query.username ? [{ label: `User: ${route.query.username}`, to: route.fullPath }] : []),
])

const username = ref(route.query.username || '');
const title = ref(route.query.title || '');
const showLists = ref(!route.query.list === 'false');
const hideBots = ref(true);
const hideTranslations = ref(true);
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

const dateFilteredEdits = ref([]);
const handleDateFilter = (filtered) => {
  dateFilteredEdits.value = filtered;
};

const filteredEdits = computed(() => {
  let edits = dateFilteredEdits.value;

  if (edits.length === 0 && projectEdits.value.length > 0) {
    edits = projectEdits.value;
  }

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

  // Enrich with source-aware namespace key
  return edits.map(e => ({
    ...e,
    source_ns: `${e.source}:${e.ns}`
  }));
});

const getDynamicNsMapping = (key) => {
  const [sourceKey, ns] = key.split(':');
  return getNamespaceInfo(ns, sourceKey);
};

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

// The view is no longer remounted on query change: re-sync filters from the URL.
watch(() => route.fullPath, async () => {
  const prevTitle = title.value;
  username.value = route.query.username || '';
  title.value = route.query.title || '';
  if (title.value !== prevTitle) await getEdits(title.value);
});

const gitlabConfig = computed(() => {
  const first = contributions && contributions.length ? contributions[0] : null;
  if (!first) return { repoUrl: '', patterns: [] };
  return {
    repoUrl: first.repository_url || first.repositoryUrl || '',
    patterns: (first.file_paths || first.filePaths || []).map((p) => p.path || p)
  };
});
</script>

<style scoped>
.dashboard-header {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1rem;
}
.subtitle {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
  margin: 0;
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
  flex-wrap: wrap;
  gap: 1rem;
}

.toggle-group {
  display: flex;
  flex-wrap: wrap;
  background-color: var(--color-surface-muted);
  border-radius: 6px;
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
  background-color: var(--color-success-subtle);
  color: var(--color-success);
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 500;
  align-self: flex-start;
}

.status-badge.is-loading {
  background-color: var(--color-warning-subtle);
  color: var(--color-warning-text);
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
  background-color: var(--color-surface-muted);
  border-left: 4px solid var(--color-text-secondary);
  padding: 1rem;
  border-radius: 4px;
  color: var(--color-text);
  font-size: 0.95rem;
}

.info-callout.error {
  background-color: var(--color-destructive-subtle);
  border-left-color: var(--color-destructive);
  color: var(--color-destructive);
}

.dashboard-content {
  margin-top: 2rem;
}
.charts-area {
  margin-bottom: 2rem;
}
</style>
