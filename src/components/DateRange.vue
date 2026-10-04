<template>
  <div class="date-range-slider" v-if="quarters.length > 0">
    <div class="slider-header">
      <span class="range-text">Range: <strong>{{ quarters[minValue]?.label }}</strong> to <strong>{{ quarters[maxValue]?.label }}</strong></span>
    </div>
    
    <div class="range-container">
      <div class="range-track"></div>
      <div class="range-selected" :style="selectedStyle"></div>
      
      <input 
        type="range" 
        :min="0" 
        :max="quarters.length - 1" 
        v-model.number="minValue" 
        @input="handleInput('min')"
        class="slider-input"
      />
      <input 
        type="range" 
        :min="0" 
        :max="quarters.length - 1" 
        v-model.number="maxValue" 
        @input="handleInput('max')"
        class="slider-input"
      />
    </div>

    <div class="ticks">
      <span v-for="(q, index) in visibleTicks" :key="index" :style="{ left: q.pos + '%' }">
        {{ q.label }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  start: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['filter']);

const minValue = ref(0);
const maxValue = ref(0);

const quarters = computed(() => {
  if (!props.data || props.data.length === 0) return [];

  const timestamps = props.data
    .map(d => new Date(d.timestamp || d.date).getTime())
    .filter(t => !isNaN(t));

  if (timestamps.length === 0) return [];

  const minDate = new Date(Math.min(...timestamps));
  const maxDate = new Date(Math.max(...timestamps));

  let startYear = minDate.getUTCFullYear();
  let startQ = Math.floor(minDate.getUTCMonth() / 3) + 1;

  if (props.start) {
    const match = props.start.match(/^(\d{4})Q([1-4])$/);
    if (match) {
      const propYear = parseInt(match[1]);
      const propQ = parseInt(match[2]);
      // Use the earlier of the two to ensure all data is reachable, 
      // or should we strictly follow the 'start' prop?
      // "should also define the time axis's start date" suggests strictness.
      startYear = propYear;
      startQ = propQ;
    }
  }

  const endYear = maxDate.getUTCFullYear();
  const endQ = Math.floor(maxDate.getUTCMonth() / 3) + 1;

  const result = [];
  let currYear = startYear;
  let currQ = startQ;

  while (currYear < endYear || (currYear === endYear && currQ <= endQ)) {
    result.push({
      year: currYear,
      quarter: currQ,
      label: `${currYear}Q${currQ}`,
      // For filtering: start of quarter
      start: new Date(Date.UTC(currYear, (currQ - 1) * 3, 1)),
      // end of quarter
      end: new Date(Date.UTC(currYear, currQ * 3, 0, 23, 59, 59, 999))
    });

    currQ++;
    if (currQ > 4) {
      currQ = 1;
      currYear++;
    }
  }

  return result;
});

const selectedStyle = computed(() => {
  if (quarters.value.length === 0) return {};
  const total = quarters.value.length;
  const left = (minValue.value / (total - 1)) * 100;
  const right = 100 - (maxValue.value / (total - 1)) * 100;
  return {
    left: `${left}%`,
    right: `${right}%`
  };
});

const visibleTicks = computed(() => {
  if (quarters.value.length === 0) return [];
  const total = quarters.value.length;
  // Show max 10 labels
  const step = Math.max(1, Math.floor(total / 8));
  const ticks = [];
  for (let i = 0; i < total; i += step) {
    ticks.push({
      label: quarters.value[i].label,
      pos: (i / (total - 1)) * 100
    });
  }
  // Ensure last label is shown
  if (total > 1 && (total - 1) % step !== 0) {
    ticks.push({
      label: quarters.value[total - 1].label,
      pos: 100
    });
  }
  return ticks;
});

const handleInput = (type) => {
  if (type === 'min' && minValue.value > maxValue.value) {
    minValue.value = maxValue.value;
  }
  if (type === 'max' && maxValue.value < minValue.value) {
    maxValue.value = minValue.value;
  }
  emitFilter();
};

const emitFilter = () => {
  if (quarters.value.length === 0) return;
  
  const startLimit = quarters.value[minValue.value].start;
  const endLimit = quarters.value[maxValue.value].end;

  const filtered = props.data.filter(item => {
    const d = new Date(item.timestamp || item.date);
    return d >= startLimit && d <= endLimit;
  });

  emit('filter', filtered);
};

// Initialize
watch(() => quarters.value, (newQuarters) => {
  if (newQuarters.length > 0) {
    let startIdx = 0;
    if (props.start) {
      const idx = newQuarters.findIndex(q => q.label === props.start);
      if (idx !== -1) startIdx = idx;
    }
    minValue.value = startIdx;
    maxValue.value = newQuarters.length - 1;
    emitFilter();
  }
}, { immediate: true });

</script>

<style scoped>
.date-range-slider {
  margin: 1.5rem 0 2.5rem 0;
  padding: 0 10px;
}

.slider-header {
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  color: var(--color-text);
}

.range-container {
  position: relative;
  height: 6px;
  background: var(--color-surface-muted);
  border-radius: 3px;
  margin: 1rem 0;
}

.range-track {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 3px;
}

.range-selected {
  position: absolute;
  top: 0;
  bottom: 0;
  background: var(--color-progressive);
  border-radius: 3px;
}

.slider-input {
  position: absolute;
  top: -6px;
  width: 100%;
  pointer-events: none;
  appearance: none;
  background: none;
  margin: 0;
  height: 18px;
}

.slider-input::-webkit-slider-thumb {
  pointer-events: auto;
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--color-surface);
  border: 2px solid var(--color-progressive);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: var(--shadow);
  transition: transform 0.1s;
}

.slider-input::-moz-range-thumb {
  pointer-events: auto;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-surface);
  border: 2px solid var(--color-progressive);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: var(--shadow);
}

.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.ticks {
  position: relative;
  height: 20px;
  margin-top: 0.5rem;
}

.ticks span {
  position: absolute;
  transform: translateX(-50%);
  font-size: 10px;
  color: var(--color-text-muted);
  white-space: nowrap;
}


</style>
