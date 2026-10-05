import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { splitClientInfo, pythonLiteralToJson, extractObject, extractInfos, processLogText, mergeLogs } from './logs-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export { splitClientInfo, pythonLiteralToJson, extractObject, extractInfos, processLogText, mergeLogs };

/**
 * Process the log file and return a nested json array
 * @param {string} filePath
 */
export function processLogs(filePath) {
    return processLogText(fs.readFileSync(filePath, 'utf-8'));
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
