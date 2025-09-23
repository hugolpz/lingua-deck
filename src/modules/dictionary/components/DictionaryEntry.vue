<template>
  <div class="last-recordings-sample">
    <h2 class="text-xl font-bold">{{ $t('dictionary-header') }}</h2>
    
    <!-- Dictionary entries display -->
    <div v-if="dictionaryEntries.length > 0" class="dictionary-entries-section mt-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">Dictionary: {{ route.query.list }} ({{ dictionaryEntries.length }} entries)</h3>
      <div class="entries-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="(entry, index) in dictionaryEntries" :key="index" class="entry-card bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div class="flex items-start justify-between">
            <audio class="hidden" :src="entry.audioUrl"></audio>
            <div class="flex-1">
              <h4 class="text-lg font-semibold text-gray-800">{{ entry.word }}</h4>
              <p class="text-sm text-gray-600 mb-1">{{ entry.pinyin }}</p>
              <p class="text-xs text-blue-600 mb-2">{{ entry.partOfSpeech }}</p>
              <p class="text-sm text-gray-700">{{ entry.definition }}</p>
            </div>
            <div v-if="entry.audioUrl" class="ml-2">
              <audio :ref="el => { audioElements[`dict-${index}`] = el }" class="hidden" :src="entry.audioUrl"></audio>
              <div class="item-play bg-primary-blue bg-opacity-15 cursor-pointer" @click="playAudio(index)">
                <div class="play-button bg-primary-blue flex items-center justify-center">
                  <CdxIcon :icon="cdxIconPlay" class="invert" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Raw list content display (collapsible) -->
    <div v-if="listContent && dictionaryEntries.length === 0" class="list-content-section mt-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">Raw Content: {{ route.query.list }}</h3>
      <div class="bg-gray-100 p-4 rounded-lg">
        <pre class="whitespace-pre-wrap text-sm">{{ listContent }}</pre>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="loading mt-6">
      <p>Loading recent recordings...</p>
    </div>

    <!-- No results message -->
    <div v-if="!isLoading && recordings.length === 0" class="no-results mt-6">
      <p>No recordings found.</p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { CdxIcon } from '@wikimedia/codex'
import { cdxIconPlay, cdxIconLanguage, cdxIconGlobe, cdxIconUserAvatar } from '@wikimedia/codex-icons'
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

const { t, tm } = useI18n()
const audioElements = reactive({})
const recordings = ref([])
const isLoading = ref(true)
const { locale } = useI18n()
const currentLanguageIso = computed(() => locale.value)
const route = useRoute()
const listContent = ref('')
const dictionaryEntries = ref([])

