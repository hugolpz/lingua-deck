<template>
  <div class="page">
    <div>
      <ExperimentalNotice />
      <div class="text-center my-8 md:my-12">
        <h1 class="text-3xl md:text-4xl mb-4">
          {{ $t('dictionary-header') }}
          <a href="https://commons.wikimedia.org/wiki/Commons:Lingua_Libre/Dictionary" target="_blank" rel="noopener" class="ml-2 inline-flex items-center align-middle text-2xl text-muted hover:text-progressive" :title="$t('dictionary-header')">
            <AppIcon name="info" size="24" />
          </a>
        </h1>
        <p class="text-lg text-secondary max-w-2xl mx-auto">
          {{ $t('dictionary-subheader') }}
        </p>
      </div>
      <div class="mx-auto max-w-screen-xl">
        <DictionaryList />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import DictionaryList from '@/modules/dictionary/components/DictionaryList.vue'
import AppIcon from '@/components/AppIcon.vue'
import ExperimentalNotice from '@/components/ExperimentalNotice.vue'

const { t } = useI18n()
</script>
