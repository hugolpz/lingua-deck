<template>
  <div class="wiki-data-fetcher">
    
    <div class="system-status">
      <div class="status-header">
        <div class="status-badge" :class="{ 'is-loading': status.includes('Fetching') || status.includes('Checking') }">
          <span class="dot"></span>
          {{ status }}
        </div>

        <div id="sources" class="toggle-group">
          <button :class="{ active: activeSource === 'all' }" @click="activeSource = 'all'">All</button>
          <button v-for="(endpoint, key) in API_ENDPOINTS" :key="key" :class="{ active: activeSource === key }" @click="activeSource = key" :title="endpoint.name">
            <img :src="endpoint.logo" :alt="endpoint.name" class="source-logo" />
          </button>
        </div>

        <div id="humans-or-bots" class="toggle-group">
          <button :class="{ active: hideBots }" @click="hideBots = true">Humans only</button>
          <button :class="{ active: !hideBots }" @click="hideBots = false">Include bots</button>
        </div>
      </div>
      <div class="info-callout" v-if="!showLists">
        <strong>Note:</strong> Lists are not included to avoid API limits, as most of our 6000 lists are bot-created.
      </div>
      
      <div v-if="apiLimitReached && missingPagesCount > 0" class="info-callout error">
        <strong>API rate limit reached:</strong> data from {{ missingPagesCount }} wikipages could not be fetch. Please reload this page in 1 hour to continue processing.
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-if="filteredEdits.length > 0" class="dashboard-content">
      <KpiMetricCards :edits="filteredEdits" />

      <EditHistoryTable 
        :edits="filteredEdits" 
        :endpoints="API_ENDPOINTS"
        @filter-user="(u) => { username = u; updateUrl() }"
        @filter-page="(p) => { title = p; updateUrl() }"
      />
      
      <div class="charts-area">
        <ChartTopContributors 
          :edits="filteredEdits" 
          @filter-user="(u) => { username = u; updateUrl() }" 
        />
        <!-- We can add ChartActivityTimeline here later -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import KpiMetricCards from './KpiMetricCards.vue';
import ChartTopContributors from './ChartTopContributors.vue';
import EditHistoryTable from './EditHistoryTable.vue';
import commonsLogo from '../../assets/Commons-logo.svg';
import metaLogo from '../../assets/Wikimedia_Community_Logo.svg';
import gitlabLogo from '../../assets/GitLab_icon.svg';
import githubLogo from '../../assets/Github-desktop-logo-symbol.svg';

const route = useRoute();
const router = useRouter();

const status = ref('Initializing...');
const username = ref(route.query.username || '');
const title = ref(route.query.title || '');
const showLists = ref(!route.query.list === 'false');
const hideBots = ref(true);
const activeSource = ref('all');
const apiLimitReached = ref(false);
const missingPagesCount = ref(0);

const API_ENDPOINTS = {
  commons: {
    api: "https://commons.wikimedia.org/w/api.php", 
    link: "https://commons.wikimedia.org/wiki/",
    logo: commonsLogo,
    name: "Wikimedia Commons"
  },
  meta: {
    api: "https://meta.wikimedia.org/w/api.php", 
    link: "https://meta.wikimedia.org/wiki/",
    logo: metaLogo,
    name: "Meta-Wiki"
  },
  gitlab: {
    api: "https://gitlab.wikimedia.org/api/v4/projects/repos%2FREPOSITORY/repository/commits",
    link: "https://gitlab.wikimedia.org/repos/REPOSITORY/",
    logo: gitlabLogo,
    name: "Gitlab"
  },
  github: {
    api: "https://api.github.com/repos/REPOSITORY/commits", 
    link: "https://github.com/USER/REPOSITORY/commits",
    logo: githubLogo,
    name: "Github"
  },
};

