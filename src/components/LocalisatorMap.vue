<template>
  <div class="globe-wrapper">
    <ul v-if="legend" class="globe-legend" aria-label="Ethnologue language status">
      <li v-for="item in legendItems" :key="item.label">
        <span class="swatch" :style="{ background: item.color }"></span>{{ item.label }}
      </li>
    </ul>
    <div ref="globeContainer" class="globe-wp-container"></div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, computed, toRefs } from 'vue'
import { createOrthographicGlobe } from '@/js/orthographic'
import { ETHNOLOGUE_STATUS_LABELS, ethnologStatusColor } from '@/js/ethnologue'

// Define component properties
const props = defineProps({
  /**
   * Array of markers to display on the globe.
   * Each entry must be an object with `lat` and `lon` number properties, and optionally:
   * `color` (CSS color), `size` (radius in px), `label` (hover tooltip), `url` (click target).
   * Example: [{ lat: 48.8566, lon: 2.3522, color: 'blue', size: 4, label: 'Paris', url: '/paris' }]
   */
  data: {
    type: Array,
    required: true,
    validator: (value) =>
      value.every(
        (c) =>
          typeof c === 'object' &&
          typeof c.lat === 'number' &&
          typeof c.lon === 'number' &&
          (c.color === undefined || typeof c.color === 'string') &&
          (c.size === undefined || typeof c.size === 'number') &&
          (c.label === undefined || typeof c.label === 'string') &&
          (c.url === undefined || typeof c.url === 'string'),
      ),
  },
  title: {
    type: String,
    default: 'Location',
  },
  width: {
    type: Number,
    default: 48,
  },
  /** Show a discrete Ethnologue status legend to the left of the globe. */
  legend: {
    type: Boolean,
    default: false,
  },
})

const { data, title, width } = toRefs(props)

const legendItems = Object.values(ETHNOLOGUE_STATUS_LABELS).map((label) => ({
  label,
  color: ethnologStatusColor(label),
}))
const globeContainer = ref(null)

/**
 * Compute the centroid of all provided coordinates to use as the
 * initial centre of the globe rotation.
 */
const centroid = computed(() => {
  const coords = data.value
  if (!coords || coords.length === 0) return { lat: 0, lon: 0 }
  const sumLat = coords.reduce((acc, c) => acc + c.lat, 0)
  const sumLon = coords.reduce((acc, c) => acc + c.lon, 0)
  return { lat: sumLat / coords.length, lon: sumLon / coords.length }
})

/**
 * Initialize the globe
 */
const initGlobe = () => {
  if (!globeContainer.value) return
  // Clear any existing content
  globeContainer.value.innerHTML = ''
  // Create the orthographic globe
  try {
    createOrthographicGlobe(
      globeContainer.value,
      width.value,
      title.value,
      centroid.value.lat,
      centroid.value.lon,
      data.value,
    )
  } catch (error) {
    console.error('Failed to create orthographic globe:', error)
  }
}

// Initialize on mount
onMounted(() => {
  initGlobe()
})

// Re-initialize when props change
watch([data, title, width], () => {
  initGlobe()
})
</script>

<style scoped>
.globe-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.globe-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.7rem;
  line-height: 1.4;
  white-space: nowrap;
}

.globe-legend li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.globe-legend .swatch {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  flex: none;
}

.globe-wp-container {
  display: inline-block;
  cursor: grab;
  vertical-align: middle;
}

.globe-wp-container:active {
  cursor: grabbing;
}

.globe-wp-container :deep(svg) {
  display: block;
}
</style>