/***************************************************************** */
/* Toolbox recordings metadata *********************************** */
var dictionaryURL = function(pageName) {
    const url = `https://lingualibre.org/api.php`;
    const params = {
        action: 'query',
        format: 'json',
        titles: pageName,
        prop: 'revisions',
        rvprop: 'content',
        rvslots: 'main',
        origin: '*' // For CORS
    };
    
    const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
    return `${url}?${queryString}`;

}
// Function to fetch raw content from Lingualibre MediaWiki page
var fetchLinguaLibrePageContent = async function(pageName) {
    try {
        console.log(`Fetching page content for: ${pageName}`);
        const response = await fetch(dictionaryURL(pageName));
        const data = await response.json();
        
        if (data.query && data.query.pages) {
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            const page = pages[pageId];
            
            if (page.revisions && page.revisions[0] && page.revisions[0].slots && page.revisions[0].slots.main) {
                const content = page.revisions[0].slots.main['*'];
                console.log(`Successfully fetched content for ${pageName}`);
                return content;
            } else {
                console.warn(`No content found for page: ${pageName}`);
                return null;
            }
        } else {
            console.warn(`No page data found for: ${pageName}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching page content for ${pageName}:`, error);
        return null;
    }
};

var textToJSON = function(content) {
    if (!content) return [];
    const lines = content.split('\n');
    const entries = [];
    for (const line of lines) {
        if (line.startsWith('#')) {
            const match = line.match(/^#\s*(.+?)\s*→\s*(.+?):\s*(.+?)\.\s*(.+)$/);
            if (match) {
                const [_, word, pinyin, partOfSpeech, definition] = match;
                entries.push({ word, pinyin, partOfSpeech, definition, audioUrl: null });
            }
        }
    }
    return entries;
};

// Function to search for audio file on Commons for a specific word
var searchCommonsAudio = async function(word) {
    const url = 'https://commons.wikimedia.org/w/api.php';
    const params = {
        action: 'query',
        srnamespace: 6, // File namespace
        srlimit: 1, // Get only the first match
        list: 'search',
        srsearch: `intitle:LL intitle:Q9192 intitle:${word}.wav`,
        format: 'json',
        origin: '*' // Needed for CORS
    };
    
    const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
    
    try {
        console.log(`Searching for audio: ${word}`);
        const response = await fetch(`${url}?${queryString}`);
        const data = await response.json();
        
        if (data.query && data.query.search && data.query.search.length > 0) {
            const firstMatch = data.query.search[0];
            const fileName = firstMatch.title.replace('File:', '');
            const audioUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
            console.log(`Found audio for ${word}: ${audioUrl}`);
            return audioUrl;
        } else {
            console.log(`No audio found for: ${word}`);
            return null;
        }
    } catch (error) {
        console.error(`Error searching audio for ${word}:`, error);
        return null;
    }
};

// Function to enhance entries with audio URLs
var enhanceEntriesWithAudio = async function(entries) {
    console.log(`Enhancing ${entries.length} entries with audio URLs...`);
    
    // Process entries in batches to avoid overwhelming the API
    const batchSize = 5;
    const enhancedEntries = [];
    
    for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const batchPromises = batch.map(async (entry) => {
            const audioUrl = await searchCommonsAudio(entry.word);
            return { ...entry, audioUrl };
        });
        
        const batchResults = await Promise.all(batchPromises);
        enhancedEntries.push(...batchResults);
        
        // Small delay between batches to be respectful to the API
        if (i + batchSize < entries.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    const foundAudioCount = enhancedEntries.filter(entry => entry.audioUrl).length;
    console.log(`Enhanced entries complete. Found audio for ${foundAudioCount}/${entries.length} entries.`);
    
    return enhancedEntries;
};




/***************************************************************** */
/* Toolbox last recordings *************************************** */
// Function to create URL for fetching last files with specific parameters


// Function to handle list parameter and fetch page content
const handleListParameter = async () => {
  const listParam = route.query.list;
  if (listParam) {
    console.log(`List parameter found: ${listParam}`);
    try {
      const content = await fetchLinguaLibrePageContent(listParam);
      if (content) {
        listContent.value = content;
        console.log('Page content loaded:', content.substring(0, 200) + '...');
        
        // Parse the content into dictionary entries
        const parsedEntries = textToJSON(content);
        console.log(`Parsed ${parsedEntries.length} dictionary entries`);
        
        // Enhance entries with audio URLs from Commons
        if (parsedEntries.length > 0) {
          const enhancedEntries = await enhanceEntriesWithAudio(parsedEntries);
          dictionaryEntries.value = enhancedEntries;
          console.log('Dictionary entries enhanced with audio URLs');
        }
      }
    } catch (error) {
      console.error('Error handling list parameter:', error);
    }
  }
};


// Call the initialization function when component is mounted
onMounted(async () => {
  await handleListParameter();
  isLoading.value = false;
});

const playAudio = (index) => {
  const audioKey = `dict-${index}`
  const audio = audioElements[audioKey]
  if (audio) {
    // Stop all other audio elements first
    Object.values(audioElements).forEach(element => {
      if (element && element !== audio) {
        element.pause()
        element.currentTime = 0
      }
    })
    
    // If this audio is playing, pause it
    if (!audio.paused) {
      audio.pause()
      audio.currentTime = 0
    } else {
      // Otherwise play it
      audio.play()
    }
  }
}

const playDictionaryAudio = (index) => {
  const audioKey = `dict-${index}`
  const audio = audioElements[audioKey]
  if (audio) {
    // Stop all other audio elements first
    Object.values(audioElements).forEach(element => {
      if (element && element !== audio) {
        element.pause()
        element.currentTime = 0
      }
    })
    
    // If this audio is playing, pause it
    if (!audio.paused) {
      audio.pause()
      audio.currentTime = 0
    } else {
      // Otherwise play it
      audio.play()
    }
  }
}
</script>

<style scoped>
.hidden {
  display: none;
}
.item-play {
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  aspect-ratio: 1; /* Make it a perfect circle */
  padding: 0.75rem; /* Slightly larger padding */
  width: 3.5rem; /* Fixed width */
  height: 3.5rem; /* Fixed height */
}
.play-button {
  border-radius: 50%;
  width: 2.5rem; /* Using rem instead of em */
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0; /* Prevent flex container from shrinking it */
  box-sizing: border-box;
}
.item-play:hover {
  transform: scale(1.05);
}
.loading {
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 0.5rem;
}
.list-content-section {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  background-color: #ffffff;
}
.list-content-section pre {
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  color: #374151;
}
.dictionary-entries-section {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  background-color: #ffffff;
}
.entry-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.entry-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.entries-grid {
  max-height: 600px;
  overflow-y: auto;
}
</style>
