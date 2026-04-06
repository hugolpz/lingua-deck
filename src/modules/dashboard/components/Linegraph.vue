<template>
  <div class="linegraph-container">
    <h3 v-if="topicTitle">{{ topicTitle }} Activity Timelines</h3>

    <div class="svg-wrapper" ref="wrapperRef" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
      <svg 
        class="linegraph-svg" 
        preserveAspectRatio="none"
        :viewBox="`0 0 ${width} ${height}`"
      >
        <!-- Grid and Axes -->
        <g class="grid">
          <line
            v-for="yTick in yTicks"
            :key="'y-'+yTick.value"
            x1="0"
            :y1="yTick.y"
            :x2="width"
            :y2="yTick.y"
            class="grid-line"
          />
        </g>
        
        <!-- Areas -->
        <polygon
          v-for="(series, i) in lineData"
          :key="'area-'+series.group"
          :points="series.areaPoints"
          :fill="series.color"
          opacity="0.3"
          class="data-area"
        />

        <!-- Lines -->
        <polyline
          v-for="(series, i) in lineData"
          :key="series.group"
          :points="series.points"
          fill="none"
          :stroke="series.color"
          stroke-width="1"
          class="data-line"
        />

        <!-- Hover vertical line -->
        <line
          v-if="hoverIndex !== null"
          :x1="hoverX"
          y1="0"
          :x2="hoverX"
          :y2="height"
          stroke="#999"
          stroke-width="1"
          stroke-dasharray="4"
        />

        <!-- Scatter points on hover -->
        <circle
          v-if="hoverIndex !== null"
          v-for="series in lineData"
          :key="'pt-'+series.group"
          :cx="series.data[hoverIndex].x"
          :cy="series.data[hoverIndex].y"
          r="4"
          :fill="series.color"
        />
      </svg>

      <!-- Labels Layer out of SVG for better styling -->
      <div class="x-axis-labels">
        <span 
          v-for="(tick, index) in xTicks" 
          :key="index"
          class="x-label"
          :style="{ left: `${(tick.x / width) * 100}%` }"
        >
          {{ tick.label }}
        </span>
      </div>
      <div class="y-axis-labels">
        <span
          v-for="tick in yTicks"
          :key="tick.value"
          class="y-label"
          :style="{ top: `${(tick.y / height) * 100}%` }"
        >
          {{ tick.value }}
        </span>
      </div>

      <!-- Tooltip -->
      <div 
        v-if="tooltip"
        class="tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <div class="tooltip-date">Date: {{ tooltip.date }}</div>
        <div 
          v-for="item in tooltip.items" 
          :key="item.group" 
          class="tooltip-item"
        >
          <span class="color-dot" :style="{ backgroundColor: item.color }"></span>
          {{ item.group }}: <span class="fw-bold">{{ item.count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getSharedColor } from './projectSatellitePlatforms.js';

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  dateStart: {
    type: String,
    default: '2016-01-01'
  },
  dateEnd: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  dateBrush: {
    type: Boolean,
    default: true
  },
  groupKey: {
    type: String,
    default: 'author',
  },
  timeGrouping: {
    type: String,
    default: 'month', // day, week, month, quarter, year
  },
  limit: {
    type: Number,
    default: 10,
  },
  topicTitle: {
    type: String,
    default: 'Topic',
  }
});

// Dimensions for the math
const width = 800;
const height = 300;
const margin = { top: 10, right: 10, bottom: 20, left: 40 };

// Time axis generation
const generateDateRange = (startStr, endStr, grouping) => {
  const dates = [];
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return dates;

  let current = new Date(start);
  
  while (current <= end) {
    let key = '';
    let label = '';
    const y = current.getUTCFullYear();
    const m = current.getUTCMonth() + 1;
    const d = current.getUTCDate();
    const pad = (n) => String(n).padStart(2, '0');

    if (grouping === 'year') {
      key = `${y}`;
      label = key;
      current.setUTCFullYear(current.getUTCFullYear() + 1);
    } else if (grouping === 'quarter') {
      const q = Math.floor(current.getUTCMonth() / 3) + 1;
      key = `${y}-Q${q}`;
      label = `Q${q} ${y}`;
      current.setUTCMonth(current.getUTCMonth() + 3);
    } else if (grouping === 'month') {
      key = `${y}-${pad(m)}`;
      label = current.toLocaleString('default', { month: 'short', year: '2-digit' });
      current.setUTCMonth(current.getUTCMonth() + 1);
    } else if (grouping === 'day') {
      key = `${y}-${pad(m)}-${pad(d)}`;
      label = key;
      current.setUTCDate(current.getUTCDate() + 1);
    } else {
      // Default fallback week
      key = `${y}-${pad(m)}-${pad(d)}`;
      label = key;
      current.setUTCDate(current.getUTCDate() + 7);
    }
    dates.push({ key, label, timestamp: current.getTime() });
  }
  return dates;
};

