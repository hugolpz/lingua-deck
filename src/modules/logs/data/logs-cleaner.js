import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Process the log file and return a nested json array
 * @param {string} filePath 
 */
export function processLogs(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
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

const HELP = `NAME
    logs-cleaner.js - turn the raw upload error log into a cleaned JSON file

SYNOPSIS
    node src/modules/logs/data/logs-cleaner.js [-d | --download] [-h | --help]

DESCRIPTION
    Reads upload_errors.log, located next to this script, and parses each line
    into a record: date, type, failure-message, recording, filename (when
    present), timestamp (YYYY-MM-DD, for the date range filter), details (the
    trailing {...} object, without any "| Browser: ..." trailer), browser and os
    (when the line has that trailer), iso_639 and qid (derived from the filename).
    Blank and unparsable lines are skipped.

    The result is written, pretty-printed, to upload_errors_cleaned.json next
    to this script, which the logs dashboard (ErrorView.vue) loads.

OPTIONS
    -d, --download  First fetch the latest upload_errors.log from the production
                    server over ssh (through the bastion), then clean it. The
                    download is merged into the local log: legacy lines the server
                    no longer has are kept, new ones are added, identical lines
                    are not duplicated, and the result stays in date order. The
                    local file is only written if the download succeeds.
                    ssh asks for your key passphrase / host confirmation as usual.
    -h, --help      Show this help and exit.

ENVIRONMENT (for --download, defaults in brackets)
    LOGS_SSH_JUMP     Bastion, passed to ssh -J      [yug@bastion.wmcloud.org]
    LOGS_SSH_HOST     Server holding the log         [yug@prod.lingualibre.eqiad1.wikimedia.cloud]
    LOGS_REMOTE_PATH  Log path on the server         [/srv/lingua-libre/media/logs/upload_errors.log]

FILES
    upload_errors.log           Input: one log line per upload error.
    upload_errors_cleaned.json  Output: JSON array of records. Overwritten.

EXAMPLE
    # From the project root, clean the log already in src/modules/logs/data/
    node src/modules/logs/data/logs-cleaner.js

    # Fetch the latest log from production, then clean it
    node src/modules/logs/data/logs-cleaner.js --download

    # Same fetch by hand, copying to the clipboard instead
    ssh -J yug@bastion.wmcloud.org yug@prod.lingualibre.eqiad1.wikimedia.cloud \\
        "cat /srv/lingua-libre/media/logs/upload_errors.log" | xclip -selection clipboard

EXIT STATUS
    0 on success or --help; 1 on an unknown option, a failed download or a missing
    input file (reported on stderr).

As a module:
    import { processLogs, extractInfos, extractObject, splitClientInfo, pythonLiteralToJson, mergeLogs, downloadLatestLog } from './logs-cleaner.js'
`;

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

/**
 * Download the latest log from the production server with
 * `ssh -J <jump> <host> "cat <remote path>"`, into `destPath`.
 * The download is merged into the existing file (see mergeLogs), never replacing it,
 * and the file is written only after the whole download succeeded.
 * @param {string} destPath
 * @returns {boolean} true on success
 */
export function downloadLatestLog(destPath) {
    const jump = process.env.LOGS_SSH_JUMP || 'yug@bastion.wmcloud.org';
    const host = process.env.LOGS_SSH_HOST || 'yug@prod.lingualibre.eqiad1.wikimedia.cloud';
    const remotePath = process.env.LOGS_REMOTE_PATH || '/srv/lingua-libre/media/logs/upload_errors.log';

    console.log(`Downloading ${remotePath} from ${host} (via ${jump})…`);
    // stdin/stderr stay attached so ssh can prompt for a passphrase or host confirmation
    const result = spawnSync('ssh', ['-J', jump, host, `cat ${remotePath}`], {
        stdio: ['inherit', 'pipe', 'inherit'],
        maxBuffer: 512 * 1024 * 1024,
    });
    if (result.error || result.status !== 0 || !result.stdout?.length) {
        console.error(`Download failed (${result.error?.message || `ssh exit code ${result.status}`}). Local log left untouched.`);
        return false;
    }
    const downloaded = result.stdout.toString('utf-8');
    const local = fs.existsSync(destPath) ? fs.readFileSync(destPath, 'utf-8') : '';
    const { text, kept, added } = mergeLogs(local, downloaded);

    const tmpPath = `${destPath}.download`;
    fs.writeFileSync(tmpPath, text);
    fs.renameSync(tmpPath, destPath);
    console.log(`Downloaded ${(result.stdout.length / 1024 / 1024).toFixed(1)} MB: ${added} new lines added, ${kept} legacy lines kept (not on the server). Saved to ${destPath}`);
    return true;
}

// If run directly via node
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
    const args = process.argv.slice(2);
    const known = ['-h', '--help', '-d', '--download'];
    const unknown = args.filter((arg) => !known.includes(arg));

    if (args.includes('-h') || args.includes('--help')) {
        console.log(HELP);
    } else if (unknown.length) {
        console.error(`Unknown option: ${unknown.join(' ')}\nRun with --help for usage.`);
        process.exitCode = 1;
    } else {
        const logFilePath = path.join(__dirname, 'upload_errors.log');
        const wantsDownload = args.includes('-d') || args.includes('--download');

        if (wantsDownload && !downloadLatestLog(logFilePath)) {
            process.exitCode = 1;
        } else if (fs.existsSync(logFilePath)) {
            const data = processLogs(logFilePath);
            const outputPath = path.join(__dirname, 'upload_errors_cleaned.json');
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
            console.log(`Processed ${data.length} records. Saved to ${outputPath}`);
        } else {
            console.error(`File not found: ${logFilePath}\nRun with --help for usage.`);
            process.exitCode = 1;
        }
    }
}
