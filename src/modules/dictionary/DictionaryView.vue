<template>
  <div class="dictionary-view">
    <div class="container mx-auto px-4 py-8">
      <div class="hero-section text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">
          {{ $t('dictionary-header') }}
        </h1>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          {{ $t('dictionary-subheader') }}
        </p>
      </div>
      <div class="recordings-section">
        <DictionaryList />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { CdxLookup } from '@wikimedia/codex';
import DictionaryList from '../components/DictionaryList.vue'

const { t } = useI18n()
</script>

<style scoped>
.dictionary-view {
  min-height: 100vh;
  background-color: #f8fafc;
}

.hero-section {
  padding-top: 2rem;
}

.recordings-section {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
