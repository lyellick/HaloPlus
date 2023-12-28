'use strict';

import { storage } from '@extend-chrome/storage'

(async function () {
    waitFor('[data-id=exporttocsv]').then((elm) => {
        document.querySelector('[data-id=switchlistviewKanban]').insertAdjacentHTML('afterend', `<div id="enhancedKanbanView" data-id="switchlistviewKanban" role="option" class="item"><i class="fa fa-align-left"></i>Enhanced Kanban</div>`);
        document.getElementById('enhancedKanbanView').addEventListener('click', async () => {
            var auth = await authenticate();
            document.querySelector('[data-id=switchlistviewKanban]').click();
            document.getElementById('enhancedKanbanView').remove();
            var params = getQueryParameters();
            var statusTypes = await getStatusTypes(auth.access_token);
            var data = await getData(`${location.origin}/api/tickets?list_id=${params.selid}&ticketarea_id=${params.area}`, auth.access_token);
            const tree = ticketTree(data.tickets);
            console.log(tree);
        });
    });
})();

async function getStatusTypes(token) {
    var types = await getData(`${location.origin}/api/status`, token);
    return types.map(item => {
        return {
            id: item.id,
            name: item.name
        };
    });
}

function ticketTree(tickets) {
    const ticketMap = new Map();

    tickets.forEach(ticket => {
        ticket.children = [];
        ticketMap.set(ticket.id, ticket);
    });

    const rootTickets = [];

    tickets.forEach(ticket => {
        if (ticket.parent_id && ticketMap.has(ticket.parent_id)) {
            const parentTicket = ticketMap.get(ticket.parent_id);
            parentTicket.children.push(ticket);
        } else {
            rootTickets.push(ticket);
        }
    });

    return rootTickets;
}

async function getData(url, token) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            return await response.json();
        } else {
            throw new Error(`Request failed with status: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Fetch error:', error.message);
        throw error;
    }
}

function getQueryParameters() {
    const queryString = window.location.search;
    if (!queryString) {
        return {};
    }
    const urlSearchParams = new URLSearchParams(queryString);
    const queryParams = {};
    for (const [key, value] of urlSearchParams.entries()) {
        queryParams[key] = value;
    }

    return queryParams;
}

function waitFor(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

async function authenticate() {
    var haloClientId = await storage.local.get('haloClientId').then(({ haloClientId }) => {
        return haloClientId;
    });

    var haloClientSecret = await storage.local.get('haloClientSecret').then(({ haloClientSecret }) => {
        return haloClientSecret;
    });

    const url = `${location.origin}/auth/token`;
    const data = new URLSearchParams();
    data.append('grant_type', 'client_credentials');
    data.append('client_id', haloClientId);
    data.append('client_secret', haloClientSecret);
    data.append('scope', 'all');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: data
        });

        if (!response.ok) {
            throw new Error(`Halo PSA Authentication Failed: Status ${response.status}`);
        }

        const result = await response.json();

        return result;
    } catch (error) {
        console.error('Halo PSA Authentication Failed:', error.message);
        throw error;
    }
}

