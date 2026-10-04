<template>
  <div class="categories-list-wrapper w-full md:w-2/3">
    <div v-if="loading" class="alert alert-info">Loading category data…</div>
    <div v-else-if="error" class="status error">{{ error }}</div>

    <ul v-else class="categories-list">
      <li v-for="item in items.sort((a, b) => b.files - a.files)" :key="item.code" class="category-item">
        <router-link :to="categoryRoute(item)"><span class="category-label">{{ item.labelEnglish || item.code }}</span></router-link>
        <span v-if="item.type !== 'user' && !item.lat && !item.lon" class="text-destructive">*</span>
        <a :href="'https://commons.wikimedia.org/wiki/' + item.title"><span class="category-meta">{{ item.files }} files</span></a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { fetchLanguagesData, fetchUsersData } from '@/modules/categories/data/commons-categories'

const props = defineProps({
  categories: {
    type: Array,
    required: true,
  },
  type: {
    type: String,
    required: true,
    validator: (value) => ['language', 'username'].includes(value),
  },
})

const emit = defineEmits(['loaded'])

const items = ref([])
const loading = ref(true)
const error = ref(null)

const categoryRoute = (item) => ({
  name: 'category',
  params: { title: item.title.replace(/^Category:/, '').replace(/ /g, '_') },
})

const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    let data
    if (props.type === 'language') {
      data = await fetchLanguagesData(props.categories)
    } else {
      data = await fetchUsersData(props.categories)
    }
    // Empty categories are not worth listing
    items.value = data.filter((item) => item.files > 0)
    emit('loaded', items.value)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

watch(() => [props.categories, props.type], () => {
  loadData()
}, { deep: true })
</script>

<style scoped>
.status {
  padding: 1rem;
  color: var(--color-text-secondary);
}

.status.error {
  color: var(--color-destructive);
}

.categories-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  justify-content: center;
}

.category-item {
  display: flex;
  gap: 0.3rem;
  font-size: 0.85rem;
}

.category-label {
  font-weight: 500;
}

.category-meta {
  color: var(--color-text-muted);
}
</style>
