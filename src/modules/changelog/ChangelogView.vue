<template>
  <div class="page">
    <AppBreadcrumb :items="crumbs" share-title="Lingua Deck · Changelog" />

    <header class="dashboard-header">
      <p class="subtitle">What changed in Lingua Deck, month by month: first for users, then the technical details.</p>
    </header>

    <div v-if="hasReconstructed" class="alert alert-info mb-6">
      Entries tagged <span class="tag">reconstructed</span> were written afterwards from the commit history and file dates, so their dates are approximate.
    </div>

    <div class="flex flex-col gap-6">
      <ReleaseMessage v-for="release in releases" :key="release.id" :release="release" />
      <p v-if="!releases.length" class="text-secondary">No changelog entries yet.</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import ReleaseMessage from './components/ReleaseMessage.vue'
import { releases } from './data/releases.js'

const crumbs = [{ label: 'Changelog', to: '/changelog' }]

const hasReconstructed = computed(() => releases.some((r) => r.reconstructed || r.days?.some((d) => d.reconstructed)))
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
</style>