const topPages = ['Help:Lingua Libre', 'Commons:Lingua_Libre', "Lingua Libre"];
const topCategories = ['Category:Lingua Libre'];
const topGitRepos =[
  {
    "repos": "hugolpz/LanguagesGallery",
    "link": "https://github.com/hugolpz/LanguagesGallery/",
    "source": "github",
    "name": "languages-gallery"
  },
  {
    "repos": "wikimedia-france/lingua-libre/operations",
    "link": "https://gitlab.wikimedia.org/repos/wikimedia-france/lingua-libre/operations/",
    "source": "gitlab",
    "name": "operations"
  },
  {
    "repos": "wikimedia-france/lingua-libre/lingua-libre",
    "link": "https://gitlab.wikimedia.org/repos/wikimedia-france/lingua-libre/lingua-libre/",
    "source": "gitlab",
    "name": "lingua-libre"
  },
  {
    "repos": "wikimedia-france/lingua-libre/lingualibre.org",
    "link": "https://gitlab.wikimedia.org/repos/wikimedia-france/lingua-libre/lingualibre.org/",
    "source": "gitlab",
    "name": "lingualibre-org"
  },
  {
    "repos": "hugolpz/Lingualibre-inventory-tool",
    "link": "https://github.com/hugolpz/Lingualibre-inventory-tool/",
    "source": "github",
    "name": "lingualibre-inventory-tool"
  },
  {
    "repos": "hugolpz/NamesOfTheLand",
    "link": "https://github.com/hugolpz/NamesOfTheLand/",
    "source": "github",
    "name": "names-of-the-land"
  },/*
  {
    "repos": "hugolpz/Sparql2Data",
    "link": "https://github.com/hugolpz/Sparql2Data/",
    "source": "github",
    "name": "sparql2data"
  },*/
  {
    "repos": "wikimedia-france/Lingua-Libre",
    "link": "https://github.com/wikimedia-france/Lingua-Libre/",
    "source": "github",
    "name": "lingua-libre-legacy"
  },
  {
    "repos": "lingua-libre/SignIt",
    "link": "https://github.com/lingua-libre/SignIt/",
    "source": "github",
    "name": "sign-it"
  },
  {
    "repos": "lingua-libre/RecordWizard",
    "link": "https://github.com/lingua-libre/RecordWizard/",
    "source": "github",
    "name": "record-wizard"
  },
  {
    "repos": "lingua-libre/BlueLL",
    "link": "https://github.com/lingua-libre/BlueLL/",
    "source": "github",
    "name": "blue-ll"
  },
  {
    "repos": "lingua-libre/LinguaRecorder",
    "link": "https://github.com/lingua-libre/LinguaRecorder/",
    "source": "github",
    "name": "lingua-recorder"
  },
  {
    "repos": "lingua-libre/Lingua-Libre-Bot",
    "link": "https://github.com/lingua-libre/Lingua-Libre-Bot/",
    "source": "github",
    "name": "lingua-libre-bot"
  },
  {
    "repos": "lingua-libre/QueryViz",
    "link": "https://github.com/lingua-libre/QueryViz/",
    "source": "github",
    "name": "query-viz"
  },
  {
    "repos": "lingua-libre/unilex-extended",
    "link": "https://github.com/lingua-libre/unilex-extended/",
    "source": "github",
    "name": "unilex-extended"
  },
  {
    "repos": "lingua-libre/CustomSubtitle",
    "link": "https://github.com/lingua-libre/CustomSubtitle/",
    "source": "github",
    "name": "custom-subtitle"
  },
  {
    "repos": "lingua-libre/Upload2Commons",
    "link": "https://github.com/lingua-libre/Upload2Commons/",
    "source": "github",
    "name": "upload-2-commons"
  },
  {
    "repos": "lingua-libre/CommonsDownloadTool",
    "link": "https://github.com/lingua-libre/CommonsDownloadTool/",
    "source": "github",
    "name": "commons-download-tool"
  },
  {
    "repos": "lingua-libre/operations",
    "link": "https://github.com/lingua-libre/operations/",
    "source": "github",
    "name": "operations-ll"
  },
  {
    "repos": "lingua-libre/LingualibreDownloadToolJS",
    "link": "https://github.com/lingua-libre/LingualibreDownloadToolJS/",
    "source": "github",
    "name": "lingualibre-download-tool-js"
  },
  {
    "repos": "lingua-libre/WikibaseSerializationJavaScript",
    "link": "https://github.com/lingua-libre/WikibaseSerializationJavaScript/",
    "source": "github",
    "name": "wikibase-serialization-js"
  },
  {
    "repos": "lingua-libre/llskin",
    "link": "https://github.com/lingua-libre/llskin/",
    "source": "github",
    "name": "ll-skin"
  }
]


