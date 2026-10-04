<template>
  <div class="kpi-card">
    <h3>
      <AppIcon v-if="icon" :name="icon" :size="16" />
      {{ title }}
    </h3>
    <div class="value" :class="valueClass">
      <slot>{{ typeof value === 'number' ? value.toLocaleString() : value }}</slot>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '@/components/AppIcon.vue'

defineProps({
  title: { type: String, required: true },
  value: { type: [Number, String], default: '' },
  /** Optional AppIcon name. */
  icon: { type: String, default: '' },
  /** Extra class(es) on the value, e.g. `positive` / `negative`. */
  valueClass: { type: [String, Object, Array], default: '' },
})
</script>

<style scoped>
.kpi-card {
  padding: 1.5rem;
  background-color: var(--color-surface-muted);
  border-radius: 8px;
  box-shadow: var(--shadow);
  text-align: center;
}
.kpi-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: var(--color-text-secondary);
}
.value {
  font-size: 1.75rem;
  font-weight: bold;
}
.value.positive {
  color: var(--color-success);
}
.value.negative {
  color: var(--color-destructive);
}
</style>
