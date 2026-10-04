<template>
  <div id="notice-experimental" class="alert alert-warning mx-auto max-w-2xl" role="alert">
    <span v-html="t('global-notice-experimental')"></span>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
