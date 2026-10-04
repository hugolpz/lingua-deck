<template>
  <article class="project-card">
    <header>
      <h3>
        <a :href="pageUrl" target="_blank" rel="noopener">{{ project.name || project.id }}</a>
      </h3>
      <p class="meta">
        <span v-if="project.starts">{{ project.starts }}</span>
        <span v-if="sponsorNames.length"> · {{ sponsorNames.join(', ') }}</span>
      </p>
    </header>

    <dl class="figures">
      <div>
        <dt>Budget</dt>
        <dd>{{ budgetLabel }}</dd>
      </div>
      <div>
        <dt>Workdays</dt>
        <dd>{{ project.workdays ?? '—' }}</dd>
      </div>
    </dl>

    <ul v-if="project.freelancers?.length" class="team">
      <li v-for="f in project.freelancers" :key="f.beneficiary">
        <span class="name">{{ f.beneficiary }}</span>
        <span v-if="f.payout !== undefined" class="payout">{{ formatAmount(f.payout) }}</span>
        <span v-if="f.tasks?.length" class="tasks">{{ f.tasks.join(', ') }}</span>
      </li>
    </ul>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** One item of `projectsDataExtractor().projects`, optionally with `budgetEUR`. */
  project: { type: Object, required: true },
  /** Sponsor names, resolved by the parent from the grants. */
  sponsors: { type: Array, default: () => [] },
  currency: { type: String, default: 'EUR' },
})

const sponsorNames = computed(() => props.sponsors.map((s) => s.name ?? s))

const pageUrl = computed(
  () => `https://meta.wikimedia.org/wiki/Lingua_Libre/Supports#${encodeURIComponent(props.project.id ?? '')}`,
)

const formatAmount = (n) =>
  new Intl.NumberFormat('en', { style: 'currency', currency: props.currency, maximumFractionDigits: 0 }).format(n)

const budgetLabel = computed(() => {
  const { budgetEUR, budget } = props.project
  const value = budgetEUR ?? budget
  return typeof value === 'number' ? formatAmount(value) : '—'
})
</script>

<style scoped>
/* Corner-bracket card: four L-shaped corners drawn with gradients over a faint border. */
.project-card {
  --bracket-color: var(--color-progressive);
  --bracket-size: 14px;
  --bracket-width: 2px;
  position: relative;
  padding: 1.25rem;
  background-color: var(--color-surface-muted);
  border: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent);
  box-shadow: var(--shadow);
  background-image:
    linear-gradient(var(--bracket-color), var(--bracket-color)),
    linear-gradient(var(--bracket-color), var(--bracket-color)),
    linear-gradient(var(--bracket-color), var(--bracket-color)),
    linear-gradient(var(--bracket-color), var(--bracket-color)),
    linear-gradient(var(--bracket-color), var(--bracket-color)),
    linear-gradient(var(--bracket-color), var(--bracket-color)),
    linear-gradient(var(--bracket-color), var(--bracket-color)),
    linear-gradient(var(--bracket-color), var(--bracket-color));
  background-repeat: no-repeat;
  background-size:
    var(--bracket-size) var(--bracket-width), var(--bracket-width) var(--bracket-size),
    var(--bracket-size) var(--bracket-width), var(--bracket-width) var(--bracket-size),
    var(--bracket-size) var(--bracket-width), var(--bracket-width) var(--bracket-size),
    var(--bracket-size) var(--bracket-width), var(--bracket-width) var(--bracket-size);
  background-position:
    top left, top left,
    top right, top right,
    bottom left, bottom left,
    bottom right, bottom right;
  transition: background-size 0.2s ease;
}
.project-card:hover {
  --bracket-size: 28px;
}
h3 {
  margin: 0;
  font-size: 1.05rem;
}
.meta {
  margin: 0.25rem 0 0.75rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}
.figures {
  display: flex;
  gap: 1.5rem;
  margin: 0 0 0.75rem;
}
dt {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}
dd {
  margin: 0;
  font-weight: 600;
}
.team {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.85rem;
}
.team li {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.2rem 0;
}
.name {
  font-weight: 600;
}
.tasks {
  color: var(--color-text-secondary);
}
</style>
