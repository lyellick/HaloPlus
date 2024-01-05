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

            for (let i = 0; i < data.tickets.length; i++) {
                var agent = await getData(`${location.origin}/api/agent/${data.tickets[i].agent_id}`, auth.access_token);
                data.tickets[i].agent_name = agent.name;
            }

            const tree = ticketTree(data.tickets);
            document.getElementById('mainlist').innerHTML = '';
            document.getElementById('mainlist').setAttribute("style", "overflow: overlay;");

            var kanban = '';

            kanban += `<div class="d-flex flex-column p-4" style="gap:.5rem;">`;

            for (let p = 0; p < tree.length; p++) {
                auth = await authenticate();
                kanban += `<div>`;

                var project = tree[p];
                var projectUri = `${location.origin}/tickets?id=${project.id}`;

                kanban += `<div class="d-flex flex-row align-items-center justify-content-between pb-2">`;
                kanban += `<div class="h5"><a href="${projectUri}" target="_blank">${addPadding(project.id)}</a> - ${project.summary}</div>`;
                kanban += `<div class="pl-3">${statusTypes[project.status_id]}</div>`;
                kanban += `</div>`;

                kanban += `<div class="pl-4 py-2" style="display: -webkit-box;overflow:auto;">`;

                var statuses = groupByStatus(project.children, statusTypes);

                if (!Object.keys(statuses).length) {
                    kanban += `<div>Tasks Not Present</div>`;
                }

                Object.entries(statuses).forEach(async ([key, value]) => {
                    kanban += `<div style="width:30rem;">`;
                    kanban += `<div class="h5 pb-2">${key}</div>`;
                    kanban += `<div class="px-2">`;
                    for (let c = 0; c < value.length; c++) {
                        kanban += `<div class="p-2 bg-dark mb-2">`;
                        var child = value[c];
                        var childUri = `${location.origin}/tickets?id=${child.id}`;
                        kanban += `<div class="d-flex flex-row align-items-center justify-content-between pb-2">`;
                        kanban += `<a href="${childUri}" target="_blank">${addPadding(child.id)}</a>`;
                        kanban += `<div>${child.agent_name}</div>`;
                        kanban += `</div>`;

                        kanban += `<div class="h6 bold">${child.summary}</div>`;
                        kanban += `<p>${trimSentence(child.details, 180)}</p>`;
                        kanban += `</div>`;
                    }
                    kanban += `</div>`;
                    kanban += `</div>`;
                });

                kanban += `</div>`;

                kanban += `</div>`;
            }

            kanban += `</div>`;

            document.getElementById('mainlist').innerHTML = kanban;
        });
    });
})();

function trimSentence(sentence, maxLength) {
    if (sentence.length > maxLength) {
        return sentence.substring(0, maxLength) + "...";
    } else {
        return sentence;
    }
}

function addPadding(number) {
    let numberString = number.toString();
    const desiredLength = 7;
    let paddedNumber = numberString.padStart(desiredLength, '0');

    return paddedNumber;
}

function groupByStatus(children, statusTypes) {
    var statuses = {};

    for (let c = 0; c < children.length; c++) {
        var child = children[c];
        const statusId = statusTypes[child.status_id];

        if (!statuses[statusId]) {
            statuses[statusId] = [];
        }

        statuses[statusId].push(child);
    }

    return statuses;
}

async function getAgentById(id, token) {
    if (id) {
        var agent = await getData(`${location.origin}/api/agent/${id}`, token);
        return agent;
    }
    return null;
}

async function getStatusTypes(token) {
    const types = await getData(`${location.origin}/api/status`, token);
    return types.reduce((result, item) => {
        result[item.id] = item.name;
        return result;
    }, {});
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

