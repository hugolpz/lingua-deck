<template>
  <div class="page">
    <h1 class="mb-6 text-3xl">Lingua Deck</h1>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <router-link
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="corner-card block p-4 text-base hover:no-underline"
      >
        <span class="block font-bold text-progressive">{{ link.title }}</span>
        <span class="block text-sm text-secondary">{{ link.description }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { links } from '@/router/links'
</script>
