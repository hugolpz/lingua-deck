<template>
  <div>
    <h2 class="text-xl font-bold">{{ $t('dictionary-header') }}</h2>

    <!-- Category index (no listPath) -->
    <div v-if="categoryPages.length > 0" class="card p-4 mt-6">
      <p class="text-sm text-muted mb-4">{{ categoryPages.length }} dictionaries found</p>
      <ul class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <li v-for="title in categoryPages" :key="title" class="border border-line bg-surface-muted px-3 py-2 hover:bg-progressive-subtle">
          <a :href="pageHref(title)" class="block text-sm font-medium">
            {{ shortenPageTitle(title) }}
          </a>
        </li>
      </ul>
    </div>

    <!-- Search field -->
    <div v-if="dictionaryEntries.length > 0" class="card p-4 mt-4 mb-6">
      <input
        v-model="searchQuery"
        type="search"
        class="field"
        placeholder="Search words and definitions..."
        aria-label="Search words and definitions"
      />
      <p v-if="searchQuery" class="text-sm text-secondary mt-2">
        Showing {{ filteredDictionaryEntries.length }} of {{ dictionaryEntries.length }} entries
      </p>
    </div>
    
    <!-- Dictionary entries display -->
    <div v-if="dictionaryEntries.length > 0" class="card p-4 mt-6 mb-8">
      <div class="flex items-center gap-2 mb-4">
        <h3 id="" class="text-lg font-semibold m-0">Dictionary: {{ listName }} ({{ filteredDictionaryEntries.length }} entries)</h3>
        <a :href="`https://commons.wikimedia.org/w/index.php?title=Commons:Lingua_Libre/${listName}&veaction=edit&editintro=Commons:Lingua_Libre/Dictionary/Editintro`" target="_blank" rel="noopener" class="text-muted hover:text-progressive flex items-center" title="Edit this list on Wikimedia Commons">
          <AppIcon name="pencil" />
        </a>
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 max-h-[600px] overflow-y-auto">
        <div name="entries-list" v-for="(entry, index) in filteredDictionaryEntries" :key="entry.word + index" class="card card-hover p-4">
          <div class="flex items-start justify-between">
            <audio class="hidden" :src="entry.audioUrl"></audio>
            <div v-if="entry.audioUrl" class="ml-2">
              <audio :ref="el => { audioElements[`dict-${entry.word}-${index}`] = el }" class="hidden" :src="entry.audioUrl" :id="'audio' + entry.word"></audio>
              <div class="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-progressive-subtle transition-transform hover:scale-105" @click="playAudio(entry.word, index)">
                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-progressive text-surface">
                  <AppIcon name="play" />
                </div>
              </div>
            </div>
            <div class="item-lexicology flex-1 pl-6">
              <span class="text-lg font-semibold">{{ entry.word }}</span>
              <span v-if="entry.phon" class="text-sm text-secondary mx-2">[{{ entry.phon }}]</span>
              <span v-if="entry.partOfSpeech" class="text-xs text-progressive mx-2">{{ entry.partOfSpeech }}</span>
              <span class="text-sm ml-2" :class="{ 'ml-0': !entry.partOfSpeech && !entry.phon }">{{ entry.definition }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Raw list content display (collapsible) -->
    <div v-if="listContent && dictionaryEntries.length === 0" class="card p-4 mt-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">Raw Content: {{ listName }}</h3>
      <div class="bg-surface-muted p-4">
        <pre class="whitespace-pre-wrap text-sm font-mono max-h-[300px] overflow-y-auto">{{ listContent }}</pre>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="mt-6 bg-surface-muted p-4">
      <p>Loading dictionary text, then looking for shared audios...</p>
    </div>

    <!-- No results message -->
    <div v-if="!isLoading && dictionaryEntries.length === 0 && !listContent && categoryPages.length === 0" class="no-results mt-6">
      <p>No dictionary entries found.</p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import languagesByIso from '@/data/languages-by-iso.json'

const { t, tm } = useI18n()
const audioElements = reactive({})
const recordings = ref([])
const isLoading = ref(true)
const { locale } = useI18n()
const currentLanguageIso = computed(() => locale.value)
const route = useRoute()
const router = useRouter()
const listContent = ref('')
const dictionaryEntries = ref([])
const searchQuery = ref(route.query.search || '')
const categoryPages = ref([])

// Computed property for the list name from route params
const listName = computed(() => {
  const listPath = route.params.listPath;
  return listPath ? listPath.join('/') : '';
})

// Computed property for language ISO code from route params
const languageIso = computed(() => {
  const listPath = route.params.listPath; // ex: [ "List", "Cmn", "Swadesh" ] or [ "List:Cmn", "Swadesh" ]

  if (listPath && listPath.length > 0) {
    // Normalize both "List:Cmn/..." and "List/Cmn/..." to the same format, then split
    const segments = listPath.join('/').replace('List:', 'List/').split('/');
    const iso = segments[1] ? segments[1].toLowerCase() : null;
    console.log(`Extracted language ISO from route: ${iso}`);
    return iso || 'cmn';
  }
  return 'cmn';
})

// Computed property for QID (from query param or derived from language ISO)
// Note: for languages without ISO, the Qid query param is used.
const qid = computed(() => {
  if (route.query.qid) {
    return route.query.qid;
  }
  const iso = languageIso.value;
  return (iso && languagesByIso[iso]) ? languagesByIso[iso].value : 'Q9192';
})

// Computed property for username (from query param)
const username = computed(() => {
  return route.query.username || null;
})

// Computed property for locutor (from query param)
const locutor = computed(() => {
  return route.query.locutor || null;
})

watch(searchQuery, (newQuery) => {
  router.replace({
    query: { ...route.query, search: newQuery || undefined }
  })
})

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
    const matchesPartOfSpeech = entry.partOfSpeech && entry.partOfSpeech.toLowerCase().includes(query)
    
    return matchesWord || matchesDefinition || matchesPhon || matchesPartOfSpeech
  })
})