// Making data reactive so components update
let projectWikipages = [];
const projectEdits = ref([]);

const filteredEdits = computed(() => {
  let edits = projectEdits.value;
  
  if (activeSource.value !== 'all') {
    edits = edits.filter((e) => e.source === activeSource.value);
  }

  if (hideBots.value) {
    edits = edits.filter((e) => {
      const lowerAuthor = e.author.toLowerCase();
      // Only keep humans (filter out 'bot' at start or end)
      return !lowerAuthor.startsWith('bot') && !lowerAuthor.endsWith('bot') && !lowerAuthor.startsWith('translatewiki') && !e.title.startsWith('Update output files') ;
    });
  }

  if (username.value) {
    edits = edits.filter((e) => e.author === username.value);
  }
  if (title.value) {
    edits = edits.filter((e) => e.title === title.value);
  }
  return edits;
});

const updateUrl = () => {
  const query = {};
  if (username.value) query.username = username.value;
  if (title.value) query.title = title.value;
  if (!showLists.value) query.list = 'false';
  router.push({ query });
};

const fetchJson = async (params, apiUrl = API_ENDPOINTS.commons.api, returnResponse = false) => {
  // Only append format, origin, and query params for Mediawiki endpoints
  if (apiUrl.includes('api.php') || Object.keys(params).length > 0) {
    const urlParams = new URLSearchParams({
      ...params,
      format: 'json',
      origin: '*',
    });
    const res = await fetch(`${apiUrl}?${urlParams.toString()}`);
    if (res.status === 429) {
      throw new Error('RateLimit-429');
    }
    return returnResponse ? res : res.json();
  }

  // Handle Git APIs which don't need action/origin parameters
  const res = await fetch(apiUrl);
  if (res.status === 429) {
    throw new Error('RateLimit-429');
  }
  return returnResponse ? res : res.json();
};

const mediawikiTitleRevisionsAppendsToProjectEdits = (data, sourceKey) => {
  if (!data || !data.query || !data.query.pages) return;
  const pages = data.query.pages;
  const pageId = Object.keys(pages)[0];
  const revs = pages[pageId].revisions || [];
  const ns = pages[pageId].ns;

  for (let i = 0; i < revs.length; i++) {
    const rev = revs[i];
    const nextRev = revs[i + 1];
    const prevSize = nextRev ? nextRev.size : 0;
    const diff = rev.size - prevSize;
    const dateStr = rev.timestamp.split('T')[0].replace(/-/g, '');

    projectEdits.value.push({
      revid: rev.revid,
      previd: rev.parentid,
      title: pages[pageId].title,
      ns: ns,
      source: sourceKey,
      author: rev.user,
      timestamp: dateStr,
      diff: diff,
      url: `https://commons.wikimedia.org/w/index.php?oldid=${rev.parentid}&diff=${rev.revid}`,
      group: `${dateStr}_${rev.user}_${pages[pageId].title}`
    });
  }
};

const gitlabProjectCommitsAppendsToProjectEdits = (data, sourceKey) => {
  if (!Array.isArray(data)) return;

  for (let i = 0; i < data.length; i++) {
    const commit = data[i];
    const dateStr = commit.created_at.split('T')[0].replace(/-/g, '');

    const repoName = commit.web_url.split('/')[6];
    const comment = commit.message.split('\n')[0];

    projectEdits.value.push({
      revid: commit.id.toString(),
      title: `${repoName}>${comment}`,
      ns: "-1", // Custom namespace identifier for git commits
      source: sourceKey,
      author: commit.author_name,
      timestamp: dateStr,
      diff: commit.id.slice(0,8).toString(), // Diff size not provided in standard commit list response
      url: commit.web_url,
      group: `${dateStr}_${commit.author_name}_${repoName}.replace(' ','_')`
    });
  }
};

