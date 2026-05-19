<template>
  <div class="h-[600px] w-[150px] bg-gray-50 border border-gray-200 rounded p-2 flex flex-col">
    <h3 class="text-xs font-bold text-gray-700 mb-2 truncate text-center" :title="title">
      {{ title }} Breakdown
    </h3>
    <div class="flex-1 flex flex-col gap-1 overflow-y-auto">
      <div v-for="item in chartData" :key="item.label" class="flex flex-col gap-1 mb-2">
        <div class="text-[10px] text-gray-600 truncate flex justify-between" :title="item.label">
          <span class="truncate pr-1">{{ item.label || '(empty)' }}</span>
          <span class="font-semibold text-gray-800">{{ item.count }}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full" :style="{ width: item.percentage + '%' }"></div>
        </div>
        <div class="text-[9px] text-right text-gray-500">{{ item.percentage }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => [] // Array of { label: string, count: number }
  },
  title: {
    type: String,
    default: 'Stats'
  }
})

const chartData = computed(() => {
  const total = props.data.reduce((acc, curr) => acc + curr.count, 0)
  if (total === 0) return []
  
  return props.data
    .map(item => ({
      ...item,
      percentage: ((item.count / total) * 100).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count)
})
</script>