/***************************************************************** */
/* Category index (no listPath) ********************************** */
var fetchCategoryMembers = async function() {
    const url = 'https://commons.wikimedia.org/w/api.php';
    const params = {
        action: 'query',
        list: 'categorymembers',
        cmtitle: 'Category:Lingua_Libre_dictionary',
        cmnamespace: 4, // Commons/Project namespace
        cmlimit: 500,
        format: 'json',
        origin: '*'
    };
    const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
    try {
        const response = await fetch(`${url}?${queryString}`);
        const data = await response.json();
        if (data.query && data.query.categorymembers) {
            return data.query.categorymembers.map(m => m.title);
        }
        return [];
    } catch (error) {
        console.error('Error fetching category members:', error);
        return [];
    }
};

// Convert "Commons:Lingua Libre/List/Cmn/Dictionary" -> short "Cmn/Dictionary" and href "./List/Cmn/Dictionary"
var shortenPageTitle = function(title) {
    // Strip prefix "Commons:Lingua Libre/List/" (also handle underscore variant)
    const stripped = title.replace(/^Commons:Lingua[_ ]Libre\/List\//, '');
    return stripped;
};
var pageHref = function(title) {
    const stripped = title.replace(/^Commons:Lingua[_ ]Libre\//, '');
    return '/dictionary/' + stripped;
};

/***************************************************************** */
/* Toolbox recordings metadata *********************************** */
var dictionaryWikipageURL = function(pageName) {
    const url = `https://commons.wikimedia.org/w/api.php`;
    const params = {
        action: 'query',
        format: 'json',
        titles: 'Commons:Lingua Libre/'+pageName, // to do: move to case insensitive
        prop: 'revisions',
        rvprop: 'content',
        rvslots: 'main',
        redirects: 'true', // follow redirects
        origin: '*' // For CORS
    };
    
    const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
    return `${url}?${queryString}`;

}
// Function to fetch raw content from Lingualibre MediaWiki page
var fetchWikipageContent = async function(pageName) {
    try {
        console.log(`Fetching page content for: ${pageName}`);
        const response = await fetch(dictionaryWikipageURL(pageName));
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
    const lines = content.split('\n')
        .filter(line => line.startsWith('#'));
        
    // Break down the regex for human readability
    const entryRegex = new RegExp([
        '^#\\s*',               // Item sign [Required]: Match starting '#' and optional space
        '(.+?)',                // Group 1 [Required]: Word (lazy match)
        '\\s*(?:→|->|=>)',      // Separator [Required]: '→', and fallback ASCII '->' or '=>'
        '(?:\\s+\\[(.+?)\\])?', // Group 2 [Optional]: Phonetics inside leading brackets '[]', before L2 definition
        '(?:\\s+\\((.+?)\\))?', // Group 3 [Optional]: Part of speech inside leading parenthesis '()', before L2 definition
        '\\s+(.+)$'             // Group 4 [Required]: L2 definition (rest of the line, can contain anything, including brackets or parentheses)
    ].join(''));

    const entries = [];
    for (const line of lines) {
      const match = line.match(entryRegex);
      if (match) {
          const [_, word, phon, partOfSpeech, definition] = match;
          entries.push({ word, 'phon': phon || null, 'partOfSpeech': partOfSpeech || '', definition, audioUrl: null });
      }
    }
    return entries;
};

var findFileURL = function(word, qid, username, locutor) {
    const commonsAPI = 'https://commons.wikimedia.org/w/api.php';
    qid = qid || 'Q9192'; // Remove 'var' to modify the parameter instead of creating new variable
    username = username || null;
    locutor = locutor || null;
    // https://www.mediawiki.org/wiki/Special:MyLanguage/API:Search
    // https://en.wikipedia.org/wiki/Help:Searching#Parameters
        const params = {
            action: 'query',
            list: 'search',
            srnamespace: 6, // File namespace
            //srwhat: 'title',  <-- API disabled
            srlimit: 4, // Get 4 matches to filter through
            srsort: 'relevance', // Sort by relevance
            srsearch: `${username?'intitle:'+username:''} ${locutor?'intitle:'+locutor:''} ${qid?'intitle:'+qid:''} intitle:/(-\|—)${word}\.wav/`,
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
var searchCommonsAudio = async function(word, qid, username = null, locutor = null) {

    var urlSearch = findFileURL(word, qid, username, locutor)
    try {
        console.log(`Searching for audio: ${word} (QID: ${qid}, Username: ${username}, Locutor: ${locutor})`);
        console.log(`Search query for ${word} : ${urlSearch}`);
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
var enhanceEntriesWithAudio = async function(entries, qid = 'Q9192', username = null, locutor = null) {
    console.log(`Enhancing ${entries.length} entries with audio URLs using QID: ${qid}, Username: ${username}, Locutor: ${locutor}...`);
    
    // Process entries in batches to avoid overwhelming the API
    const batchSize = 5;
    const enhancedEntries = [];
    
    for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const batchPromises = batch.map(async (entry) => {
            const audioUrl = await searchCommonsAudio(entry.word, qid, username, locutor);
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
  const listPath = route.params.listPath;
  const listParam = listPath ? listPath.join('/') : null;
  
  if (listParam) {
    console.log(`List parameter found: ${listParam}`);
    console.log(`Using Language ISO: ${languageIso.value}, QID: ${qid.value}, Username: ${username.value}`);
    
    try {
      const content = await fetchWikipageContent(listParam);
      if (content) {
        listContent.value = content;
        console.log('Page content loaded:', content.substring(0, 200) + '...');
        
        // Parse the content into dictionary entries
        const parsedEntries = textToJSON(content);
        console.log(`Parsed ${parsedEntries.length} dictionary entries`);
        
        // Enhance entries with audio URLs from Commons using computed qid and username
        if (parsedEntries.length > 0) {
          const enhancedEntries = await enhanceEntriesWithAudio(parsedEntries, qid.value, username.value, locutor.value);
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
  const listPath = route.params.listPath;
  if (!listPath || listPath.length === 0) {
    // Index mode: list all dictionary pages from the category
    categoryPages.value = await fetchCategoryMembers();
  } else {
    await handleListParameter();
  }
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
