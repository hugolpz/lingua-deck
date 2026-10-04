// projectsDataCleaner.js

/**
 * Finds the currency (unit) of a project by looking up its grant.
 * 
 * @param {Object} data - The overall data object containing 'grants'. See data.js
 * @param {string} projectId - The ID of the project to find the unit for.
 * @returns {string|undefined} The unit of the project (e.g. 'EUR', 'USD'), or undefined if not found.
 */
export function findProjectCurrency(data, projectId) {
    if (!data || !data.grants) return undefined;

    // Find the grant that includes this projectId
    const grant = data.grants.find(g => g.projectIds && g.projectIds.includes(projectId));

    if (grant) {
        return grant.unit;
    }

    return undefined;
}

/**
 * Infers freelancer payout from the project budget.
 * If a project has exactly one freelancer and no payout is defined,
 * the freelancer's payout defaults to the project's total budget.
 * 
 * @param {Array} projects - The list of parsed projects.
 * @returns {Array} The modified projects array.
 */
export function inferFreelancerPayouts(projects) {
    projects.forEach(project => {
        const team = project.freelancers || project.freelances || [];
        
        if (team.length === 1 && typeof team[0].payout === 'undefined' && typeof project.budget !== 'undefined') {
            team[0].payout = project.budget;
        }
    });

    return projects;
}

/**
 * Converts a monetary amount into EUR using fixed conversion rates.
 * 
 * @param {number} amount - The numeric monetary amount.
 * @param {string} currency - The currency unit (e.g. 'USD', 'EUR').
 * @returns {number|undefined} The computed amount in Euro.
 */
export function convertCurrencyToEUR(amount, currency) {
    if (typeof amount !== 'number') return undefined;
    if (currency === 'EUR' || currency === '€' || currency === 'euro' || currency === 'euros') {
        return amount; // already in euros
    }

    const exchangeRates = {
        'USD': 0.9,
        '$': 0.9
    };

    if (exchangeRates[currency]) {
        return amount * exchangeRates[currency];
    }

    return undefined; // Unhandled currency
}

/**
 * Traverses grants to add an 'amountEUR' property.
 * 
 * @param {Array} grants - The array of grants.
 * @returns {Array} The modified grants array.
 */
export function addEURToGrants(grants) {
    if (!grants) return [];
    
    grants.forEach(grant => {
        grant.amountEUR = convertCurrencyToEUR(grant.amount, grant.unit);
    });
    
    return grants;
}

export function addEURToProjectsAndFreelancers(projects, data) {
    if (!projects) return [];
    
    projects.forEach(project => {
        // Find parent grant to fallback units and amounts
        const grant = data && data.grants ? data.grants.find(g => g.projectIds && g.projectIds.includes(project.id)) : null;
        
        // Resolve currency via earlier lookup or native property
        const currency = project.currency || (grant ? grant.unit : undefined);
        
        // 1. Projects
        project.budgetEUR = convertCurrencyToEUR(project.budget, currency);
        
        // Fallback: If project has no budget, use the grant's budget directly
        if (typeof project.budgetEUR === 'undefined' && grant) {
            project.budgetEUR = grant.amountEUR;
            project.budget = grant.amount; // Inherit raw numeric amount as well
        }
        
        // 2. Freelancers
        const team = project.freelancers || project.freelances || [];
        team.forEach(person => {
            // Secondary inference if the project budget was just inherited
            if (team.length === 1 && typeof person.payout === 'undefined' && typeof project.budget !== 'undefined') {
                person.payout = project.budget;
            }
            person.payoutEUR = convertCurrencyToEUR(person.payout, currency);
        });
    });

    return projects;
}

/**
 * Removes MediaWiki translate tags and other HTML-like noise from project titles.
 * @param {string} title - The raw title string
 * @returns {string} The cleaned title
 */
export function titleCleaner(title) {
    if (!title) return '';
    return title.replace(/<[^>]+>/g, '').replace(/<!--T:\d+-->/g,'').trim();
}

/**
 * Traverses projects and cleans their titles.
 * @param {Array} projects - The list of parsed projects.
 * @returns {Array} The modified projects array.
 */
export function cleanProjectTitles(projects) {
    if (!projects) return [];
    
    projects.forEach(project => {
        if (project.name) {
            project.name = titleCleaner(project.name);
        }
    });

    return projects;
}
