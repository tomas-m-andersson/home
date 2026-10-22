// [tomasandersson] – service worker.
// Sparar själva sidan så att appen startar snabbt och även utan nät.
// Anteckningarna (GitHub) cachas ALDRIG här – de hämtas alltid färskt.
const CACHE = "vardagssidan-v5";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./favicon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return; // GitHub-API och typsnitt går direkt till nätet

  // Sidan: hämta ny version först, använd sparad kopia om nätet saknas
  if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put("./index.html", copy));
        return res;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }
  // Ikoner m.m.: sparad kopia först
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
