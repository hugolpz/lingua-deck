<template>
  <Linegraph :data="sorted" group-key="author" time-grouping="month" :limit="10" topic-title="Uploader" />
</template>

<script setup>
import { computed } from 'vue'
import Linegraph from '@/components/Linegraph.vue'

const props = defineProps({
  edits: { type: Array, required: true },
})

const sorted = computed(() => [...props.edits].sort((a, b) => a.timestamp.localeCompare(b.timestamp)))
</script>
