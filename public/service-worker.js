console.log('This is your service-worker.js file!');

const FILES_TO_CACHE = [
    "/",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/db.js",
    "/index.js",
    "/styles.css",
    "/manifest.webmanifest",
    "/index.html"
  ];

const STATIC_CACHE = `static-cache-v1`;
const RUNTIME_CACHE = `runtime-cache`;

self.addEventListener("install", function(evt) {
    evt.waitUntil(
        caches.open(STATIC_CACHE).then(cache => {
            console.log("Your files were pre-cached successfully!");
            return cache.addAll(FILES_TO_CACHE);
        })
    );
  
    self.skipWaiting();
  });

self.addEventListener(`activate`, event => {
    const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
    event.waitUntil(
        caches
            .keys()
            .then(cacheNames =>
                // return array of cache names that are old to delete
                cacheNames.filter(cacheName => !currentCaches.includes(cacheName))
            )
            .then(cachesToDelete =>
                Promise.all(
                    cachesToDelete.map(cacheToDelete => caches.delete(cacheToDelete))
                )
            )
            .then(() => self.clients.claim())
            );
        });

        self.addEventListener(`fetch`, event => {
            if (
                event.request.method !== `GET` ||
                !event.request.url.startsWith(self.location.origin)
            ) {
                event.respondWith(fetch(event.request));
                return;
            }
        
            if (event.request.url.includes(`/api/transaction`)) {
                event.respondWith(
                    caches.open(RUNTIME_CACHE).then(cache =>
                        fetch(event.request)
                            .then(response => {
                                cache.put(event.request, response.clone());
                                return response;
                            })
                            .catch(() => caches.match(event.request))
                    )
                );
                return;
            }

            event.respondWith(
                caches.match(event.request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
        
                    return caches
                        .open(RUNTIME_CACHE)
                        .then(cache =>
                            fetch(event.request).then(response =>
                                cache.put(event.request, response.clone()).then(() => response)
                            )
                        );
                })
            );
        });
        
