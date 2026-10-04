<template>
  <nav class="flex flex-wrap items-baseline gap-x-2 text-sm" aria-label="Breadcrumb">
    <template v-for="(item, i) in crumbs" :key="i">
      <span v-if="i > 0" aria-hidden="true">›</span>
      <router-link v-if="item.link" :id="item.id" :to="item.to" :class="{ 'font-mono': item.mono }">{{ item.label }}</router-link>
      <span v-else :id="item.id" class="font-semibold" :class="{ 'font-mono': item.mono }" :aria-current="item.current ? 'page' : undefined">{{ item.label }}</span>
    </template>
    <button
      type="button"
      class="inline-flex cursor-pointer items-center border-0 bg-transparent p-0 text-secondary hover:text-inherit"
      :title="shared ? 'Link copied' : shareLabel"
      :aria-label="shareLabel"
      @click="share"
    >
      <AppIcon :name="shared ? 'check' : 'share'" :size="14" />
    </button>
    <span v-if="$slots.default" class="text-secondary">·</span>
    <slot />
  </nav>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
  /** Path: [{ label, to?, mono?, id? }]. A crumb whose `to` is the current page is plain text. */
  items: { type: Array, required: true },
  /** URL or route location to share. Defaults to the current page. */
  shareUrl: { type: [String, Object], default: null },
  shareLabel: { type: String, default: 'Share this page' },
  shareTitle: { type: String, default: '' },
})

const route = useRoute()
const router = useRouter()

const crumbs = computed(() =>
  props.items.map((item, i) => {
    const target = item.to ? router.resolve(item.to) : null
    const isCurrent = i === props.items.length - 1 || (target && target.fullPath === route.fullPath)
    return { ...item, link: !!target && !isCurrent, current: isCurrent }
  }),
)

const shared = ref(false)
const share = async () => {
  const href = router.resolve(props.shareUrl ?? route.fullPath).href
  const url = new URL(href, window.location.origin).href
  try {
    if (navigator.share) {
      await navigator.share({ title: props.shareTitle || document.title, url })
      return
    }
    await navigator.clipboard.writeText(url)
    shared.value = true
    setTimeout(() => (shared.value = false), 2000)
  } catch {
    // share sheet dismissed or clipboard unavailable: nothing to do
  }
}
</script>
