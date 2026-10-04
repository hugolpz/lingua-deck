<template>
  <section>
    <h2 class="mb-2">Exclusion list</h2>
    <div v-if="loading" class="alert alert-info">Loading exclusion list...</div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>
    <div v-else class="exclusion-list">
      <a :href="editUrl" target="_blank" rel="noopener" class="exclusion-list__link">
        <EditPenIcon
          :state="editState"
          :title="editState === 'needed' ? 'Create the exclusion list' : 'Edit on Commons'"
        />
        <span>Edit {{ exclusionList.title }}</span>
        <span class="text-secondary">— non-native <kbd style="
        border:1px solid #CCC; border-radius: 4px; padding:2px;">{{ code }}</kbd> expressions to exclude</span>
      </a>
      <span class="text-secondary">{{ exclusionList.lines }} lines</span>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import EditPenIcon from '@/components/EditPenIcon.vue'
import { commonsPageUrl, fetchExclusionList } from '../data/incubators'

const props = defineProps({ code: { type: String, required: true } })

const exclusionList = ref(null)
const loading = ref(true)
const error = ref(null)

const editUrl = computed(() => `${commonsPageUrl(exclusionList.value.title)}?action=edit`)
const editState = computed(() => {
  if (!exclusionList.value) return 'welcome'
  return exclusionList.value.lines === 0 ? 'needed' : 'no'
})

onMounted(async () => {
  try {
    exclusionList.value = await fetchExclusionList(props.code)
  } catch (e) {
    error.value = `Could not load exclusion list: ${e.message}`
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.exclusion-list {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.exclusion-list__link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.exclusion-list__link > span:last-child {
  overflow-wrap: anywhere;
}
</style>