const githubProjectCommitsAppendsToProjectEdits = (data, sourceKey) => {
  if (!Array.isArray(data)) return;

  for (let i = 0; i < data.length; i++) {
    const sha = data[i].sha;
    const url = data[i].html_url;
    const commit = data[i].commit;
    const dateStr = commit.author.date.split('T')[0].replace(/-/g, '');
    
    // Extract repo name to generate consistent title format like Gitlab integration above
    // html_url format: https://github.com/owner/RepoName/commit/sha
    const repoName = url.split('/')[4];
    const comment = commit.message.split('\n')[0];

    projectEdits.value.push({
      revid: sha.toString(),
      title: `${repoName}>${comment}`,
      ns: '-2', // Custom namespace identifier for github commits
      source: sourceKey,
      author: commit.author.name,
      timestamp: dateStr,
      diff: sha.slice(0, 8).toString(),
      url: url,
      group: `${dateStr}_${commit.author.name}_${repoName}.replace(' ','_')`
    });
  }
};

const getPages = async () => {
  status.value = 'Fetching pages...';
  let pagesMap = new Map();

  try {
    for (const sourceKey in API_ENDPOINTS) {
      if (sourceKey === 'github' || sourceKey === 'gitlab') {
        continue;
      }
      
      const endpointApi = API_ENDPOINTS[sourceKey].api;

      for (const page of topPages) {
        let continueToken = '';
        do {
          const data = await fetchJson({
            action: 'query',
            list: 'prefixsearch',
            pssearch: page,
            pslimit: 500,
            ...continueToken,
          }, endpointApi);
          if (data.query && data.query.prefixsearch) {
            data.query.prefixsearch.forEach((p) => {
              const title = p.title.replace(/_/g, ' ');
              pagesMap.set(`${sourceKey}:${title}`, { title, source: sourceKey });
            });
          }
          continueToken = data.continue ? data.continue : '';
        } while (continueToken);
      }

      for (const cat of topCategories) {
        let continueToken = '';
        do {
          const data = await fetchJson({
            action: 'query',
            list: 'categorymembers',
            cmtitle: cat,
            cmlimit: 500,
            ...continueToken,
          }, endpointApi);
          if (data.query && data.query.categorymembers) {
            data.query.categorymembers.forEach((p) => {
              const title = p.title.replace(/_/g, ' ');
              pagesMap.set(`${sourceKey}:${title}`, { title, source: sourceKey });
            });
          }
          continueToken = data.continue ? data.continue : '';
        } while (continueToken);
      }
    }
  } catch (error) {
    if (error.message === 'RateLimit-429') {
      console.warn('API Rate limit reached (429) during getPages. Stopping fetch.');
      apiLimitReached.value = true;
    } else {
      console.error(error);
    }
  }

  projectWikipages = Array.from(pagesMap.values());
  
  if (showLists.value === false) {
    // When testing, filtering out pages on endpoints with low API ratelimits.
    projectWikipages = projectWikipages
        // .filter((page) => !page.title.startsWith('Commons:Lingua Libre'))
        // .filter((page) => !page.title.startsWith('Help:Lingua Libre'))
        // .filter((page) => !page.title.startsWith('File:20'))
        // .filter((page) => !page.title.startsWith('File:A'))
        // .filter((page) => !page.title.startsWith('Category:'))
        // .filter((page) => !page.title.startsWith('Lingua Libre/'))
        .filter((page) => !page.title.startsWith('Commons:Lingua Libre/List/'))
        .filter((page) => !page.title.startsWith('Translate:'));
  }

  console.log('projectWikipages', projectWikipages);
};

const fetchWikipageForEdits = async (page, sourceKey = 'commons') => {
  const endpointApi = API_ENDPOINTS[sourceKey].api;
  try {
    if (sourceKey === 'commons' || sourceKey === 'meta') {
      let continueToken = '';
      do {
        const data = await fetchJson({
          action: 'query',
          prop: 'revisions',
          titles: page,
          rvprop: 'ids|timestamp|user|userid|size|comment',
          rvlimit: 500,
          ...continueToken,
        }, endpointApi);

        mediawikiTitleRevisionsAppendsToProjectEdits(data, sourceKey);
        continueToken = data.continue ? { rvcontinue: data.continue.rvcontinue } : '';
      } while (continueToken);
    }
    
    return true; // Success
  } catch (error) {
    if (error.message === 'RateLimit-429') {
      console.warn('API Rate limit reached (429). Stopping fetch.');
      return false; // Indicate rate limit hit
    }
    console.error(error);
    return true; // Still continue on other types of errors
  }
};

