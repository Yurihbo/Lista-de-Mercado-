const CACHE_NAME = "lista-mercado-v2"; // 🔥 muda versão sempre que atualizar

const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./images/corredores.png"
];

// Instala
self.addEventListener("install", event => {
  self.skipWaiting(); // força atualizar
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Ativa
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // limpa cache antigo
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch (network first 🔥)
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(() => caches.match(event.request))
  );
});
