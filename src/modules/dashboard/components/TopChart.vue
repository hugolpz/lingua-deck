<template>
  <div class="top-chart">
    <h3 v-if="title">{{ title }}</h3>
    
    <div v-if="['piechart', 'all'].includes(mode)" class="chart-container">
      <div class="pie-wrapper">
        <svg viewBox="0 0 32 32" class="pie-chart">
          <!-- background circle for Others if needed, or simply render slices -->
          <circle 
            v-for="(slice, index) in svgPieSlices" 
            :key="index"
            r="16" cx="16" cy="16"
            :stroke="slice.color"
            stroke-width="32"
            fill="none"
            :stroke-dasharray="slice.dasharray"
            :stroke-dashoffset="slice.dashoffset"
            class="pie-slice"
          >
            <title>{{ slice.label }}: {{ slice.percentage.toFixed(1) }}%</title>
          </circle>
        </svg>
      </div>
      <div class="legend">
        <div v-for="(slice, index) in svgPieSlices" :key="index" class="legend-item" :title="`${slice.label}: ${slice.percentage.toFixed(1)}%`">
          <span class="color-box" :style="{ backgroundColor: slice.color }"></span>
          <span class="legend-label">{{ slice.label }} ({{ slice.percentage.toFixed(1) }}%)</span>
        </div>
      </div>
    </div>

    <div v-if="['table', 'all'].includes(mode)" class="table-container">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>{{ label }}</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in visibleOccurrences" :key="index">
            <td>{{ index + 1 }}</td>
            <td :title="item.label">{{ item.label }}</td>
            <td>{{ item.occurrences }}</td>
            <td>{{ ((item.occurrences / totalItems) * 100).toFixed(1) }}%</td>
          </tr>
          <tr v-if="visibleOccurrences.length < sortedOccurrences.length">
            <td colspan="4" class="text-center">
              <button @click="loadMore" class="load-more-btn">Load More...</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getSharedColor } from '../data/projectSatellitePlatforms.js';

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    default: ''
  },
  counting: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: 'Item'
  },
  mode: {
    type: String,
    default: 'all',
    validator: (value) => ['piechart', 'table', 'all'].includes(value)
  },
  limit: {
    type: Number,
    default: 10
  }
});

const occurrences = computed(() => {
  const counts = {};
  props.data.forEach(item => {
    let key = item[props.counting];
    if (key === undefined || key === null) return;
    if (typeof key === 'object') {
        key = JSON.stringify(key);
    }
    counts[key] = (counts[key] || 0) + 1;
  });
  
  return Object.entries(counts).map(([label, count]) => ({
    label: label === '' ? '(empty)' : label,
    occurrences: count
  }));
});

const sortedOccurrences = computed(() => {
  return [...occurrences.value].sort((a, b) => b.occurrences - a.occurrences);
});

const totalItems = computed(() => {
  return sortedOccurrences.value.reduce((sum, item) => sum + item.occurrences, 0);
});

const displayLimit = ref(props.limit);
const visibleOccurrences = computed(() => sortedOccurrences.value.slice(0, displayLimit.value));

const loadMore = () => {
  displayLimit.value += props.limit;
};

// Calculate actual offsets for pie chart SVG stroke trick (circumference = 100)
// For r=16, circumference = 2 * PI * 16 = 100.53096491487338 ~ 100
// We must use standard values though, stroke-dasharray percentage of circumference.
// Wait, stroke-dasharray values are absolute lengths.
// For viewBox 32 32 and r=16, circumference = 100.53096491487338
const circumference = 2 * Math.PI * 16; 

const svgPieSlices = computed(() => {
   if (totalItems.value === 0) return [];
   let cumulativePercent = 0;

   const top10 = sortedOccurrences.value.slice(0, displayLimit.value);
   const others = sortedOccurrences.value.slice(displayLimit.value);
   
   let combined = top10.map((item, index) => ({
      ...item,
      percentage: (item.occurrences / totalItems.value) * 100,
      color: getSharedColor(item.label, index)
   }));

   if (others.length > 0) {
      const othersCount = others.reduce((sum, item) => sum + item.occurrences, 0);
      combined.push({
         label: 'others',
         occurrences: othersCount,
         percentage: (othersCount / totalItems.value) * 100,
         color: getSharedColor('unknown')
      });
   }
   
   return combined.map(slice => {
      // 0 start is at 3 o'clock. To start at 12 o'clock, we offset by 25% of circumference
      const sliceLength = (slice.percentage / 100) * circumference;
      const emptyLength = circumference - sliceLength;
      
      const offset = (25 / 100) * circumference - (cumulativePercent / 100) * circumference; 
      
      cumulativePercent += slice.percentage;
      return {
         ...slice,
         dasharray: `${sliceLength} ${emptyLength}`,
         dashoffset: offset
      };
   });
});
</script>

<style scoped>
.top-chart {
  margin-bottom: 2rem;
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.chart-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.pie-wrapper {
  width: 250px;
  height: 250px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden; /* optional */
}

.pie-chart {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg); /* another way to start at 12 o'clock if offset is removed, but we handle it via offset. Wait, if we use offset, we might not need rotation. Setting transform rotate(-90deg) is usually cleaner. Let's keep offset logic and drop transform, OR use transform and simplify offset. Using offset as calculated above works nicely. */
}

/* Because offset logic already shifts by 25%, we do not need the transform rotation here. But SVG coordinates are weird, let's just make sure hover works */

.pie-slice {
  cursor: help;
  transition: opacity 0.2s, stroke-width 0.2s;
}

.pie-slice:hover {
  opacity: 0.8;
  /* Optional hover effect */
}

.legend {
  flex: 1;
  column-count: 2;
  column-gap: 1rem;
  min-width: 300px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
  break-inside: avoid; /* Prevents an item from splitting across columns */
}

.color-box {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  display: inline-block;
}

.legend-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

th {
  background-color: #e9ecef;
  font-weight: 600;
}

tr:hover {
  background-color: #f1f3f5;
}

/* Dark mode simple support */
@media (prefers-color-scheme: dark) {
  .top-chart {
    background-color: #2d2d2d;
  }
  
  table {
    background-color: #2d2d2d;
  }
  
  th {
    background-color: #383838;
    border-bottom: 1px solid #444;
  }
  
  td {
    border-bottom: 1px solid #444;
  }
  
  tr:hover {
    background-color: #383838;
  }
}

.text-center {
  text-align: center;
}

.load-more-btn {
  padding: 0.5rem 1rem;
  cursor: pointer;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
}

.load-more-btn:hover {
  background-color: #0056b3;
}
</style>