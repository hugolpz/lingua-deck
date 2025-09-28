<template>
  <div class="dictionary-list">
    <h2 class="text-xl font-bold">{{ $t('dictionary-header') }}</h2>
    
    <!-- Search field -->
    <div v-if="dictionaryEntries.length > 0" class="search-section mt-4 mb-6">
      <div class="relative">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search words and definitions..." 
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div class="absolute right-3 top-2.5 text-gray-400">
          <CdxIcon :icon="cdxIconSearch" />
        </div>
      </div>
      <p v-if="searchQuery" class="text-sm text-gray-600 mt-2">
        Showing {{ filteredDictionaryEntries.length }} of {{ dictionaryEntries.length }} entries
      </p>
    </div>
    
    <!-- Dictionary entries display -->
    <div v-if="dictionaryEntries.length > 0" class="dictionary-entries-section mt-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">Dictionary: {{ route.query.list }} ({{ filteredDictionaryEntries.length }} entries)</h3>
      <div class="entries-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div name="entries-list" v-for="(entry, index) in filteredDictionaryEntries" :key="entry.word + index" class="entry-card bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div class="flex items-start justify-between">
            <audio class="hidden" :src="entry.audioUrl"></audio>
            <div v-if="entry.audioUrl" class="ml-2">
              <audio :ref="el => { audioElements[`dict-${entry.word}-${index}`] = el }" class="hidden" :src="entry.audioUrl" :id="'audio' + entry.word"></audio>
              <div class="item-play bg-primary-blue bg-opacity-15 cursor-pointer" @click="playAudio(entry.word, index)">
                <div class="play-button bg-primary-blue flex items-center justify-center">
                  <CdxIcon :icon="cdxIconPlay" class="invert" />
                </div>
              </div>
            </div>
            <div class="item-lexicology flex-1 pl-6">
              <span class="text-lg font-semibold text-gray-800">{{ entry.word }}</span>
              <span v-if="entry.phon" class="text-sm text-gray-600 mx-2">[{{ entry.phon }}]</span>
              <span class="text-xs text-blue-600 mx-2">{{ entry.partOfSpeech }}</span>
              <span class="text-sm text-gray-700 ml-2">{{ entry.definition }}</span>
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
      <p>Loading dictionary text, then looking for shared audios...</p>
    </div>

    <!-- No results message -->
    <div v-if="!isLoading && dictionaryEntries.length === 0 && !listContent" class="no-results mt-6">
      <p>No dictionary entries found.</p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { CdxIcon } from '@wikimedia/codex'
import { cdxIconPlay, cdxIconLanguage, cdxIconGlobe, cdxIconUserAvatar, cdxIconSearch } from '@wikimedia/codex-icons'
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
const searchQuery = ref('')

// Computed property to filter dictionary entries
const filteredDictionaryEntries = computed(() => {
  if (!searchQuery.value.trim()) {
    return dictionaryEntries.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return dictionaryEntries.value.filter(entry => {
    const matchesWord = entry.word.toLowerCase().includes(query)
    const matchesDefinition = entry.definition.toLowerCase().includes(query)
    const matchesPhon = entry.phon && entry.phon.toLowerCase().includes(query)
    const matchesPartOfSpeech = entry.partOfSpeech.toLowerCase().includes(query)
    
    return matchesWord || matchesDefinition || matchesPhon || matchesPartOfSpeech
  })
})

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
            const match = line.match(/^#\s*(.+?)\s*→\s*(?:\s*\[(.+?)\])?\s+\((.+?)\)\s+(.+)$/);
            if (match) {
                const [_, word, phon, partOfSpeech, definition] = match;
                entries.push({ word, 'phon': phon || null, partOfSpeech, definition, audioUrl: null });
            }
        }
    }
    return entries;
};

