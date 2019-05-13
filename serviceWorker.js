
(function () {
  'use strict';

  const cacheName = 'AuditM v0.1.4';

  //Files to save in cache

  var files = [
    './index.html'
  ];
  //files=[];
  //Adding `install` event listener
  self.addEventListener('install', (event) => {
    console.info('Event: Install');

    event.waitUntil(
      caches.open(cacheName)
        .then((cache) => {
          //[] of files to cache & if any of the file not present `addAll` will fail
          return cache.addAll(files)
            .then(() => {
              console.info('All files are cached');
              return self.skipWaiting(); //To forces the waiting service worker to become the active service worker
            })
            .catch((error) => {
              console.error('Failed to cache', error);
            })
        })
    );
  });

  /*
    FETCH EVENT: triggered for every request made by index page, after install.
  */

  //Adding `fetch` event listener
  self.addEventListener('fetch', (event) => {
    let request = event.request;
    console.log('Fetch ' + request.url);
    return event.respondWith(
      caches.open(cacheName).then(function (cache) {
        return cache.match(request).then(function (matching) {
          if (matching) {
            let fetchPromise = fetch(request).then(function (networkResponse) {
              console.info('Event: Cache new file');
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
            return matching || fetchPromise;
          } else {
            console.log('Serve from network');
            return fetch(request).then(function (networkResponse) {
              console.info('Event: Cache new file');
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          }

        });

      }));
  })
  function update(request) {
    //this is where we call the server to get the newest version of the 
    //file to use the next time we show view
    console.log('Update cache');
    return caches.open(cacheName).then(function (cache) {
      return fetch(request).then(function (response) {
        return cache.put(request, response);
      });
    });
  }


  /*
    ACTIVATE EVENT: triggered once after registering, also used to clean up caches.
  */

  //Adding `activate` event listener
  self.addEventListener('activate', (event) => {
    console.info('Event: Activate');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== cacheName) {
              return caches.delete(cache); //Deleting the old cache (cache v1)
            }
          })
        );
      })
        .then(function () {
          console.info("Old caches are cleared!");
          return self.clients.claim();
        })
    );
  });





})();


