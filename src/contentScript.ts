'use strict';

import { storage } from '@extend-chrome/storage'

(async function () {
    var haloClientId = await storage.local.get('haloClientId').then(({ haloClientId }) => {
        return haloClientId;
    });
    
    var haloClientSecret = await storage.local.get('haloClientSecret').then(({ haloClientSecret }) => {
        return haloClientSecret;
    });

    console.log('test');
})();

