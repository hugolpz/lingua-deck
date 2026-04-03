// PHABRICATOR API CONFIG
const API_TOKEN = "api-2mj7ejrixduutredaresz4lzq62w"; // Replace with your actual API token
const BASE_URL = "https://phabricator.wikimedia.org/api";

// PHABRICATOR PROJECTS
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
]

// PHABRICATOR RELEVANT API URLS
/**
 * Project Queries: https://phabricator.wikimedia.org/conduit/method/project.search/
 * Task Queries: https://phabricator.wikimedia.org/conduit/method/maniphest.search/
 * Revision Queries: https://phabricator.wikimedia.org/conduit/method/differential.revision.search/

*/
const projectApiUrl = function (API_TOKEN,id) { 
    return `https://phabricator.wikimedia.org/api/project.search?api.token=${API_TOKEN}&queryKey=active&constraints[ids][0]=${id}`; // id = Project ID, ex `6913`.
}

const projectTasksListApiUrl = function (API_TOKEN,id) {
    return `https://phabricator.wikimedia.org/api/maniphest.search?api.token=${API_TOKEN}&constraints[projects][0]=${id}`; // id = Project PHID, ex `PHID-PROJ-ok3eoizytdnc3bgpmdcu`.
}
const taskApiUrl = function (API_TOKEN,id) { 
    return `https://phabricator.wikimedia.org/api/maniphest.search?api.token=${API_TOKEN}&queryKey=active&constraints[ids][0]=${id}`; // id = TASK ID, ex `375653` from `T375653`.
}
const userApiUrl = function (API_TOKEN,id) {
    return `https://phabricator.wikimedia.org/api/user.search?api.token=${API_TOKEN}&constraints[phids][0]=${id}`; // id = authorPHID, ex `PHID-USER-abc123`.
}
const userTaskListApiUrl = function (API_TOKEN,id) {
    return `https://phabricator.wikimedia.org/api/manifest.search?api.token=${API_TOKEN}&constraintss[authorPHIDs][0]=${id}`; // id = authorPHID, ex `PHID-USER-abc123`.    
}
const logsApiUrl = function (API_TOKEN,phid) {
    return `https://phabricator.wikimedia.org/api/transaction.search?api.token=${API_TOKEN}&objectIdentifier=${phid}`; // task/project phid, task Tid.
}


// PHABRICATOR DATA FETCHING LOGIC

async function getProjectData(projectId) {
    const res = await fetch(projectApiUrl(API_TOKEN, projectId));
    const json = await res.json();
    return json.result.data[0];
}

async function getProjectTasks(projectPHID) {
    const res = await fetch(projectTasksListApiUrl(API_TOKEN, projectPHID));
    const json = await res.json();
    return json.result.data.map(item => ({
        id: item.id,
        phid: item.phid,
        title: item.fields.name,
        status: item.fields.status.value,
        authorPHID: item.fields.authorPHID
    }));
}

async function getTaskLogs(taskPHID) {
    const res = await fetch(logsApiUrl(API_TOKEN, taskPHID));
    const json = await res.json();
    return json.result.data
        .filter(item => item.type === null || item.type === 'comment')
        .map(item => ({
            id: item.id,
            phid: item.phid,
            type: item.type,
            authorPHID: item.authorPHID,
            dateStr: new Date(item.dateCreated * 1000).toISOString().split('T')[0]
        }));
}

async function getUserData(authorPHID) {
    const res = await fetch(userApiUrl(API_TOKEN, authorPHID));
    const json = await res.json();
    const userData = json.result.data[0];
    if (userData) {
        return {
            id: userData.id,
            type: userData.type,
            username: userData.fields.username,
            mwuser: userData.fields.mediawikiUsername,
            authorName: userData.fields.realName
        };
    }
    return null;
}

export async function fetchLinguaLibreChanges(project) {
    try {
        const projectData = await getProjectData(project.id);
        const projectTasks = await getProjectTasks(projectData.phid);

        let phabricatorData = [];
        let usersDataByPHIDs = {};

        for (const task of projectTasks) {
            const projectLogs = await getTaskLogs(task.phid);

            for (const log of projectLogs) {
                if (!usersDataByPHIDs[log.authorPHID]) {
                    const userData = await getUserData(log.authorPHID);
                    if (userData) {
                        usersDataByPHIDs[log.authorPHID] = userData;
                    } else {
                        usersDataByPHIDs[log.authorPHID] = { username: 'Unknown' };
                    }
                }

                const user = usersDataByPHIDs[log.authorPHID];
                const title = task.title;
                const author = user.mwuser || user.username;
                const dateStr = log.dateStr;

                phabricatorData.push({
                    revid: log.id,
                    task: `T${task.id}`,
                    title: title,
                    name: project.name, // the project name
                    ns: project.id, // the project id, ie. 6913 for Lingua Libre
                    source: "phabricator",
                    author: author,
                    timestamp: dateStr,
                    diff: null,
                    diffUrl: `https://phabricator.wikimedia.org/T${task.id}`,
                    group: `${dateStr}_${author}_${task.id}.replace(/\s+/g, '_')}`
                });
            }
        }
        
        console.log("Phabricator data for", project.name, phabricatorData);
        return phabricatorData;

    } catch (e) {
        console.error(e);
    }
}
 