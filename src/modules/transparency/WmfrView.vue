<template>
  <div class="page">
    <AppBreadcrumb :items="crumbs" share-title="Wikimedia France spendings" />
    <section class="budget-section card mb-12 p-4">
      <Spendings />
    </section>
  </div>
</template>

<script setup>
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
import Spendings from '@/modules/transparency/components/Spendings.vue';

const crumbs = [
  { label: 'Transparency', to: '/transparency' },
  { label: 'Wikimedia France', to: '/transparency/wmfr' },
];
</script>
