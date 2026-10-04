<template>
  <section class="w-full">
    <header class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <h2 class="m-0">Financial Flow</h2>
      <p class="m-0 text-sm text-muted">Sponsors · Grants · Projects · Freelancers</p>
      <div class="flex flex-wrap items-center gap-2 sm:ml-auto" role="group" aria-label="Sort projects by">
        <span class="text-xs font-semibold uppercase tracking-wider text-muted">Sort by</span>
        <button
          v-for="opt in sortOptions"
          :key="opt.value"
          type="button"
          class="btn btn-sm"
          :class="{ 'btn-primary': sortMode === opt.value }"
          :aria-pressed="sortMode === opt.value"
          @click="sortMode = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </header>

    <div v-if="loading" class="flex items-center justify-center gap-2 py-16 text-muted" role="status">
      <span class="h-5 w-5 animate-spin rounded-full border-[3px] border-line border-t-progressive"></span>
      Loading wiki data…
    </div>
    <div v-else-if="error" class="alert alert-error" role="alert">{{ error }}</div>

    <template v-else>
      <div class="overflow-x-auto">
        <svg
          class="block w-full min-w-[820px]"
          :viewBox="`0 0 ${LAYOUT.width} ${chart.height}`"
          role="group"
          aria-label="Flow of funds from sponsors to grants, projects and freelancers"
          @mouseleave="highlight = null"
        >
          <g aria-hidden="true">
            <text
              v-for="col in chart.columns"
              :key="col.key"
              :x="col.x + LAYOUT.nodeW / 2"
              y="39"
              text-anchor="middle"
              class="fill-secondary text-[15px] font-bold uppercase tracking-widest"
            >
              {{ col.label }}
            </text>
          </g>

          <g v-if="chart.years.length" aria-hidden="true">
            <line
              :x1="chart.axisX"
              :y1="LAYOUT.marginTop"
              :x2="chart.axisX"
              :y2="chart.height - LAYOUT.marginBottom"
              class="stroke-line"
              stroke-dasharray="4 3"
            />
            <g v-for="y in chart.years" :key="y.year">
              <line :x1="chart.axisX - 6" :x2="chart.axisX + 6" :y1="y.y" :y2="y.y" class="stroke-line" />
              <text :x="chart.axisX" :y="y.y - 4" text-anchor="middle" class="fill-muted text-sm font-semibold">
                {{ y.year }}
              </text>
            </g>
          </g>

          <g fill="none">
            <path
              v-for="l in chart.links"
              :key="l.key"
              :d="l.d"
              :stroke="l.color"
              :stroke-width="l.thick"
              class="cursor-pointer transition-opacity duration-200"
              :style="{ opacity: dimmedLink(l) ? 0.04 : 0.35 }"
              @mouseenter="highlight = new Set([l.chain])"
            >
              <title>{{ l.tip }}</title>
            </path>
          </g>

          <g>
            <g
              v-for="n in chart.nodes"
              :key="n.id"
              tabindex="0"
              class="transition-opacity duration-200 focus:outline-none [&:focus-visible>rect]:stroke-progressive [&:focus-visible>rect]:stroke-2"
              :style="{ opacity: dimmedNode(n) ? 0.15 : 1 }"
              @mouseenter="highlight = n.chains"
              @focus="highlight = n.chains"
              @blur="highlight = null"
            >
              <rect :x="n.x" :y="n.y" :width="LAYOUT.nodeW" :height="n.h" :fill="n.color" rx="3" class="hover:brightness-75" />
              <text v-bind="labelProps(n)" class="pointer-events-none fill-base text-[14.5px]">{{ n.labelShort }}</text>
              <title>{{ n.tip }}</title>
            </g>
          </g>
        </svg>
      </div>

      <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-3 text-xs text-secondary">
        <li v-for="e in legend" :key="e.label" class="flex items-center gap-1.5">
          <span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full" :style="{ background: e.color }"></span>
          {{ e.label }}
        </li>
      </ul>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { data as rawData } from '../data/data.js'
import { projectsDataExtractor } from '../data/projectsDataExtractor.js'
import {
  addEURToGrants,
  addEURToProjectsAndFreelancers,
  cleanProjectTitles,
  inferFreelancerPayouts,
} from '../data/projectsDataCleaner.js'
import { LAYOUT, buildGraph, layoutFlow } from '../data/flowLayout.js'

// Data series colours: deliberately not themed.
const PALETTE = [
  '#4f6ef7', '#e05c5c', '#40a86c', '#f0a030', '#9b59b6', '#1abc9c', '#e67e22', '#e91e8c',
  '#2196f3', '#ff5722', '#607d8b', '#795548', '#009688', '#673ab7', '#f44336', '#8bc34a',
]

const sortOptions = [
  { value: 'date', label: 'Project date' },
  { value: 'sponsor', label: 'Sponsor budget' },
  { value: 'freelancer', label: 'Freelancer budget' },
]

const loading = ref(true)
const error = ref(null)
const sortMode = ref('date')
const highlight = ref(null) // Set of sponsor ids (chains) under the pointer/focus, or null
const input = ref(null) // { sponsors, grants, projects }

const sponsorColors = computed(
  () => new Map((input.value?.sponsors ?? []).map((s, i) => [s.id, PALETTE[i % PALETTE.length]])),
)
// The graph only depends on the data; re-sorting just re-runs the layout.
const graph = computed(() => (input.value ? buildGraph(input.value, (id) => sponsorColors.value.get(id)) : null))
const chart = computed(() => layoutFlow(graph.value ?? { nodes: [], links: [] }, sortMode.value))

const legend = computed(() =>
  (input.value?.sponsors ?? [])
    .filter((s) => chart.value.nodes.some((n) => n.id === `sponsor:${s.id}` && n.euro > 0))
    .map((s) => ({ label: s.name, color: sponsorColors.value.get(s.id) })),
)

const overlaps = (chains) => [...chains].some((c) => highlight.value.has(c))
const dimmedLink = (l) => highlight.value && !highlight.value.has(l.chain)
const dimmedNode = (n) => highlight.value && !overlaps(n.chains)

// Labels: sponsors on the left of the bar, grants above it, projects and freelancers on its right.
function labelProps(n) {
  const midY = n.y + n.h / 2 + 4
  if (n.col === 'sponsor') return { x: n.x - 6, y: midY, 'text-anchor': 'end' }
  if (n.col === 'grant') return { x: n.x + LAYOUT.nodeW / 2, y: n.y - 4, 'text-anchor': 'middle' }
  return { x: n.x + LAYOUT.nodeW + 5, y: midY, 'text-anchor': 'start' }
}

onMounted(async () => {
  try {
    const { projects = [] } = await projectsDataExtractor()
    const cleaned = addEURToProjectsAndFreelancers(
      inferFreelancerPayouts(cleanProjectTitles(projects)),
      rawData,
    )
    input.value = {
      sponsors: rawData.sponsors ?? [],
      grants: addEURToGrants([...(rawData.grants ?? [])]),
      projects: cleaned,
    }
  } catch (e) {
    error.value = `Could not load the funding data: ${e.message}`
  } finally {
    loading.value = false
  }
})
</script>
