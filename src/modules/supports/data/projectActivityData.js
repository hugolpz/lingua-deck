import { ref, toRaw, computed } from 'vue';
import { API_ENDPOINTS, topPagesBySource, topCategories, topGitRepos } from './projectSatellitePlatforms.js';
import { cacheGet, cachePut, cacheDelete } from '@/js/cacheDb.js';

export const phabricators = [
  {
    id: 6913,
    name: "Lingua Libre",
    phid: "PHID-PROJ-ok3eoizytdnc3bgpmdcu",
  },
  {
    id: 3393,
    name: "Lingua-Libre-Legacy",
    phid: "PHID-PROJ-yatgxw2sglgu2upfwg62",
  }
];

export function projectsActivityData() {
  const status = ref('Initializing...');
  const apiLimitReached = ref(Object.keys(API_ENDPOINTS).reduce((acc, key) => { acc[key] = false; return acc; }, {}));
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

  /* ***************************************************** */
  /* HELPERS ********************************************* */
  /* ***************************************************** */

  const multipleUsernamesMerger = (sourceKey,username) => {
    const renameMap = {
      // Gitlab
      'adityasuthar20':'Adityasuthar20',   // as per userpage
      'pushkar': 'Pushkar707',    // as per userpage
      'pushkar707': 'Pushkar707', // as per userpage
      'poslovitch' : 'Poslovitch', // as per public userpages @poslovitch
      // github
      'hugolpz': 'Yug',            // as per userpage
      'pamputt':'Pamputt',
      'Lyokoi':'Lyokoï',
      // CedricTarbouriech
      // wikis
      'lingualibre>JnpoJuwan': 'JnpoJuwan',
      'lingualibre>XANA000':'XANA000',
      'Hugo en résidence':'Yug',
      'Xenophôn':'Rémy Gerbet WMFr',
      // Phabricator
      'Pushkar7077':'Pushkar707',
      'Aditya suthar02':'Adityasuthar20'
    }
    return renameMap[username] || renameMap[username.toLowerCase()] || username;
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
      const author = rev.user;

      projectEdits.value.push({
        revid: rev.revid,
        previd: rev.parentid,
        title: title,
        ns: ns,
        source: sourceKey,
        author: multipleUsernamesMerger(sourceKey,author),
        timestamp: dateStr,
        diff: diff,
        url: `${API_ENDPOINTS[sourceKey].link}index.php?oldid=${rev.parentid}&diff=${rev.revid}`,
        group: `${dateStr}_${rev.user}_${title}`.replace(/\s+/g, '_')
      });
    }
  };

  const gitlabProjectCommitsAppendsToProjectEdits = (data, sourceKey) => {
    if (!Array.isArray(data)) return;

    for (let i = 0; i < data.length; i++) {
      const commit = data[i];
      const author = commit.author_name;
      const dateStr = commit.created_at.split('T')[0];
      const repoName = commit.web_url.split('/')[6];
      const comment = commit.message.split('\n')[0];

      projectEdits.value.push({
        revid: commit.id.toString(),
        title: repoName,
        comment: comment,
        ns: "-1",
        source: sourceKey,
        author: multipleUsernamesMerger(sourceKey,author),
        timestamp: dateStr,
        diff: commit.id.slice(0,8).toString(),
        url: commit.web_url,
        group: `${dateStr}_${author}_${repoName}`.replace(/\s+/g, '_')
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
      // Reject edits and commits prior to May 2016
      // Earliest edit : 2015.09
      // Earliest commit: 2016.05 https://github.com/wikimedia-france/Lingua-Libre/commits/master/?after=29d074676ff5abd48fe28d13c71f9216574d7d1c+244
      if (dateStr < '2015-06-01') { continue; }
      // Reject template mediawiki skin contributors
      const llskinExcludeList = ['Hutchy68','garrickvanburen','snaterlicious','jthingelstad','paladox','hexmode', 'kghbln', 'tobijat', 'frimelle','thiemowmde', 'JanZerebecki', 'JeroenDeDauw', 'adrianheine','mairushoch', 'Benestar', 'JonasKress' ];
      if (llskinExcludeList.find((user) => user === author)) { continue; }
      const repoName = url.split('/')[4];
      const comment = commit.message.split('\n')[0];
      // Filter out SignIt i18n bot updates.
      if (comment.includes('Update _locales')) { continue; }

      projectEdits.value.push({
        revid: sha.toString(),
        title: repoName,
        comment: comment,
        ns: '-2',
        source: sourceKey,
        author: multipleUsernamesMerger(sourceKey,author),
        timestamp: dateStr,
        diff: sha.slice(0, 8).toString(),
        url: url,
        group: `${dateStr}_${author}_${repoName}`.replace(/\s+/g, '_')
      });
    }
  };

  const phabricatorProjectPostsAppendsToProjectEdits = (data, sourceKey) => {
    if (!Array.isArray(data)) return;

    for (let i = 0; i < data.length; i++) {
      const { log, task, project, usersDataByPHIDs } = data[i];
      const user = usersDataByPHIDs[log.authorPHID] || { username: 'Unknown' };
      const author = user.mwuser || user.username || 'Unknown';
      const dateStr = log.dateStr;

      projectEdits.value.push({
        revid: log.id,
        title: task.title,
        name: project.name,
        ns: project.id,
        source: sourceKey,
        author: multipleUsernamesMerger(sourceKey,author),
        timestamp: dateStr,
        diff: `T${task.id||log.taskPHID}`,
        url: `https://phabricator.wikimedia.org/T${task.id}${log.id?'#'+log.id:''}`,
        group: `${dateStr}_${author}_${task.id}`.replace(/\s+/g, '_')
      });
    }
  };

  /* ***************************************************** */
  /* --- WIKIMEDIA LOGIC ********************************* */
  /* ***************************************************** */

  const getWikipages = async (showListsValue) => {
    status.value = 'Fetching pages...';
    let pagesMap = new Map();

    const fetchPromises = [];

    for (const sourceKey in API_ENDPOINTS) {
      if (sourceKey === 'github' || sourceKey === 'gitlab' || sourceKey === 'phabricator') {
        continue;
      }
      
      const endpointApi = API_ENDPOINTS[sourceKey].api;

      fetchPromises.push((async () => {
        try {
          const pagesToSearch = topPagesBySource[sourceKey] ?? [];
          for (const page of pagesToSearch) {
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
        } catch (error) {
          if (error.message === 'RateLimit-429') {
            console.warn(`API Rate limit reached (429) for ${sourceKey} during datamining. Stopping fetch for this source.`);
            apiLimitReached.value[sourceKey] = true;
          } else {
            console.error(error);
          }
        }
      })());
    }

    await Promise.all(fetchPromises);


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
      if (sourceKey === 'commons' || sourceKey === 'meta' || sourceKey === 'wikipedia' || sourceKey === 'wikidata') {
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


/* ***************************************************** */
/* --- GITHUB & GITLAB LOGIC *************************** */
/* ***************************************************** */

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


/* ***************************************************** */
/* --- PHABRICATOR LOGIC ******************************* */
/* ***************************************************** */

  // Proxied by Vite (see vite.config.js), which injects the API token server-side and avoids CORS.
  const phabBase = '/phabricator-api';

  const projectApiUrl = (id) => `${phabBase}/project.search?constraints[ids][0]=${id}`;
  const projectTasksListApiUrl = (phid, after = null) => {
    let url = `${phabBase}/maniphest.search?constraints[projects][0]=${phid}`;
    if (after) url += `&after=${after}`;
    return url;
  };
  const usersApiUrl = (phids) => {
    let url = `${phabBase}/user.search?`;
    phids.forEach((phid, index) => { url += `constraints[phids][${index}]=${phid}&`; });
    return url.slice(0, -1);
  };
  const logsApiUrl = (phid, after = null) => {
    let url = `${phabBase}/transaction.search?objectIdentifier=${phid}`;
    if (after) url += `&after=${after}`;
    return url;
  };

  let phabricatorQueue = Promise.resolve();
  const phabricatorFetch = (url) => {
    phabricatorQueue = phabricatorQueue.then(() => new Promise(resolve => setTimeout(resolve, 100)));
    return phabricatorQueue.then(() => fetch(url));
  };

  async function getProjectData(projectId) {
    const res = await phabricatorFetch(projectApiUrl(projectId));
    const json = await res.json();
    return json.result.data[0];
  }

  async function getProjectTasks(projectPHID) {
    let tasks = [];
    let after = null;
    do {
      const res = await phabricatorFetch(projectTasksListApiUrl(projectPHID, after));
      const json = await res.json();
      tasks = tasks.concat(json.result.data.map(item => ({
        id: item.id,
        phid: item.phid,
        title: item.fields.name,
        status: item.fields.status.value,
        authorPHID: item.fields.authorPHID
      })));
      after = json.result.cursor.after;
    } while (after);
    return tasks;
  }

  async function getTaskLogs(taskPHID) {
    let logs = [];
    let after = null;
    do {
      const res = await phabricatorFetch(logsApiUrl(taskPHID, after));
      const json = await res.json();
      logs = logs.concat(json.result.data  // WHY CONCAT ?????? --------------------------------------------------
        .filter(item => item.type === "create" || item.type === 'comment')
        .map(item => ({
          id: item.type === 'comment'?item.id:'',
          phid: item.phid,
          taskPHID: item.objectPHID || null,
          type: item.type,
          authorPHID: item.authorPHID,
          dateStr: new Date(item.dateCreated * 1000).toISOString().split('T')[0]
        })));
      after = json.result.cursor.after;
    } while (after);
    return logs;
  }

  async function getUsersData(authorPHIDs) {
    if (authorPHIDs.length === 0) return {};
    const res = await phabricatorFetch(usersApiUrl(authorPHIDs));
    const json = await res.json();
    const usersMap = {};
    json.result.data.forEach(userData => {
      usersMap[userData.phid] = {
        id: userData.id,
        type: userData.type,
        username: userData.fields.username,
        mwuser: userData.fields.mediawikiUsername,
        authorName: userData.fields.realName
      };
    });
    return usersMap;
  }

  const fetchPhabricatorProjectAppendsToProjectEdits = async (project) => {
    try {
       // Get data for all posts (but with obfuscated author and task ids)
      const projectData = await getProjectData(project.id);
      const projectTasks = await getProjectTasks(projectData.phid);
      const allLogsResults = await Promise.all(projectTasks.map(task => getTaskLogs(task.phid)));
      
      // Get data for all authors
      const authorPHIDsSet = new Set();
      allLogsResults.flat().forEach(log => authorPHIDsSet.add(log.authorPHID));
      const usersDataByPHIDs = await getUsersData(Array.from(authorPHIDsSet));

      // Rebuild logs with proper user data
      const dataToAppend = [];
      allLogsResults.forEach((projectLogs, index) => {
        const task = projectTasks[index];
        for (const log of projectLogs) {
          dataToAppend.push({ log, task, project, usersDataByPHIDs });
        }
      });
      // Remap logs data then push.projectEdits
      phabricatorProjectPostsAppendsToProjectEdits(dataToAppend, 'phabricator');

      return true;
    } catch (e) {
      console.error(e);
      // Wait to see if we should throw specific errors
      return true; 
    }
  };


/* ***************************************************** */
/* --- MAIN LOGIC ************************************** */
/* ***************************************************** */

  const getEdits = async (titleValue) => {
    status.value = 'Checking edits...';

    const currentMonth = new Date().toISOString().slice(0, 7); // Adds 'YYYY-MM'

    if (titleValue) {
      const pageStorageKey = `projectEditsOnPage`;
      let storedPageEdits = (await cacheGet(pageStorageKey)) || {};
      
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
      
      storedPageEdits[titleValue] = toRaw(projectEdits.value);
      await cachePut(pageStorageKey, storedPageEdits);
      
      status.value = `Data for ${titleValue} loaded via API.`;
      return;
    }

    const persistentProjectEdits = await cacheGet('projectEdits');
    let cacheValid = false;

    if (persistentProjectEdits?.length > 0) {
      try {
        const mostRecentEditDate = persistentProjectEdits[0].timestamp;
        if (!mostRecentEditDate.startsWith(currentMonth)) {
          console.log("Stale cache detected, clearing IndexedDB.projectEdits");
          await cacheDelete('projectEdits');
        } else {
          projectEdits.value = persistentProjectEdits;
          cacheValid = true;
        }
      } catch (e) {
        console.error('Error verifying cache:', e);
        await cacheDelete('projectEdits');
      }
    } else {
      await cacheDelete('projectEdits');
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

    const mediawikiEdits = async () => {
      for (const pageObj of workingList) {
        if (pageObj.source === 'github' || pageObj.source === 'gitlab' || pageObj.source === 'phabricator') continue;
        
        if (apiLimitReached.value[pageObj.source]) continue;

        const success = await fetchWikipageForEdits(pageObj.title, pageObj.source);
        if (!success) {
           apiLimitReached.value[pageObj.source] = true;
        }
      }
      
      const currentFound = new Set(projectEdits.value.map(e => `${e.source}:${e.title}`));
      missingPagesCount.value = projectWikipages.filter(p => !currentFound.has(`${p.source}:${p.title}`)).length;
    };

    const gitCommits = async (source) => {
      if (apiLimitReached.value[source]) return;

      const topGit = topGitRepos.filter(r => r.source === source);
      console.log(`topGit for ${source}:`, topGit);
      for (const repos of topGit) {
        const success = await fetchRepositoryForCommits(repos, source);
        if (!success) {
          apiLimitReached.value[source] = true;
          break;
        }
      }
    };

    const phabTasks = async () => {
      if (!apiLimitReached.value['phabricator'] && API_ENDPOINTS['phabricator']) {
        console.log(`fetching Phabricator project logs...`);
        for (const project of phabricators) {
          const success = await fetchPhabricatorProjectAppendsToProjectEdits(project);
          if (!success) {
            apiLimitReached.value['phabricator'] = true;
            break; 
          }
        }
      }
    };

    const promises = [ mediawikiEdits() ];
    if (!cacheValid) {
        promises.push(gitCommits('github'), gitCommits('gitlab'), phabTasks());
    }
    await Promise.all(promises);


    projectEdits.value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    await cachePut('projectEdits', toRaw(projectEdits.value));

    const anyApiLimitReached = Object.values(apiLimitReached.value).some((v) => v);
    if (anyApiLimitReached) {
      status.value = `Paused due to API limits.`;
    } else {
      status.value = 'Data loaded via API.';
    }
  };

  return {
    status,
    apiLimitReached,
    anyApiLimitReached: computed(() => Object.values(apiLimitReached.value).some((v) => v)),
    missingPagesCount,
    projectEdits,
    getWikipages,
    getEdits
  };
}