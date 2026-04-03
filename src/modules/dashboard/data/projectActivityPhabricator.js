// PHABRICATOR API CONFIG
// API token is injected server-side by the vite.config.js proxy rewrite.

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
const projectApiUrl = function (id) {
    return `/phabricator-api/project.search?queryKey=active&constraints[ids][0]=${id}`;
}

const projectTasksListApiUrl = function (phid, after = null) {
    let url = `/phabricator-api/maniphest.search?constraints[projects][0]=${phid}`;
    if (after) url += `&after=${after}`;
    return url;
}
const taskApiUrl = function (id) {
    return `/phabricator-api/maniphest.search?queryKey=active&constraints[ids][0]=${id}`;
}
const userApiUrl = function (id) {
    return `/phabricator-api/user.search?constraints[phids][0]=${id}`;
}
const userTaskListApiUrl = function (id, after = null) {
    let url = `/phabricator-api/maniphest.search?constraints[authorPHIDs][0]=${id}`;
    if (after) url += `&after=${after}`;
    return url;
}
const logsApiUrl = function (phid, after = null) {
    let url = `/phabricator-api/transaction.search?objectIdentifier=${phid}`;
    if (after) url += `&after=${after}`;
    return url;
}


// PHABRICATOR DATA FETCHING LOGIC

async function getProjectData(projectId) {
    const res = await fetch(projectApiUrl(projectId));
    const json = await res.json();
    return json.result.data[0];
}

async function getProjectTasks(projectPHID) {
    let tasks = [];
    let after = null;
    do {
        const res = await fetch(projectTasksListApiUrl(projectPHID, after));
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
        const res = await fetch(logsApiUrl(taskPHID, after));
        const json = await res.json();
        logs = logs.concat(json.result.data
            .filter(item => item.type === null || item.type === 'comment')
            .map(item => ({
                id: item.id,
                phid: item.phid,
                type: item.type,
                authorPHID: item.authorPHID,
                dateStr: new Date(item.dateCreated * 1000).toISOString().split('T')[0]
            })));
        after = json.result.cursor.after;
    } while (after);
    return logs;
}

async function getUserData(authorPHID) {
    const res = await fetch(userApiUrl(authorPHID));
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
                    group: `${dateStr}_${author}_${task.id}`.replace(/\s+/g, '_')
                });
            }
        }
        
        console.log("Phabricator data for", project.name, phabricatorData);
        return phabricatorData;

    } catch (e) {
        console.error(e);
    }
}
 