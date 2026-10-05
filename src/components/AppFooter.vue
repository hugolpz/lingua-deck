<template>
  <footer class="mt-12 border-t border-line bg-surface-muted">
    <nav class="mx-auto grid max-w-screen-xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-8 md:grid-cols-4 md:px-6" aria-label="Footer">
      <section v-for="group in groups" :key="group.title">
        <h2 class="mb-2 text-sm font-bold text-base">{{ group.title }}</h2>
        <ul class="m-0 list-none p-0 text-sm">
          <li v-for="row in group.rows" :key="row.key" class="py-0.5" :style="{ paddingInlineStart: `${row.depth * 0.9}rem` }">
            <span v-if="row.depth" class="text-secondary" aria-hidden="true">{{ '›'.repeat(row.depth) }} </span>
            <router-link v-if="row.to && !row.external" :to="row.to">{{ row.title }}</router-link>
            <a v-else-if="row.to" :href="row.to" target="_blank" rel="noopener">{{ row.title }}</a>
            <span v-else class="text-secondary">{{ row.title }}</span>
            <a v-if="row.doc" :href="row.doc" target="_blank" rel="noopener" class="text-secondary"> (doc)</a>
            <span v-if="row.count" class="text-secondary"> ({{ row.count }})</span>
          </li>
        </ul>
      </section>
    </nav>
    <div class="border-t border-line px-4 py-3 text-center text-xs text-secondary md:px-6">
      Lingua Deck ·
      <a href="https://github.com/hugolpz/lingua-deck" target="_blank" rel="noopener">source code</a>
    </div>
  </footer>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { footerGroups } from '@/router/footer'

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'
const CACHE_KEY = 'footer-category-counts'

// { 'Category:X': 123 }, filled once on mount; the footer renders fine without it
const counts = ref({})

const categoryTitles = () => {
  const titles = []
  const walk = (items) =>
    items.forEach((item) => {
      if (item.countCategory) titles.push(item.countCategory)
      if (item.children) walk(item.children)
    })
  footerGroups.forEach((g) => walk(g.items))
  return titles
}

const loadCounts = async () => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      counts.value = JSON.parse(cached)
      return
    }
  } catch {
    /* storage unavailable */
  }
  try {
    const params = new URLSearchParams({
      action: 'query',
      prop: 'categoryinfo',
      titles: categoryTitles().join('|'),
      format: 'json',
      formatversion: '2',
      origin: '*',
    })
    const res = await fetch(`${COMMONS_API}?${params}`)
    if (!res.ok) return
    const data = await res.json()
    const result = {}
    for (const page of data.query?.pages ?? []) {
      if (page.categoryinfo) result[page.title.replace(/ /g, '_')] = page.categoryinfo.size
    }
    counts.value = result
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(result))
    } catch {
      /* ignore */
    }
  } catch {
    /* offline: no counts */
  }
}

// Flatten each group into rows with a depth, skipping disabled items
const groups = computed(() =>
  footerGroups.map((group) => {
    const rows = []
    const walk = (items, depth, path) =>
      items
        .filter((item) => item.enabled !== false)
        .forEach((item) => {
          const key = `${path}/${item.title}`
          const n = item.countCategory ? counts.value[item.countCategory] : undefined
          const count =
            typeof n === 'number' ? `${n.toLocaleString()}${item.countLabel ? ' ' + item.countLabel : ''}` : item.note
          rows.push({
            key,
            depth,
            title: item.title,
            to: item.to,
            external: /^https?:\/\//.test(item.to ?? ''),
            doc: item.doc,
            count,
          })
          if (item.children) walk(item.children, depth + 1, key)
        })
    walk(group.items, 0, group.title)
    return { title: group.title, rows }
  }),
)

onMounted(loadCounts)
</script>
