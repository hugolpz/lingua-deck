import { ref, toRaw } from 'vue';
import { API_ENDPOINTS, topPages, topCategories, topGitRepos } from './projectSatellitePlatforms.js';
import { openDB } from 'idb';

const dbPromise = openDB('lingualibre-dashboard', 1, {
  upgrade(db) {
    db.createObjectStore('cache');
  },
});

export function useActivityData() {
  const status = ref('Initializing...');
  const apiLimitReached = ref(false);
  const missingPagesCount = ref(0);
  const projectEdits = ref([]);
  let projectWikipages = [];

  const fetchJson = async (params, apiUrl = API_ENDPOINTS.commons.api, returnResponse = false) => {
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

    const res = await fetch(apiUrl);
    if (res.status === 429) {
      throw new Error('RateLimit-429');
    }
    return returnResponse ? res : res.json();
  };

  const userRenameGits = (sourceKey,username) => {
    const renameMap = {
      'hugolpz': 'Yug',            // as per userpage
      'Adityasuthar20': 'adityasuthar20',   // as per userpage
      'pushkar': 'Pushkar707',    // as per userpage
      'Pushkar': 'Pushkar707',    // as per userpage
      'pushkar707': 'Pushkar707', // as per userpage
      'Poslovitch':'Florian Cuny' // as per userpage
    }
    return renameMap[username] || username;
  }
  const mediawikiTitleRevisionsAppendsToProjectEdits = (data, sourceKey) => {
    if (!data || !data.query || !data.query.pages) return;
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const revs = pages[pageId].revisions || [];
    const ns = pages[pageId].ns;
    const title = pages[pageId].title;

    for (let i = 0; i < revs.length; i++) {
      const rev = revs[i];
      const nextRev = revs[i + 1];
      const prevSize = nextRev ? nextRev.size : 0;
      const diff = rev.size - prevSize;
      const dateStr = rev.timestamp.split('T')[0];

      projectEdits.value.push({
        revid: rev.revid,
        previd: rev.parentid,
        title: title,
        ns: ns,
        source: sourceKey,
        author: rev.user,
        timestamp: dateStr,
        diff: diff,
        url: `https://${sourceKey.toLowerCase()}.wikimedia.org/w/index.php?oldid=${rev.parentid}&diff=${rev.revid}`,
        group: `${dateStr}_${rev.user}_${title}.replace(' ','_')`
      });
    }
  };

  const gitlabProjectCommitsAppendsToProjectEdits = (data, sourceKey) => {
    if (!Array.isArray(data)) return;

    for (let i = 0; i < data.length; i++) {
      const commit = data[i];
      const author = userRenameGits(sourceKey,commit.author_name);
      const dateStr = commit.created_at.split('T')[0];
      const repoName = commit.web_url.split('/')[6];
      const comment = commit.message.split('\n')[0];

      projectEdits.value.push({
        revid: commit.id.toString(),
        title: repoName,
        comment: comment,
        ns: "-1",
        source: sourceKey,
        author: author,
        timestamp: dateStr,
        diff: commit.id.slice(0,8).toString(),
        url: commit.web_url,
        group: `${dateStr}_${author}_${repoName}.replace(' ','_')`
      });
    }
  };

  const githubProjectCommitsAppendsToProjectEdits = (data, sourceKey) => {
    if (!Array.isArray(data)) return;

    for (let i = 0; i < data.length; i++) {
      const sha = data[i].sha;
      const url = data[i].html_url;
      const commit = data[i].commit;
      const author = data[i].author?.login || commit.author?.name || 'Unknown';
      const dateStr = commit.author.date.split('T')[0];
      const repoName = url.split('/')[4];
      const comment = commit.message.split('\n')[0];
      if (repoName === 'Sparql2Data' && comment.includes('Update _locales')) {
        continue; // Skip this specific commit as it is a bot update to localization files and creates noise in the data
      }
      projectEdits.value.push({
        revid: sha.toString(),
        title: repoName,
        comment: comment,
        ns: '-2',
        source: sourceKey,
        author: author,
        timestamp: dateStr,
        diff: sha.slice(0, 8).toString(),
        url: url,
        group: `${dateStr}_${author}_${repoName}.replace(' ','_')`
      });
    }
  };

  const getPages = async (showListsValue) => {
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
    
    if (showListsValue === false) {
      projectWikipages = projectWikipages
          .filter((page) => !page.title.startsWith('Commons:Lingua Libre/List/'))
          .filter((page) => !page.title.startsWith('Commons:Lingua Libre/List:'))
          .filter((page) => !page.title.startsWith('Commons:Lingua Libre/Exclusion list:'))
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

  const getEdits = async (titleValue) => {
    status.value = 'Checking edits...';

    const currentMonth = new Date().toISOString().slice(0, 7); // Adds 'YYYY-MM'

    if (titleValue) {
      const pageStorageKey = `projectEditsOnPage`;
      const db = await dbPromise;
      let storedPageEdits = (await db.get('cache', pageStorageKey)) || {};
      
      if (storedPageEdits[titleValue] && storedPageEdits[titleValue].length > 0) {
        const mostRecentEditDate = storedPageEdits[titleValue][0].timestamp;
        if (mostRecentEditDate.startsWith(currentMonth)) {
          projectEdits.value = storedPageEdits[titleValue];
          status.value = `Data for ${titleValue} loaded from local storage.`;
          return;
        }
      }

      status.value = `Fetching edits for ${titleValue}...`;
      projectEdits.value = [];
      for (const sourceKey in API_ENDPOINTS) {
        await fetchWikipageForEdits(titleValue, sourceKey);
      }
      
      projectEdits.value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      try {
        storedPageEdits[titleValue] = toRaw(projectEdits.value);
        const db = await dbPromise;
        await db.put('cache', storedPageEdits, pageStorageKey);
      } catch (e) {
        console.warn('Could not save to IndexedDB, it might be too large.', e);
      }
      
      status.value = `Data for ${titleValue} loaded via API.`;
      return;
    }

    const db = await dbPromise;
    const persistentProjectEdits = await db.get('cache', 'projectEdits');
    let cacheValid = false;

    if (persistentProjectEdits?.length > 0) {
      try {
        const mostRecentEditDate = persistentProjectEdits[0].timestamp;
        if (!mostRecentEditDate.startsWith(currentMonth)) {
          console.log("Stale cache detected, clearing IndexedDB.projectEdits");
          await db.delete('cache', 'projectEdits');
        } else {
          projectEdits.value = persistentProjectEdits;
          cacheValid = true;
        }
      } catch (e) {
        console.error('Error verifying cache:', e);
        await db.delete('cache', 'projectEdits');
      }
    } else {
      await db.delete('cache', 'projectEdits');
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

    for (const pageObj of workingList) {
      if (pageObj.source === 'github' || pageObj.source === 'gitlab') continue;
      
      const success = await fetchWikipageForEdits(pageObj.title, pageObj.source);
      if (!success) {
         apiLimitReached.value = true;
         const currentFound = new Set(projectEdits.value.map(e => `${e.source}:${e.title}`));
         missingPagesCount.value = projectWikipages.filter(p => !currentFound.has(`${p.source}:${p.title}`)).length;
         break; 
      }
    }

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
      const db = await dbPromise;
      await db.put('cache', toRaw(projectEdits.value), 'projectEdits');
    } catch (e) {
      console.warn('Could not save to IndexedDB, it might be too large.', e);
    }

    if (apiLimitReached.value) {
      status.value = `Paused due to API limits.`;
    } else {
      status.value = 'Data loaded via API.';
    }
  };

  return {
    status,
    apiLimitReached,
    missingPagesCount,
    projectEdits,
    getPages,
    getEdits
  };
}