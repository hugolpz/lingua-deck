<template>
  <article class="corner-card p-4" :class="{ 'text-sm': compact }">
    <header class="mb-3">
      <component :is="compact ? 'h3' : 'h2'" class="m-0" :class="compact ? 'text-base' : 'text-xl'">{{ release.title }}</component>
      <p class="m-0 text-sm text-secondary">
        {{ dateLabel }}
        <span v-if="release.reconstructed" class="tag" title="Written afterwards from the history, dates are approximate">reconstructed</span>
      </p>
    </header>

    <section v-if="release.users?.length" class="mb-3">
      <h3 class="mb-1 text-sm font-bold text-progressive">For users</h3>
      <ul class="m-0 pl-5">
        <li v-for="line in release.users" :key="line">{{ line }}</li>
      </ul>
    </section>

    <details v-if="release.technical?.length" class="mb-3">
      <summary class="cursor-pointer text-sm font-bold text-secondary">Technical</summary>
      <ul class="mt-1 pl-5">
        <li v-for="line in release.technical" :key="line">{{ line }}</li>
      </ul>
      <p v-if="release.commits?.length" class="text-xs text-secondary">
        Commits:
        <template v-for="(sha, i) in release.commits" :key="sha">
          <a :href="`${REPO}/commit/${sha}`" target="_blank" rel="noopener" class="font-mono">{{ sha }}</a
          ><span v-if="i < release.commits.length - 1">, </span>
        </template>
      </p>
    </details>

    <details v-if="release.days?.length">
      <summary class="cursor-pointer text-sm font-bold text-secondary">Day by day ({{ release.days.length }})</summary>
      <div class="mt-2 flex flex-col gap-3">
        <ReleaseMessage v-for="day in release.days" :key="day.id" :release="day" compact />
      </div>
    </details>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const REPO = 'https://github.com/hugolpz/lingua-plus'

const props = defineProps({
  /** { id, kind: 'month' | 'day', date: 'YYYY-MM' | 'YYYY-MM-DD', title, reconstructed?, users[], technical[], commits?[], days?[] } */
  release: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})

const dateLabel = computed(() => {
  const { date, kind } = props.release
  // ISO dates parse as UTC midnight: format in UTC so the month/day never shifts with the viewer's timezone
  const options = kind === 'month' ? { month: 'long', year: 'numeric' } : { dateStyle: 'medium' }
  return new Intl.DateTimeFormat('en', { ...options, timeZone: 'UTC' }).format(new Date(date))
})
</script>
