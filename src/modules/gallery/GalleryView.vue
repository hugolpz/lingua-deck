<template>
  <div id="gallery" class="relative min-h-screen w-full pt-1">
    <main class="flex flex-grow min-h-screen w-full">
      <div class="min-h-full w-full">
        <div class="max-w-desktop mx-auto px-4">
          
          <!-- Top Section -->
          <div class="flex flex-col md:flex-row md:justify-between md:items-center">
            <!-- Page Heading -->
            <h1 id="gallery-title" class="text-4xl md:text-5xl font-medium leading-none mb-2 mt-4 md:mt-6">
              {{ $t('gallery-heading-languages') }} <span class="count">({{ filteredLanguages.filter(language => Number(language.records) >= 0 ).length }})</span>
            </h1>
            
            <!-- Search Input -->
            <div id="languages-filter" class="flex items-center bg-gray-100 border border-gray-300 rounded-full px-4 py-2 mt-4 md:mt-6 md:ml-8 h-fit">
              <input type="text" 
                     :placeholder="$t('gallery-search-placeholder')" 
                     class="bg-transparent border-none outline-none w-full mx-2.5 text-gray-800"
                     v-model="search"
                     @keyup.enter="handleSearch">
              <button type="button" class="p-0" @click="handleSearch">
                <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Gallery Sections -->
          <GallerySection
            v-for="(threshold, index) in thresholds"
            :key="index"
            :threshold="threshold"
            :index="index"
            :thresholds="thresholds"
            :filtered-languages="filteredLanguages"
          />

          <!-- Footer -->
          <div class="mt-16 mb-8">
            <div class="mb-4">
              <p class="mb-4">
                Data from LinguaLibre.org,
                SPARQL2DATA by Hugo Lopez & Elfix,
                Webpage based on <a class="text-link-blue underline hover:text-blue-600" 
                  href="https://commonvoice.mozilla.org/en/languages">Common Voice</a> 
                (<a class="text-link-blue underline hover:text-blue-600"
                  href="https://github.com/common-voice/common-voice/blob/main/LICENSE">MPL 2.0</a>) and Hugo Lopez <a class="text-link-blue underline hover:text-blue-600"
                  href="https://github.com/hugolpz/LanguagesGallery">Vuejs version</a> (<a class="text-link-blue underline hover:text-blue-600"
                  href="https://github.com/common-voice/common-voice/blob/main/LICENSE">MPL 2.0</a>).
                </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import GallerySection from '@/components/GallerySection.vue';

const router = useRouter();
const route = useRoute();

const languages = ref([]);
const thresholds = ref([20000, 3000, 300, 50, 0]);
const search = ref('');

// Search handler
const handleSearch = () => {
  if (search.value) {
    router.push({ path: '/gallery', query: { search: search.value } });
  } else {
    router.push({ path: '/gallery' });
  }
};

// Utility functions
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

const fetchUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  search.value = urlParams.get('search') || '';
};

const filteredLanguages = computed(() => {
  const filterItems = (item) => { 
    const matchEnglish = item.languageLabel ? item.languageLabel.toLowerCase().indexOf(search.value.toLowerCase()) >= 0 : false;
    const matchNative = item.languageLabelNative ? item.languageLabelNative.toLowerCase().indexOf(search.value.toLowerCase()) >= 0 : false;
    return matchEnglish || matchNative;
  };
  return languages.value.filter(filterItems);
});

onMounted(() => {
  fetchUrlParams();
  fetch('https://hugolpz.github.io/Sparql2Data/data/languages-gallery.json')
    .then(response => response.json())
    .then(data => {
      languages.value = data;
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
});
</script>

<style scoped>
.text-link-blue {
  color: #195ebf;
}

.max-w-desktop {
  max-width: 76rem;
}
</style>
