// Browser-safe log parsing (no Node APIs): shared by the CLI (logs-cleaner.js) and the in-app uploader.

const CLIENT_TRAILER = /\s\|\sBrowser:\s(.*?)\s\|\sOS:\s(.*?)\s\|\sUser-Agent:\s.*$/;

/**
 * Newer log lines end with ` | Browser: <b> | OS: <os> | User-Agent: <ua>`.
 * Split it from the line: returns the line without it, and the short client fields
 * (the long user-agent string is dropped to keep the JSON small).
 * @param {string} row
 * @returns {{row: string, client: {browser: string, os: string}|null}}
 */
export function splitClientInfo(row) {
    const match = row.match(CLIENT_TRAILER);
    if (!match) return { row, client: null };
    return {
        row: row.replace(CLIENT_TRAILER, ''),
        client: { browser: match[1].trim(), os: match[2].trim() }
    };
}

/**
 * Convert a Python repr (dict/list/str/None/True/False) to JSON text.
 * Strings may use either quote kind; backslash escapes are honoured.
 * @param {string} src
 * @returns {string}
 */
export function pythonLiteralToJson(src) {
    const ESCAPES = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"' };
    let out = '';
    let i = 0;
    while (i < src.length) {
        const ch = src[i];
        if (ch === "'" || ch === '"') {
            let str = '';
            i++;
            while (i < src.length && src[i] !== ch) {
                if (src[i] === '\\') {
                    const next = src[i + 1];
                    if (next === 'u') {
                        str += String.fromCharCode(parseInt(src.slice(i + 2, i + 6), 16));
                        i += 6;
                    } else if (next === 'x') {
                        str += String.fromCharCode(parseInt(src.slice(i + 2, i + 4), 16));
                        i += 4;
                    } else {
                        str += ESCAPES[next] ?? next;
                        i += 2;
                    }
                } else {
                    str += src[i++];
                }
            }
            i++; // closing quote
            out += JSON.stringify(str);
        } else if (/[A-Za-z]/.test(ch)) {
            let word = '';
            while (i < src.length && /[A-Za-z_]/.test(src[i])) word += src[i++];
            out += { None: 'null', True: 'true', False: 'false' }[word] ?? word;
        } else {
            out += ch;
            i++;
        }
    }
    return out;
}

/**
 * Extract the {...} json object matching :\s(\{.+\})$
 * @param {string} row 
 * @returns {object|string}
 */
export function extractObject(row) {
    const match = row.match(/:\s({.*})$/);
    if (!match) return null;
    
    let objStr = match[1];
    let jsonStr = objStr
        .replace(/[\'\"]/g, function (match) { return match === '"' ? '\'' : '"'; })
        .replace(/(\w)"(\w)/g,"$1'$2")
        .replace(/: '(.+?)',/,': "$1",');
    try {
        return JSON.parse(jsonStr);
    } catch {
        // The quote swap above breaks on texts holding both quote kinds: parse the Python literal properly
        try {
            return JSON.parse(pythonLiteralToJson(objStr));
        } catch {
            // One malformed details object must not abort the whole run
            return null;
        }
    }
}

/**
 * Extract date, type, failure-message, recording, filename
 * @param {string} row 
 * @returns {object}
 */
export function extractInfos(row) {
    const regex = /^\d{2}(\d{2}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),\d+\s-\s([A-Z]+)\s-\s(.*?)(recording (\d+)(?: \(file: (.*?)\))?)(?=:)/;
    const match = row.match(regex);
    
    if (!match) return null;

    const infos = {
        date: match[1],
        type: match[2],
        "failure-message": match[3].replace(/ for $/, '').trim(),
        recording: parseInt(match[5], 10)
    };

    if (match[6]) {
        infos.filename = match[6];
    }

    return infos;
}


/**
 * Process the raw log text and return a nested json array
 * @param {string} content
 */
export function processLogText(content) {
    const lines = content.split('\n');
    
    const results = [];
    
    for (const line of lines) {
        if (!line.trim()) continue;
        
        const infos = extractInfos(line);
        if (!infos) continue;
        const { row, client } = splitClientInfo(line);
        const obj = extractObject(row)
        // `timestamp` (YYYY-MM-DD) follows the other modules' edits and feeds components/DateRange.vue
        const data = { ...infos, timestamp: `20${infos.date.slice(0, 8)}`, ...client, details: obj }
        const parameters = data.details?.messages?.[0]?.parameters?.[0];
        data.iso_639 = data.filename?.replace(/LL.Q\d+_\((.+?)\).+/g, "$1") || (parameters && parameters[0] !== '[' ? parameters : null);
        data.qid = data.filename?.replace(/LL.(Q\d+)_\(.+/g, "$1") || '-';
        if(data.details) data.details.info = data.details?.info?.replace(/'[a-z]+(-[a-z]+)?' (is not a known language code.)/, '$2') || data.details?.info || '';
        results.push(data);
    }
    
    return results;
}


/**
 * Merge a freshly downloaded log into the local one, keeping both histories.
 * The server rotates its log, so the local file holds legacy lines the download lacks.
 * Identical lines are matched by count, so genuine duplicates are not collapsed.
 * Result is sorted by the leading timestamp (stable).
 * @param {string} localText
 * @param {string} downloadedText
 * @returns {{text: string, kept: number, added: number}} kept = local lines absent from the
 *   download (legacy), added = downloaded lines absent locally (new)
 */
export function mergeLogs(localText, downloadedText) {
    const toLines = (text) => text.split('\n').filter((line) => line.trim());
    const local = toLines(localText);
    const downloaded = toLines(downloadedText);

    const count = (lines) => lines.reduce((m, l) => m.set(l, (m.get(l) || 0) + 1), new Map());
    const localCounts = count(local);
    const downloadedCounts = count(downloaded);

    const seen = new Map();
    const added = downloaded.filter((line) => {
        const n = (seen.get(line) || 0) + 1;
        seen.set(line, n);
        return n > (localCounts.get(line) || 0);
    });
    const kept = local.filter((line) => {
        const n = (downloadedCounts.get(line) || 0);
        downloadedCounts.set(line, n - 1);
        return n <= 0;
    });

    const merged = [...local, ...added].sort((a, b) => a.slice(0, 23).localeCompare(b.slice(0, 23)));
    return { text: merged.join('\n') + '\n', kept: kept.length, added: added.length };
}

