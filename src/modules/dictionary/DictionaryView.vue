<template>
  <div class="dictionary-view">
    <div class="container mx-auto px-4 py-8">
      <div class="hero-section text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">
          {{ $t('dictionary-header') }}
          <a href="https://commons.wikimedia.org/wiki/Commons:Lingua_Libre/Dictionary" target="_blank" rel="noopener" class="info-link" :title="$t('dictionary-header')">
            <CdxIcon :icon="cdxIconInfoFilled" />
          </a>
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
import { CdxIcon } from '@wikimedia/codex';
import { cdxIconInfoFilled } from '@wikimedia/codex-icons';
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
.info-link {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  margin-left: 0.4rem;
  color: #6b7280;
  text-decoration: none;
  font-size: 1.5rem;
}
.info-link:hover {
  color: #2563eb;
}
</style>
