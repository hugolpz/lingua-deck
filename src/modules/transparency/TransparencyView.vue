<template>
  <div class="page">
    <h1 class="mb-6 text-3xl">Transparency</h1>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <router-link
        v-for="card in cards"
        :key="card.to"
        :to="card.to"
        class="corner-card block p-4 text-base hover:no-underline"
      >
        <span class="block font-bold text-progressive">{{ card.title }}</span>
        <span class="block text-sm text-secondary">{{ card.description }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
const cards = [
  { title: 'Lingua Libre past missions', to: `https://meta.wikimedia.org/wiki/Lingua_Libre/Supports`, description: 'Community curated reports of past sponsors, grants, projects and freelancers' },
  { title: 'Lingua Libre past budgets ', to: '/transparency/lingualibre', description: 'Visual rendeding of past sponsors, grants, projects and freelancers and their funding flow' },
  { title: 'Wikimedia France speding', to: '/transparency/wmfr?project=lingua', description: 'Spendings recorded by the chapter' },
]
</script>