const fetchRepositoryForCommits = async (repository, sourceKey) => {
  const endpointApi = API_ENDPOINTS[sourceKey].api;

  const parseLinkHeader = (linkHeader) => {
    if (!linkHeader) return null;
    const links = linkHeader.split(',');
    const nextLink = links.find(link => link.includes('rel="next"'));
    if (!nextLink) return null;
    const match = nextLink.match(/<([^>]+)>/);
    return match ? match[1] : null;
  };

  try {
    if (sourceKey === 'github') {
      let apiUrl = endpointApi.replace(/REPOSITORY/i, repository.repos);
      if (repository.repos.includes('/')) {
        const [user, repoName] = repository.repos.split('/');
        apiUrl = apiUrl.replace('USER', user).replace('REPOSITORY', repoName);
      }
      apiUrl += apiUrl.includes('?') ? '&per_page=100' : '?per_page=100';

      while (apiUrl) {
        const res = await fetchJson({}, apiUrl, true);
        const data = await res.json();
        githubProjectCommitsAppendsToProjectEdits(data, sourceKey);
        apiUrl = parseLinkHeader(res.headers.get('Link'));
        // Safety break if needed, but pagination will eventually exhaust
      }
    }
    
    if (sourceKey === 'gitlab') {
      let apiUrl = endpointApi.replace(/REPOSITORY/i, encodeURIComponent(repository.repos));
      apiUrl += apiUrl.includes('?') ? '&per_page=100' : '?per_page=100';

      while (apiUrl) {
        const res = await fetchJson({}, apiUrl, true);
        const data = await res.json();
        gitlabProjectCommitsAppendsToProjectEdits(data, sourceKey);
        apiUrl = parseLinkHeader(res.headers.get('Link'));
      }
    }
    return true; // Success
  } catch (error) {
    if (error.message === 'RateLimit-429') {
      console.warn('API Rate limit reached (429). Stopping fetch.');
      return false; // Indicate rate limit hit
    }
    console.error(error);
    return true; // Still continue on other types of errors
  }
};

