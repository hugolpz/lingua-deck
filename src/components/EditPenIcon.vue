<template>
  <span class="edit-pen" :class="`edits-${state}`" :title="title">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <g>
        <path class="pen-eraser" d="m16.77 8 1.94-2a1 1 0 000-1.41l-3.34-3.3a1 1 0 00-1.41 0L12 3.23z"></path>
        <path class="pen-body" d="M1 14.25V19h4.75l9.96-9.96-4.75-4.75z"></path>
      </g>
    </svg>
  </span>
</template>

<script setup>
// Wikimedia-style edit pen. `needed` pulses to invite an edit (static under reduced motion).
defineProps({
  state: {
    type: String,
    default: 'no',
    validator: (v) => ['welcome', 'no', 'needed'].includes(v),
  },
  title: { type: String, default: '' },
})
</script>

<style scoped>
.edit-pen {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
}

.edits-welcome .pen-eraser,
.edits-welcome .pen-body,
.edits-no .pen-eraser,
.edits-no .pen-body {
  fill: var(--color-text);
}

.edits-needed {
  --_tint: color-mix(in srgb, var(--color-destructive) 13%, transparent);
  animation: icon-edit-effect 10s infinite;
}

.edits-needed .pen-eraser {
  fill: var(--color-destructive);
}

.edits-needed .pen-body {
  fill: var(--wmf-yellow);
}

@keyframes icon-edit-effect {
  0%,
  60%,
  100% {
    background-color: transparent;
    border: 2px solid transparent;
  }

  15%,
  45% {
    background-color: var(--_tint);
  }
}

@media (prefers-reduced-motion: reduce) {
  .edits-needed {
    animation: none;
    border: 2px solid var(--color-destructive);
    background-color: var(--_tint);
  }
}
</style>
