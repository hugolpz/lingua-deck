<template>
  <div class="localisation-languages">
    <!-- One header per route, to be customised later -->
    <header v-if="heading">
      <h1>{{ heading.title }}</h1>
    </header>

    <LocalisatorMap
      v-if="coordinates.length > 0"
      :data="coordinates"
      title="Lingua Libre languages"
      :width="mapWidth"
    />

    <!-- Always mounted: the map needs the languages data on every route -->
    <section v-show="show !== 'recordists'" class="flex w-full flex-col items-center gap-4">
      <h3>Languages ({{ languages.length }})</h3>
      <CategoriesList
        :categories="[
          'Category:Lingua_Libre_pronunciation',
          'Category:Lingua_Libre_pronunciation-other'
        ]"
        type="language"
        @loaded="languages = $event"
      />
    </section>

    <section v-if="show !== 'languages'" class="flex w-full flex-col items-center gap-4">
      <h3>Contributors recording voices ({{ usernames.length }})</h3>
      <CategoriesList
        :categories="['Category:Lingua_Libre_pronunciation by user']"
        type="username"
        @loaded="usernames = $event"
      />
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import LocalisatorMap from '@/components/LocalisatorMap.vue'
import CategoriesList from './components/CategoriesList.vue'

const props = defineProps({
  mapWidth: {
    type: Number,
    default: 400,
  },
  /** 'languages' | 'recordists' | 'all' (both sections) */
  show: {
    type: String,
    default: 'all',
  },
})

const HEADINGS = {
  languages: { title: 'Languages' },
  recordists: { title: 'Recordists' },
}
const heading = computed(() => HEADINGS[props.show])

const languages = ref([])
const usernames = ref([])

const coordinates = computed(() =>
  languages.value
    .filter((l) => typeof l.lat === 'number' && typeof l.lon === 'number' && !isNaN(l.lat) && !isNaN(l.lon))
    .map((l) => ({ lat: l.lat, lon: l.lon })),
)
</script>

<style scoped>
.localisation-languages {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
</style>
