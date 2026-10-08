const CACHE_VERSION = "zombie-survival-v92-relic-orbit";
const CORE_CACHE = `${CACHE_VERSION}-core`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./relics.css",
  "./assets/relics-v1/A01-core.webp",
  "./assets/relics-v1/A01-armor.webp",
  "./assets/relics-v1/A01-lens.webp",
  "./assets/relics-v1/A01-boots.webp",
  "./assets/relics-v1/emblem.webp",
  "./assets/relics-v1/power.webp",
  "./studio-intro.css",
  "./manifest.webmanifest",
  "./background.webp",
  "./assets/lobby-background-v1.webp",
  "./assets/lobby-button-panel-v1.webp",
  "./assets/fonts/BlackHanSans-Regular.ttf",
  "./assets/fonts/BlackHanSans-OFL.txt",
  "./assets/fonts/DoHyeon-Regular.ttf",
  "./assets/fonts/DoHyeon-OFL.txt",
  "./assets/characters-original-v2/yupiter.webp",
  "./assets/pwa/icon-192.png",
  "./assets/pwa/icon-512.png",
  "./assets/pwa/icon-maskable-512.png",
  "./js/00-assets.js",
  "./js/studio-intro.js",
  "./js/01-core.js",
  "./js/02-upgrades.js",
  "./js/03-input.js",
  "./js/04-weapons-spawn.js",
  "./js/04-yupiter-weapons.js",
  "./js/04-ren.js",
  "./js/04-night-lord.js",
  "./js/04-zero.js",
  "./js/04-paladin.js",
  "./js/04-arc.js",
  "./js/04-terra.js",
  "./js/04-void.js",
  "./js/04-carmilla.js",
  "./js/04-vargas.js",
  "./js/04-echo.js",
  "./js/04-echo-polish.js",
  "./js/04-echo-outward.js",
  "./js/04-aria.js",
  "./js/04-aria-polish.js",
  "./js/04-aria-cull.js",
  "./js/04-moira.js",
  "./js/04-mare.js",
  "./js/04-null-zero.js",
  "./js/04-suncall.js",
  "./js/04-suncall-vfx.js",
  "./js/04-astra-constellations.js",
  "./js/04-astra.js",
  "./js/04-astra-vfx.js",
  "./js/04-mare-polish.js",
  "./js/04-mare-skills-polish.js",
  "./js/04-mare-flow.js",
  "./js/04-mare-whale.js",
  "./js/04-mare-prestige.js",
  "./js/04-bosses.js",
  "./js/05-skills.js",
  "./js/06-entities-update.js",
  "./js/07-world-render.js",
  "./js/07-hero-ultimate-background.js",
  "./js/07-fire-trail-polish.js",
  "./js/08-astra-healthbar.js",
  "./js/08-lobby-motion-art.js",
  "./js/08-lobby-motion.js",
  "./js/08-ui.js",
  "./js/08-guide.js",
  "./js/08-mobile.js",
  "./js/08-mobile-settings.js",
  "./js/08-mobile-targeting.js",
  "./js/04-oblivion.js",
  "./js/08-oblivion-ui.js",
  "./js/08-oblivion-prestige.js",
  "./js/09-main.js",
  "./js/10-lush.js",
  "./js/11-lush-presentation.js",
  "./js/11-lush-vfx.js",
  "./js/12-lush-integration.js",
  "./js/12-oblivion-art.js",
  "./js/13-oblivion-combat.js",
  "./js/14-oblivion-vfx.js",
  "./js/15-oblivion-ui.js",
  "./js/16-oblivion-integration.js",
  "./js/17-relic-data.js",
  "./js/18-relic-combat.js",
  "./js/19-relic-ui.js",
  "./js/pwa.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CORE_CACHE).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("zombie-survival-") && key !== CORE_CACHE && key !== RUNTIME_CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Let the browser handle video byte ranges; Cache.put cannot store 206 responses.
  if (request.headers?.has("range")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
      return response;
    }).catch(async () => (await caches.match(request)) || caches.match("./index.html", { ignoreSearch: true })));
    return;
  }

  const networkFirst = /\.(?:m?js|css|webmanifest)$/i.test(url.pathname);
  if (networkFirst) {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(RUNTIME_CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(async () => {
      const runtime = await caches.open(RUNTIME_CACHE);
      return (await runtime.match(request, { ignoreSearch: true })) || caches.match(request, { ignoreSearch: true });
    }));
    return;
  }

  event.respondWith(caches.match(request, { ignoreSearch: true }).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      if (response.ok) caches.open(RUNTIME_CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(() => new Response("Offline", { status: 503, statusText: "Offline" }));
  }));
});
