'use strict';

import { storage } from '@extend-chrome/storage'

(async function () {
    var haloClientId = await storage.local.get('haloClientId').then(({ haloClientId }) => {
        return haloClientId;
    });

    var haloClientSecret = await storage.local.get('haloClientSecret').then(({ haloClientSecret }) => {
        return haloClientSecret;
    });

    var token = await authenticate(haloClientId, haloClientSecret);

    console.log(token);
})();

async function authenticate(haloClientId, haloClientSecret) {
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

