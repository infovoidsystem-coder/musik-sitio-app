const CACHE = "musik-club-v80";
const ASSETS = [
  "./club.html",
  "./member.html",
  "./manifest.webmanifest",
  "./club.css",
  "./member.css",
  "./club.js",
  "./member.js",
  "./payments.js",
  "./payment-profile.css",
  "./billing.js",
  "./payment.html",
  "./site-extras.js",
  "./auth.js",
  "./auth-config.js",
  "./styles.css",
  "./public-hardware.css",
  "./light-lilac.css",
  "./home-persona.css",
  "./home-persona-spacing.css",
  "./home-controls-depth.css",
  "./nav-state.css",
  "./assets/musik-logo-hd.png",
  "./assets/musik-app-180.png",
  "./assets/musik-app-192.png",
  "./assets/musik-app-512.png",
];
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.all(
          ASSETS.map((url) =>
            fetch(url, { cache: "reload" })
              .then((response) => cache.put(url, response))
              .catch(() => {}),
          ),
        ),
      )
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
  const isNav =
    event.request.mode === "navigate" ||
    (event.request.destination === "" &&
      event.request.headers.get("accept")?.includes("text/html"));
  event.respondWith(
    fetch(isNav ? new Request(event.request.url, { cache: "reload" }) : event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