// Processed Data
const chartData = computed(() => {
  const dates = generateDateRange(props.dateStart, props.dateEnd, props.timeGrouping);
  if (!dates.length) return { labels: [], series: [] };

  // 1. Group by groupKey and count overall total to find Top N
  const overallCounts = {};
  props.data.forEach(edit => {
    const group = edit[props.groupKey] || 'Unknown';
    overallCounts[group] = (overallCounts[group] || 0) + 1;
  });

  const sortedGroups = Object.entries(overallCounts).sort((a, b) => b[1] - a[1]);
  const topGroups = sortedGroups.slice(0, props.limit).map(x => x[0]);
  const hasOthers = sortedGroups.length > props.limit;

  // 2. Initialize matrix
  const seriesMap = {};
  if (hasOthers) {
    seriesMap['Others'] = {
      group: 'Others',
      color: getSharedColor('unknown'),
      data: Array(dates.length).fill(0)
    };
  }
  topGroups.forEach((group, index) => {
    seriesMap[group] = {
      group,
      color: getSharedColor(group, index),
      data: Array(dates.length).fill(0)
    };
  });

  // 3. Fill matrix
  props.data.forEach(edit => {
    const group = edit[props.groupKey] || 'Unknown';
    const seriesKey = seriesMap[group] ? group : (hasOthers ? 'Others' : null);
    if (!seriesKey) return; 

    const date = new Date(edit.timestamp);
    if (isNaN(date.getTime())) return;
    
    // Find index in dates
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const q = Math.floor(date.getUTCMonth() / 3) + 1;
    
    let keyToMatch = '';
    if (props.timeGrouping === 'year') keyToMatch = `${y}`;
    else if (props.timeGrouping === 'quarter') keyToMatch = `${y}-Q${q}`;
    else if (props.timeGrouping === 'month') keyToMatch = `${y}-${m}`;
    else keyToMatch = `${y}-${m}-${d}`; // day/week loose match

    const dateIndex = dates.findIndex(d => d.key === keyToMatch);
    if (dateIndex !== -1) {
      seriesMap[seriesKey].data[dateIndex] += 1;
    }
  });

  const series = [];
  // Stack Others at bottom
  if (hasOthers) series.push(seriesMap['Others']);
  // Reverse topGroups so largest is at the bottom of the stack
  [...topGroups].reverse().forEach(g => {
     series.push(seriesMap[g]);
  });

  return {
    dates,
    labels: dates.map(d => d.label),
    series
  };
});

// Calculate Max Y for scaling
const maxY = computed(() => {
  const { dates, series } = chartData.value;
  if (!dates || !dates.length) return 10;

  let max = 10;
  for (let i = 0; i < dates.length; i++) {
    let sum = 0;
    series.forEach(s => {
      sum += s.data[i];
    });
    if (sum > max) max = sum;
  }
  return Math.ceil(max * 1.1); // Add 10% headroom
});

// Create SVG coordinate arrays
const lineData = computed(() => {
  const { dates, series } = chartData.value;
  if (!dates || !dates.length) return [];

  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;

  const accumulated = Array(dates.length).fill(0);

  return series.map(s => {
    const bottomLine = accumulated.map((acc, i) => {
      const x = margin.left + (i / Math.max(1, dates.length - 1)) * w;
      const y = margin.top + h - (acc / maxY.value) * h;
      return { x, y };
    });

    const mapped = s.data.map((val, i) => {
      accumulated[i] += val;
      const x = margin.left + (i / Math.max(1, dates.length - 1)) * w;
      const y = margin.top + h - (accumulated[i] / maxY.value) * h;
      return { x, y, val: accumulated[i], origVal: val };
    });
    
    const pointsStr = mapped.map(p => `${p.x},${p.y}`).join(' ');
    
    const areaPointsStr = [
      ...mapped.map(p => `${p.x},${p.y}`),
      ...bottomLine.reverse().map(p => `${p.x},${p.y}`)
    ].join(' ');

    return {
      group: s.group,
      color: s.color,
      points: pointsStr,
      areaPoints: areaPointsStr,
      data: mapped
    };
  });
});

