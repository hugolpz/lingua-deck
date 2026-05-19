<template>
  <div class="flex flex-col gap-4 w-full">
    <div class="flex items-center gap-4 bg-gray-100 p-4 rounded">
      <span class="font-semibold text-gray-700">Dominant Column:</span>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="radio" value="failure-message" v-model="dominantColumn" class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
        <span class="text-sm font-medium text-gray-900">Failure Message</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="radio" value="iso_639" v-model="dominantColumn" class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
        <span class="text-sm font-medium text-gray-900">ISO</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="radio" value="code" v-model="dominantColumn" class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
        <span class="text-sm font-medium text-gray-900">Code</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="radio" value="info" v-model="dominantColumn" class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
        <span class="text-sm font-medium text-gray-900">Info</span>
      </label>
    </div>

    <div class="overflow-x-auto border border-gray-200 rounded">
      <table class="w-full text-sm text-left text-gray-700">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
          <!-- Filter Row -->
          <tr>
            <th v-for="col in columns" :key="col.field" class="px-6 py-2">
              <input
                type="text"
                v-model="filters[col.field]"
                :placeholder="'Filter ' + col.label"
                class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
              />
            </th>
          </tr>
          <!-- Header Row -->
          <tr>
            <th v-for="col in columns" :key="'h-' + col.field" class="px-6 py-3 cursor-pointer select-none hover:bg-gray-100" @click="sortBy(col.field)">
              <div class="flex items-center justify-between">
                {{ col.label }}
                <span v-if="sortField === col.field">
                  {{ sortAsc ? '▲' : '▼' }}
                </span>
                <span v-else class="text-gray-300">
                  ▲
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in paginatedData" :key="index" class="bg-white border-b hover:bg-gray-50">
            <td v-for="col in columns" :key="'d-' + col.field" 
              class="px-6 py-4" 
              :class="[
                dominantColumn === col.field ? 'bg-blue-50 font-medium' : '',
                col.field === 'recording' ? '!px-2 w-24' : '',
                col.field === 'iso_639' ? '!px-2 max-w-[7ch] truncate' : '',
                col.field === 'filename' ? 'max-w-[300px]' : '',
                col.field === 'code' ? 'max-w-[200px] truncate' : '',
              ]"
              :title="['filename', 'iso_639'].includes(col.field) ? getValue(row, col.field) : undefined"
            >
              <a v-if="col.field === 'iso_639' && isIsoCode(getValue(row, col.field))"
                 :href="`https://en.wikipedia.org/wiki/ISO_639:${getValue(row, col.field)}`"
                 target="_blank"
                 class="text-blue-600 hover:underline"
                 @click.stop
              >
                {{ getValue(row, col.field) }}
              </a>
              <template v-else>
                {{ getValue(row, col.field) }}
              </template>
            </td>
          </tr>
          <tr v-if="paginatedData.length === 0">
            <td :colspan="columns.length" class="px-6 py-4 text-center text-gray-500">
              No matching logs found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer Count & Pagination -->
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50 rounded border border-gray-200 text-sm font-medium text-gray-700">
      <p>
        <span v-if="filteredData.length > 0">
          Showing {{ ((currentPage - 1) * limit) + 1 }} to {{ Math.min(currentPage * limit, filteredData.length) }} of {{ filteredData.length }} filtered items
        </span>
        <span v-else>No matching items</span>
      </p>
      
      <div v-if="totalPages > 1" class="flex gap-2 items-center">
        <button 
          @click="goToPage(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span class="px-2">Page {{ currentPage }} of {{ totalPages }}</span>
        <button 
          @click="goToPage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  logs: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['update:dominant'])

const limit = 500
const currentPage = ref(1)

const dominantColumn = ref('failure-message')

const columns = [
  { field: 'date', label: 'Date' },
  { field: 'failure-message', label: 'Failure Msg' },
  { field: 'recording', label: 'Recording' },
  { field: 'iso_639', label: 'ISO' },
  { field: 'filename', label: 'Filename' },
  { field: 'code', label: 'Code' },
  { field: 'info', label: 'Info' }
]

const filters = ref({
  'date': '',
  'failure-message': '',
  'recording': '',
  'iso_639': '',
  'filename': '',
  'code': '',
  'info': ''
})

const sortField = ref('date')
const sortAsc = ref(false)

const isIsoCode = (val) => {
  if (!val) return false
  return /^[a-z]+(-[a-z]+)?$/.test(String(val))
}

const getValue = (row, field) => {
  if (field === 'code') return row.details?.code || ''
  if (field === 'info') return row.details?.info || ''
  return row[field] || ''
}

const filteredData = computed(() => {
  return props.logs.filter(row => {
    return columns.every(col => {
      const filterValue = filters.value[col.field].toLowerCase()
      if (!filterValue) return true
      
      const value = String(getValue(row, col.field)).toLowerCase()
      return value.includes(filterValue)
    })
  })
})

const sortedData = computed(() => {
  const sorted = [...filteredData.value]
  if (sortField.value) {
    sorted.sort((a, b) => {
      const valA = getValue(a, sortField.value)
      const valB = getValue(b, sortField.value)
      
      if (valA < valB) return sortAsc.value ? -1 : 1
      if (valA > valB) return sortAsc.value ? 1 : -1
      return 0
    })
  }
  return sorted
})

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / limit)
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * limit
  const end = start + limit
  return sortedData.value.slice(start, end)
})

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const sortBy = (field) => {
  if (sortField.value === field) {
    sortAsc.value = !sortAsc.value
  } else {
    sortField.value = field
    sortAsc.value = true
  }
}

import { watch } from 'vue'

watch(filteredData, () => {
  currentPage.value = 1
})

watch(dominantColumn, (newVal) => {
  emit('update:dominant', newVal)
})
</script>
