/**
 * Prompt: Create a projectsDataExtractor.js script such as the data for each project is in 
 * the https://meta.wikimedia.org/wiki/Lingua_Libre/Supports wikipage's, template 
 * `Lingua Libre/Support infobox`. 
 * * Target extraction: 
 * - id, name, budget (numeric), workdays (numeric), starts, ends.
 * - freelancers: beneficiary (from main), tasks (parsed from parentheses).
 * 
 * Create a projectsDataExtractor.js script such as the data for each project is in the https://meta.wikimedia.org/wiki/Lingua_Libre/Supports wikipage's, template `Lingua Libre/Support infobox`. With template such : 
 ```
{{Lingua Libre/Support infobox
| id = 2025-wmfr-wikipages
| title = Lingua Libre Django Coordination
| sponsor1 = [[Wikimedia France]]
| sponsorlogo = [[File:Wikimedia France logo.svg|120px|alt={{labelT|Q8423370}}]]
| image   = [[File:Lingua_Libre_inventory_tool.png|300px]]
| webpage = Lingua Libre/Supports
| start   = {{dateT|2025-02||}} – discussion<br />{{dateT|2025-12||}} – coding
| ended   = {{dateT|2026-01|}} – completed
| hierarchy = {{u|Xavier Cailleau WMFr}}
| facilitator = {{u|Yug}}
| main = {{u|Yug}} (clean up, coding, migration, restructuration, lists import)
| contact = {{u|Yug}}
| budget = 1800€ (16 workdays)
}}
```
extract data and returns :
```
"projects": [
    {
      "id": "2025-wmfr-wikipages",
      "name": "Lingua Libre Django Coordination",
      "budget": 1800,
      "workdays": 16,
      "starts": "2025-02", 
      "ends": "2026-01", 
      "freelancers": [
        {
          "beneficiary": "Yug", // from main
          "tasks": ["clean up", "coding", "migration", "restructuration", "lists import" ]
          "workdays": undefined,
          "payout": undefined
        }
      ]
    }
  ]
```
 */

import { titleCleaner } from './projectsDataCleaner.js';

export async function projectsDataExtractor(mockWikitext = null) {
    let wikitext = mockWikitext;
    
    if (!wikitext) {
        try {
            const pageTitle = 'Lingua_Libre/Supports';
            const url = `https://meta.wikimedia.org/w/api.php?action=query&prop=revisions&titles=${pageTitle}&rvprop=content&formatversion=2&format=json&origin=*`;
            const response = await fetch(url);
            const data = await response.json();
            wikitext = data.query.pages[0].revisions[0].content;
        } catch (error) {
            console.error("Failed to extract project data via API:", error);
            return { projects: [] };
        }
    }
        
        // Regex to find each instance of the Support infobox template
        // Matches {{Lingua Libre/Support infobox | ... }}
        const templateRegex = /{{\s*Lingua Libre\/Support infobox\s*([\s\S]*?)\n}}/g;
        const projects = [];
        let match;

        while ((match = templateRegex.exec(wikitext)) !== null) {
            const templateBody = match[1];
            const params = {};

            // Parse parameters into key-value pairs without breaking nested templates (e.g. {{u|Yug}})
            const lines = templateBody.split('\n');
            let currentKey = null;
            lines.forEach(line => {
                const paramMatchLine = line.match(/^\s*\|\s*([^=]+?)\s*=\s*([\s\S]*)$/);
                if (paramMatchLine) {
                    currentKey = paramMatchLine[1].trim();
                    params[currentKey] = paramMatchLine[2].trim();
                } else if (currentKey) {
                    params[currentKey] += '\n' + line.trim();
                }
            });

            // --- Data Cleaning Logic ---

            // Extract budget and workdays numbers
            let budgetNum = undefined;
            if (params.budget) {
                const bMatch = params.budget.match(/\d*,?\d{3}/);
                if (bMatch) {
                    budgetNum = parseFloat(bMatch[0].replace(/,/g, ''));
                }
            }
            const workdaysNum = params.budget ? parseInt(params.budget.match(/(\d+)\s*workdays/)?.[1]) : undefined;

            // Extract ISO dates from dateT templates (e.g. "2016-01" or just "2016")
            const extractDate = (str) => str ? str.match(/\d{4}(?:-\d{2})?/)?.[0] : undefined;

            // Extract freelancers from params.main
            // Format: {{u|Name}} (task1, task2)
            // Parse freelancerr/Main field: "{{u|Yug}} (task1, task2)" or "John Smith (task1)",
            //  "Seb35 (code), VIGNERON (code, liaison), {{u|Yug}}" or "Seb35 (code:29647€), VIGNERON (code, liaison:11411€), {u|Yug}}"
            const freelancers = [];
            if (params.main) {
                // Split by comma only when not inside parentheses
                const freelancersStrings = params.main.split(/,\s*(?![^(]*\))/);
                for (const freelancerString of freelancersStrings) {
                    console.log(freelancerString)   
                    // Remove trailing periods and parse name out of parens or {{u|...}} template
                    let name = freelancerString.replace(/\([^)]+\)/g, '').replace(/\{\{u\|\s?([^}]+)\s?\}\}/i, '$1').replace(/\.$/, '').trim();
                    // Normalize name to ID format
                    name = name.toLowerCase().replace(/[\s_]+/g, '-');
                    
                    const commentsMatch = freelancerString.match(/\(([^)]+)\)/);
                    const commentsString = commentsMatch ? commentsMatch[1] : '';
                    
                    const tasks = commentsString ? commentsString.replace(/:.+$/, '').split(',').map(task => task.trim()).filter(t => t) : [];
                    const payoutMatch = commentsString.match(/:?\s*(\d+(?:[.,]\d+)?)\s*€/);
                    const payout = payoutMatch ? parseFloat(payoutMatch[1].replace(',', '.')) : undefined;
                    const workdaysMatch = commentsString.match(/(\d+)\s*workdays/i);
                    const workdays = workdaysMatch ? parseInt(workdaysMatch[1]) : undefined;
                    
                    if (name) {
                        let freelancer = {
                            beneficiary: name,
                            tasks: tasks,
                            payout: payout || undefined,
                            workdays: workdays|| undefined
                        }
                        console.log(freelancer)
                        // if (name === "vigneron") { console.log(freelancer) }
                        freelancers.push(freelancer);
                    }
                }
            }

            projects.push({
                id: params.id,
                name: titleCleaner(params.title),
                budget: budgetNum,
                workdays: workdaysNum,
                starts: extractDate(params.start),
                // ends: extractDate(params.ended),
                freelancers: freelancers
            });
        }

        console.log(`[Extractor] Successfully extracted ${projects.length} projects.`);
        return { projects };
}

// Usage:
// projectsDataExtractor().then(data => console.log(JSON.stringify(data, null, 2)));