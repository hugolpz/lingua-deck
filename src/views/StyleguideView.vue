<template>
  <div class="page">
    <h1 class="mb-2">Styleguide</h1>
    <p class="prose mb-6">
      Plain Tailwind utilities and a few shared classes, all driven by the toolhub-evolved tokens
      (<code>src/assets/tokens.css</code>, mapped in <code>tailwind.config.js</code>, shared classes in
      <code>src/assets/main.css</code>). Breakpoints: sm 640, md 768, lg 1024, xl 1280.
    </p>

    <h2 class="mb-3">Colors</h2>
    <div class="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      <div v-for="c in colors" :key="c" class="border border-line p-3 text-sm" :class="c.cls">{{ c.name }}</div>
    </div>

    <h2 class="mb-3">Buttons</h2>
    <div class="mb-8 flex flex-wrap gap-2">
      <button class="btn btn-primary">Primary</button>
      <button class="btn">Default</button>
      <button class="btn btn-danger">Danger</button>
      <button class="btn btn-primary btn-sm">Small</button>
      <button class="btn btn-primary btn-lg">Large</button>
      <button class="btn btn-primary btn-icon" aria-label="Play"><AppIcon name="play" /></button>
      <button class="btn" disabled>Disabled</button>
    </div>

    <h2 class="mb-3">Cards</h2>
    <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="card p-4">
        <div class="font-bold">Bordered card</div>
        <p class="text-sm text-secondary">class="card": hairline border and soft shadow.</p>
      </div>
      <a href="#" class="corner-card block p-4 hover:no-underline" @click.prevent>
        <div class="font-bold text-progressive">Corner-bracket card</div>
        <p class="text-sm text-secondary">class="corner-card": toolhub's signature tool card.</p>
      </a>
    </div>

    <h2 class="mb-3">Fields</h2>
    <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
      <input class="field" type="search" placeholder="Search" />
      <select class="field">
        <option>English</option>
        <option>Français</option>
        <option>Español</option>
      </select>
    </div>

    <h2 class="mb-3">Alerts and tags</h2>
    <div class="mb-4 flex flex-col gap-2">
      <div class="alert alert-info">Informational message.</div>
      <div class="alert alert-success">Success message.</div>
      <div class="alert alert-warning">Warning message.</div>
      <div class="alert alert-error">Error message.</div>
    </div>
    <div class="mb-8 flex gap-2">
      <span class="tag tag-progressive">audio</span>
      <span class="tag tag-success">commons</span>
      <span class="tag">+3 more</span>
    </div>

    <h2 class="mb-3">Table</h2>
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr><th>Language</th><th>Recordings</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r[0]"><td>{{ r[0] }}</td><td>{{ r[1] }}</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '@/components/AppIcon.vue'

const colors = [
  { name: 'progressive', cls: 'bg-progressive text-surface' },
  { name: 'success', cls: 'bg-success text-surface' },
  { name: 'destructive', cls: 'bg-destructive text-surface' },
  { name: 'warning', cls: 'bg-warning' },
  { name: 'surface', cls: 'bg-surface' },
  { name: 'surface-muted', cls: 'bg-surface-muted' },
]
const rows = [['French', '120 482'], ['English', '98 211'], ['Basque', '41 007']]
</script>