// Axis Ticks
const yTicks = computed(() => {
  const ticks = 5;
  const h = height - margin.top - margin.bottom;
  const arr = [];
  for (let i = 0; i <= ticks; i++) {
    const val = (maxY.value / ticks) * i;
    const y = margin.top + h - (val / maxY.value) * h;
    arr.push({ value: Math.round(val), y });
  }
  return arr;
});

const xTicks = computed(() => {
  const { dates } = chartData.value;
  if (!dates) return [];
  const w = width - margin.left - margin.right;
  // Reduce tick density if too many dates
  const step = Math.ceil(dates.length / 10);
  const arr = [];
  for (let i = 0; i < dates.length; i += step) {
    const x = margin.left + (i / Math.max(1, dates.length - 1)) * w;
    arr.push({ label: dates[i].label, x });
  }
  // Make sure last label is present if appropriate
  if (dates.length > 0 && (dates.length - 1) % step !== 0) {
     const i = dates.length - 1;
     const x = margin.left + (i / (dates.length - 1)) * w;
     arr.push({ label: dates[i].label, x });
  }
  return arr;
});

// Interactive state
const wrapperRef = ref(null);
const hoverIndex = ref(null);
const hoverX = ref(0);
const tooltip = ref(null);

const onMouseMove = (e) => {
  if (!wrapperRef.value || !chartData.value.dates.length) return;
  const rect = wrapperRef.value.getBoundingClientRect();
  
  // Mouse coordinates relative to SVG viewBox
  const mouseX = e.clientX - rect.left;
  const scaleX = width / rect.width;
  const svgX = mouseX * scaleX;

  // Find nearest date index
  const w = width - margin.left - margin.right;
  let rawIndex = Math.round(((svgX - margin.left) / w) * (chartData.value.dates.length - 1));
  rawIndex = Math.max(0, Math.min(chartData.value.dates.length - 1, rawIndex));
  
  hoverIndex.value = rawIndex;
  hoverX.value = margin.left + (rawIndex / Math.max(1, chartData.value.dates.length - 1)) * w;

  // Set tooltip contents
  const items = chartData.value.series.map(s => {
    return {
      group: s.group,
      color: s.color,
      count: s.data[rawIndex]
    };
  }).sort((a, b) => b.count - a.count);

  tooltip.value = {
    x: mouseX + 15,
    y: e.clientY - rect.top,
    date: chartData.value.dates[rawIndex].label,
    items: items.filter(item => item.count > 0)
  };
};

const onMouseLeave = () => {
  hoverIndex.value = null;
  tooltip.value = null;
};

</script>

<style scoped>
.linegraph-container {
  width: 100%;
  margin-bottom: 2rem;
  font-family: sans-serif;
}

h3 {
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: #333;
}

.svg-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 6; /* Responsive aspect ratio */
  background: #fdfdfd;
  border-radius: 4px;
  border: 1px solid #ebebeb;
}

.linegraph-svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

.grid-line {
  stroke: #eaeaea;
  stroke-width: 1;
}

.data-line {
  stroke-linejoin: round;
  stroke-linecap: round;
  transition: opacity 0.2s;
}

.data-line:hover {
  stroke-width: 2;
}

.y-axis-labels {
  position: absolute;
  top: 0;
  left: 0;
  width: 35px;
  height: 100%;
  pointer-events: none;
}

.y-label {
  position: absolute;
  font-size: 10px;
  color: #888;
  transform: translateY(-50%);
  right: 5px;
  white-space: nowrap;
}

.x-axis-labels {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 20px;
  pointer-events: none;
}

.x-label {
  position: absolute;
  font-size: 10px;
  color: #888;
  transform: translateX(-50%);
  margin-top: 4px;
  white-space: nowrap;
}

.tooltip {
  position: absolute;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  pointer-events: none;
  font-size: 0.85rem;
  z-index: 10;
  min-width: 120px;
}

.tooltip-date {
  font-weight: bold;
  margin-bottom: 4px;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
}

.tooltip-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0;
}

.color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.fw-bold {
  font-weight: 600;
  margin-left: auto;
}

@media (prefers-color-scheme: dark) {
  h3 { color: #eee; }
  .svg-wrapper {
    background: #252525;
    border-color: #333;
  }
  .grid-line { stroke: #3a3a3a; }
  .y-label, .x-label { color: #aaa; }
  .tooltip {
    background: rgba(30, 30, 30, 0.95);
    border-color: #444;
    color: #eee;
  }
  .tooltip-date { border-color: #444; }
}
</style>
