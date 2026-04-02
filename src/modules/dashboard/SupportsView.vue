<template>
  <div class="dashboard-wiki">
    <nav class="breadcrumbs" v-if="route.query.title || route.query.username">
      <router-link :to="{ path: route.path }">Wiki Dashboard</router-link>
      <span class="separator">&rsaquo;</span>
      <span v-if="route.query.title" class="current-page">Page: {{ route.query.title }}</span>
      <span v-if="route.query.title && route.query.username" class="separator">&rsaquo;</span>
      <span v-if="route.query.username" class="current-page">User: {{ route.query.username }}</span>
    </nav>
    <nav class="breadcrumbs" v-else>
      <span class="current-page">Wiki Dashboard</span>
    </nav>

    <header class="dashboard-header">
      <p class="subtitle">Revealing community-supporting edits, contributors, and page activity across Lingua Libre projects.</p>
    </header>
    <ActivityDataFetcher :key="route.fullPath" />
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import ActivityDataFetcher from '../components/dashboards/ActivityDataFetcher.vue';

const route = useRoute();
</script>

<style scoped>
.dashboard-wiki {
  max-width: 1200px;
  min-width: 800px;
  margin: 0 auto;
  padding: 1rem 2rem;
}
.breadcrumbs {
  margin-bottom: 1rem;
  font-size: 0.95rem;
  color: #6c757d;
}
.breadcrumbs a {
  color: #007bff;
  text-decoration: none;
}
.breadcrumbs a:hover {
  text-decoration: underline;
}
.separator {
  margin: 0 0.5rem;
  color: #ccc;
}
.current-page {
  font-weight: 600;
  color: #495057;
}

.dashboard-header {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 1rem;
}
.subtitle {
  color: #6c757d;
  font-size: 1.1rem;
  margin: 0;
}
@media (prefers-color-scheme: dark) {
  .dashboard-header { border-bottom-color: #444; }
  .subtitle { color: #adb5bd; }
  .breadcrumbs a { color: #66b0ff; }
  .current-page { color: #e9ecef; }
  .separator { color: #666; }
}
</style>
