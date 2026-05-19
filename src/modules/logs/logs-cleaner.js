import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    return JSON.parse(jsonStr);
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
        const obj = extractObject(line)
        const data = { ...infos, details: obj }
        if (data) {
            let parameters = data.details?.messages?.[0]?.parameters?.[0];
            data.iso_639 = data.filename?.replace(/LL.Q\d+_\((.+?)\).+/g, "$1") || parameters && parameters[0]!== '['? parameters: null;
            data.qid = data.filename?.replace(/LL.(Q\d+)_\(.+/g, "$1") || '-';
            if(data.details) data.details.info = data.details?.info?.replace(/'[a-z]+(-[a-z]+)?' (is not a known language code.)/, '$2') || data.details?.info || '';
            results.push(data);
        }
    }
    
    return results;
}

// If run directly via node
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
    const logFilePath = path.join(__dirname, 'upload_errors.log');
    if (fs.existsSync(logFilePath)) {
        const data = processLogs(logFilePath);
        const outputPath = path.join(__dirname, 'upload_errors_cleaned.json');
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`Processed ${data.length} records. Saved to ${outputPath}`);
    } else {
        console.error(`File not found: ${logFilePath}`);
    }
}
