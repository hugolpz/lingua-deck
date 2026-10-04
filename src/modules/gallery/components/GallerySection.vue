<template>
  <div class="max-w-desktop mx-auto">
    <section class="mb-16">
      
      <!-- Section Heading -->
      <div class="flex flex-wrap">
        <h2 class="flex items-center text-3xl my-4"
            :id="'threshold-'+meaningfulNumber(threshold)">
          {{ $t('gallery-section-threshold', { threshold: meaningfulNumber(threshold) }) }}
          <span class="count ml-2">({{ sectionLanguages.length }})</span>
        </h2>
      </div>

      <!-- Description -->
      <div class="mb-4">
        <p v-if="sectionLanguages.length > 0" class="mb-4">
          <i v-html="$t('gallery-section-description-activated')"></i>
        </p>
        <p v-else class="mb-4">
          <i v-html="$t('gallery-section-description-empty')"></i>
        </p>
      </div>

      <!-- Language Cards Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8 mb-4">
        <GalleryCard
          v-for="language in sectionLanguages"
          :key="language.iso"
          :language="language"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import GalleryCard from '@/modules/gallery/components/GalleryCard.vue';

const props = defineProps({
  threshold: {
    type: Number,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  thresholds: {
    type: Array,
    required: true
  },
  filteredLanguages: {
    type: Array,
    required: true
  }
});

const meaningfulNumber = (num, suffixType='short', zero=null) => {
  let na, k, M;
  suffixType == 'shorter' || suffixType == 'short' ? (na='n.a.', k='k', M='M')
    : suffixType == 'long' ? (na='Undocumented', k=' thousands', M=' millions')
    : (na='', k=',000', M=',000,000');
  if(zero) { na = zero }
  
  const numStr = 
    num == undefined ? ''+na
    : num == 0 ? 0
    : num < 1000 ? num
    : num < 10000 && suffixType != 'shorter' ? num
    : num < 100000 ? (Math.round(num / 100)/10) + k
    : num < 1000000 ? (Math.round(num / 1000)) + k
    : num < 20000000 ? (Math.round(num / 100000)/10) + M
    : num < 200000000 ? (Math.round(num / 1000000)) + M
    : (Math.round(num / 10000000)*10) + M;
  return numStr;
};

const sectionLanguages = computed(() => {
  return props.filteredLanguages.filter(language => {
    const upperThreshold = props.thresholds[props.index - 1] || 100000000;
    const lowerThreshold = props.thresholds[props.index];
    return upperThreshold > Number(language.records) && Number(language.records) >= lowerThreshold;
  });
});
</script>

<style scoped>
.text-progressive {
  color: var(--color-progressive);
}

.max-w-desktop {
  max-width: 76rem;
}

/* Apply styles to links and code in v-html content */
:deep(a) {
  color: var(--color-progressive);
  text-decoration: underline;
}

:deep(a:hover) {
  color: var(--color-progressive);
}

:deep(code) {
  white-space: nowrap;
  background-color: var(--color-surface-muted);
  padding: 0 0.25rem;
  border-radius: 0.25rem;
}
</style>
