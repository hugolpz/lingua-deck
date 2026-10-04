<template>
  <div class="flex min-h-screen flex-col">
    <header class="sticky top-0 z-10 border-b border-line bg-surface">
      <nav class="mx-auto flex max-w-screen-xl flex-wrap items-center gap-x-1 gap-y-1 px-4 py-2 md:px-6">
        <router-link to="/" class="mr-auto text-lg font-bold text-base hover:no-underline">
          Lingua Deck
        </router-link>
        <router-link
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="px-2 py-1 text-sm font-semibold text-secondary hover:text-base hover:no-underline md:px-3"
          active-class="!text-progressive"
        >
          {{ link.title }}
        </router-link>
        <button class="btn btn-icon" aria-label="Toggle dark theme" @click="toggleTheme">
          <AppIcon :name="isDark ? 'sun' : 'moon'" />
        </button>
      </nav>
    </header>
    <main class="flex-1">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import AppFooter from '@/components/AppFooter.vue'
import { applyTheme, currentTheme } from '@/plugins/theme'
import { links } from '@/router/links'

const isDark = ref(currentTheme() === 'dark')
const toggleTheme = () => {
  applyTheme(isDark.value ? 'light' : 'dark')
  isDark.value = !isDark.value
}
</script>