var findFileURL = function(word, qid, username) {
    const commonsAPI = 'https://commons.wikimedia.org/w/api.php';
    var qid = qid || 'Q9192'; // Lingua Libre
    var username = username || null; // My username on Commons
// https://www.mediawiki.org/wiki/Special:MyLanguage/API:Search
// https://en.wikipedia.org/wiki/Help:Searching#Parameters
    const params = {
        action: 'query',
        list: 'search',
        srnamespace: 6, // File namespace
        //srwhat: 'title',  <-- API disabled
        srlimit: 4, // Get 4 matches to filter through
        srsort: 'relevance', // Sort by relevance
        srsearch: `${username?'intitle:'+username:''} ${qid?'intitle:'+qid:''} intitle:/(-\|—)${word}\.wav/`,
        format: 'json',
        origin: '*' // Needed for CORS
    };
    
    const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
    return `${commonsAPI}?${queryString}`;
  }
var dashCounter = function(fileName) {
    return (fileName.match(/-/g) || []).length;
}
// Function to search for audio file on Commons for a specific word
var searchCommonsAudio = async function(word, qid = 'Q9192', username = null) {

    var urlSearch = findFileURL(word, qid, username)
    try {
        console.log(`Searching for audio: ${word} (QID: ${qid}, Username: ${username})`);
        console.log(`Searching query for ${word} : ${urlSearch}`);
        const response = await fetch(urlSearch);
        const data = await response.json();
        
        if (data.query && data.query.search && data.query.search.length > 0) {
            // Filter results by number of dashes (≤3)
            const validResults = data.query.search.filter(result => {
                const fileName = result.title.replace('File:', '');
                const fileSeriesName = fileName
                    .replace(word+'.wav','')   // ignores dash word
                    .replace(/Q\d+\s*\(.+?\)/,'');   // ignores dash in `Q123456 (iso-subtag)`
                const dashCount = dashCounter(fileSeriesName);
                console.log(`File: ${fileName}, FileSeries: ${fileSeriesName}, Dash count: ${dashCount}`);
                return dashCount <= 3;
            });
            
            if (validResults.length > 0) {
                const bestMatch = validResults[0];
                const fileName = bestMatch.title.replace('File:', '');
                const audioUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
                console.log(`Found valid audio for ${word}: ${fileName} (${(fileName.match(/-/g) || []).length} dashes)`);
                return audioUrl;
            } else {
                console.log(`No valid audio found for ${word} (all results had >3 dashes)`);
                return null;
            }
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
var enhanceEntriesWithAudio = async function(entries, qid = 'Q9192', username = null) {
    console.log(`Enhancing ${entries.length} entries with audio URLs using QID: ${qid}, Username: ${username}...`);
    
    // Process entries in batches to avoid overwhelming the API
    const batchSize = 5;
    const enhancedEntries = [];
    
    for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const batchPromises = batch.map(async (entry) => {
            const audioUrl = await searchCommonsAudio(entry.word, qid, username);
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
    
    // Get qid and username from URL parameters
    const qid = route.query.qid || 'Q9192'; // Default to Lingua Libre
    const username = route.query.username || null; // Default to null
    
    console.log(`Using QID: ${qid}, Username: ${username}`);
    
    try {
      const content = await fetchLinguaLibrePageContent(listParam);
      if (content) {
        listContent.value = content;
        console.log('Page content loaded:', content.substring(0, 200) + '...');
        
        // Parse the content into dictionary entries
        const parsedEntries = textToJSON(content);
        console.log(`Parsed ${parsedEntries.length} dictionary entries`);
        
        // Enhance entries with audio URLs from Commons using URL parameters
        if (parsedEntries.length > 0) {
          const enhancedEntries = await enhanceEntriesWithAudio(parsedEntries, qid, username);
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

const playAudio = (word, index) => {
  const audioKey = `dict-${word}-${index}`
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
  width: 2.5rem; /* Fixed width */
  height: 2.5rem; /* Fixed height */
}
.play-button {
  border-radius: 50%;
  width: 2rem; /* Using rem instead of em */
  height: 2rem;
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
.search-section {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
}
.search-section input:focus {
  outline: none;
}
</style>
