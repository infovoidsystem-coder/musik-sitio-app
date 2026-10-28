const CACHE = "musik-club-v14";
const ASSETS = [
  "./club.html",
  "./member.html",
  "./manifest.webmanifest",
  "./club.css",
  "./member.css",
  "./club.js",
  "./member.js",
  "./payments.js",
  "./billing.js",
  "./payment.html",
  "./site-extras.js",
  "./auth.js",
  "./auth-config.js",
  "./styles.css",
  "./assets/musik-logo-hd.png",
  "./assets/musik-app-180.png",
  "./assets/musik-app-192.png",
  "./assets/musik-app-512.png",
];
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