const getEdits = async () => {
  status.value = 'Checking edits...';

  const currentMonth = new Date().toISOString().slice(0, 7); // Adds 'YYYY-MM'

  // If a specific title is queried, use page-specific cache
  if (title.value) {
    const pageStorageKey = `projectEditsOnPage`;
    let storedPageEdits = JSON.parse(localStorage.getItem(pageStorageKey) || '{}');
    
    if (storedPageEdits[title.value] && storedPageEdits[title.value].length > 0) {
      const mostRecentEditDate = storedPageEdits[title.value][0].timestamp;
      if (mostRecentEditDate.startsWith(currentMonth)) {
        projectEdits.value = storedPageEdits[title.value];
        status.value = `Data for ${title.value} loaded from local storage.`;
        return;
      }
    }

    status.value = `Fetching edits for ${title.value}...`;
    projectEdits.value = [];
    for (const sourceKey in API_ENDPOINTS) {
      await fetchWikipageForEdits(title.value, sourceKey);
    }
    
    projectEdits.value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    try {
      storedPageEdits[title.value] = projectEdits.value;
      localStorage.setItem(pageStorageKey, JSON.stringify(storedPageEdits));
    } catch (e) {
      console.warn('Could not save to localStorage, it might be too large.', e);
    }
    
    status.value = `Data for ${title.value} loaded via API.`;
    return;
  }

  // Otherwise, use global project cache
  const storedEditsJSON = localStorage.getItem('projectEdits');
  let cacheValid = false;

  if (storedEditsJSON) {
    try {
      const parsed = JSON.parse(storedEditsJSON);
      if (parsed.length > 0) {
        const mostRecentEditDate = parsed[0].timestamp;
        if (!mostRecentEditDate.startsWith(currentMonth)) {
          console.log("Stale cache detected, clearing localStorage.projectEdits");
          localStorage.removeItem('projectEdits');
        } else {
          projectEdits.value = parsed;
          cacheValid = true;
        }
      } else {
        localStorage.removeItem('projectEdits');
      }
    } catch (e) {
      console.error(e);
      localStorage.removeItem('projectEdits');
    }
  }

  let workingList = projectWikipages;
  let projectWikipagesMissing = [];

  if (cacheValid) {
    const foundPagesSet = new Set(projectEdits.value.map(e => `${e.source}:${e.title}`));
    projectWikipagesMissing = projectWikipages.filter(p => !foundPagesSet.has(`${p.source}:${p.title}`));

    if (projectWikipagesMissing.length !== 0) {
      workingList = projectWikipagesMissing;
      status.value = `Resuming fetch for ${projectWikipagesMissing.length} missing pages...`;
    } else {
      status.value = 'Data loaded from local storage, refreshed each month.';
      return; 
    }
  } else {
    status.value = 'Fetching edits (this might take a while)...';
    projectEdits.value = [];
  }

  // Fetch MediaWiki page edits
  for (const pageObj of workingList) {
    if (pageObj.source === 'github' || pageObj.source === 'gitlab') continue;
    
    const success = await fetchWikipageForEdits(pageObj.title, pageObj.source);
    if (!success) {
       apiLimitReached.value = true;
       // Recalculate remaining missing pages to update the user
       const currentFound = new Set(projectEdits.value.map(e => `${e.source}:${e.title}`));
       missingPagesCount.value = projectWikipages.filter(p => !currentFound.has(`${p.source}:${p.title}`)).length;
       break; 
    }
  }

  // Fetch Git repository commits
  if (!cacheValid) {
    const gitSources = ['github', 'gitlab'];
    for (const source of gitSources) {
      if (API_ENDPOINTS[source]) {
        const topGit = topGitRepos.filter(r => r.source === source);
        console.log(`topGit for ${source}:`, topGit);
        for (const repos of topGit) {
          const success = await fetchRepositoryForCommits(repos, source);
          if (!success) {
            apiLimitReached.value = true;
            break;
          }
        }
        if (apiLimitReached.value) break;
      }
    }
  }

  projectEdits.value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  try {
    localStorage.setItem('projectEdits', JSON.stringify(projectEdits.value));
  } catch (e) {
    console.warn('Could not save to localStorage, it might be too large.', e);
  }

  if (apiLimitReached.value) {
    status.value = `Paused due to API limits.`;
  } else {
    status.value = 'Data loaded via API.';
  }
};

onMounted(async () => {
  await getPages();
  await getEdits();
});
</script>

<style scoped>
.wiki-data-fetcher {
  padding: 1rem;
}
.system-status {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.toggle-group {
  display: flex;
  background-color: #f1f3f5;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #ddd;
}
.toggle-group button {
  border: none;
  background: none;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: #495057;
}
.toggle-group button.active {
  background-color: #007bff;
  color: white;
  font-weight: 600;
}

.source-logo {
  width: 16px;
  height: 16px;
  object-fit: contain;
  vertical-align: middle;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #d4edda;
  color: #155724;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 500;
  align-self: flex-start;
}

.status-badge.is-loading {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
}

.status-badge.is-loading .dot {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%   { opacity: 0.4; }
  50%  { opacity: 1; }
  100% { opacity: 0.4; }
}

.info-callout {
  background-color: #e9ecef;
  border-left: 4px solid #6c757d;
  padding: 1rem;
  border-radius: 4px;
  color: #495057;
  font-size: 0.95rem;
}

.info-callout.error {
  background-color: #f8d7da;
  border-left-color: #dc3545;
  color: #721c24;
}

@media (prefers-color-scheme: dark) {
  .status-badge { background-color: #1e4620; color: #75b798; }
  .status-badge.is-loading { background-color: #503d0b; color: #ffda6a; }
  .info-callout { background-color: #2d2d2d; border-left-color: #adb5bd; color: #e9ecef; }
  .info-callout.error { background-color: #442726; border-left-color: #e4606d; color: #ffb3b8; }
  
  .toggle-group {
    background-color: #333;
    border-color: #444;
  }
  .toggle-group button {
    color: #ccc;
  }
  .toggle-group button.active {
    background-color: #0056b3;
    color: white;
  }
}

.dashboard-content {
  margin-top: 2rem;
}
.charts-area {
  margin-bottom: 2rem;
}
</style>