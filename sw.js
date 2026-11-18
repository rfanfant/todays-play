// Today's Play service worker: lets the app open without a connection.
// Pages and files from this site are fetched fresh when online (so updates show up right away)
// and served from the cache when offline. Ticketmaster, Deezer and iTunes calls are never cached.
const CACHE = "todays-play-v1";
const SHELL = ["./", "index.html", "offline.html", "privacy.html", "manifest.webmanifest",
               "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(async () => (await caches.match(req)) ||
        (req.mode === "navigate" ? caches.match("offline.html") : Response.error()))
  );
});
