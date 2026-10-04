<template>
  <section>
    <h2 class="mb-2">Existing lists on Commons</h2>
    <div v-if="loading" class="alert alert-info">Loading lists…</div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>
    <p v-else-if="!lists.length" class="text-secondary">No list yet under Commons:Lingua Libre/List/{{ capitalized }}/.</p>
    <table v-else class="table">
      <thead>
        <tr><th>Page</th><th class="text-right">Lines</th><th><span class="sr-only">Edit</span></th></tr>
      </thead>
      <tbody>
        <tr v-for="l in lists" :key="l.title">
          <td><a :href="commonsPageUrl(l.title)" target="_blank" rel="noopener">{{ l.title.replace('Commons:Lingua Libre/List/', '') }}</a></td>
          <td class="text-right">{{ l.lines }}</td>
          <td>
            <a :href="`${commonsPageUrl(l.title)}?action=edit`" target="_blank" rel="noopener" title="Edit on Commons" class="text-muted hover:text-progressive">
              <AppIcon name="pencil" size="18" />
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { commonsPageUrl, fetchExistingLists } from '../data/incubators'

const props = defineProps({ code: { type: String, required: true } })

const capitalized = computed(() => props.code.charAt(0).toUpperCase() + props.code.slice(1))
const lists = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    lists.value = await fetchExistingLists(props.code)
  } catch (e) {
    error.value = `Could not load lists: ${e.message}`
  } finally {
    loading.value = false
  }
})
</script>
