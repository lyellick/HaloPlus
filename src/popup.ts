'use strict';

import { storage } from '@extend-chrome/storage'
import 'bootstrap/dist/css/bootstrap.min.css'
import './popup.css'

(function () {
    storage.local.get('haloClientId').then(({ haloClientId }) => {
        if (haloClientId) {
            var input = document.getElementById('halo-client-id') as HTMLInputElement;
            input.value = haloClientId;
        }
    });

    storage.local.get('haloClientSecret').then(({ haloClientSecret }) => {
        if (haloClientSecret) {
            var input = document.getElementById('halo-client-secret') as HTMLInputElement;
            input.value = haloClientSecret;
        }
    });

    document.getElementById('halo-client-id')?.addEventListener('input', () => {
        var input = document.getElementById('halo-client-id') as HTMLInputElement;
        storage.local.set({ haloClientId: input.value });
    });

    document.getElementById('halo-client-secret')?.addEventListener('input', () => {
        var input = document.getElementById('halo-client-secret') as HTMLInputElement;
        storage.local.set({ haloClientSecret: input.value });
    });
})();
