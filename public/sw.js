/* Béninois du Monde — service worker « lecture hors ligne ».
   Périmètre volontairement étroit :
   - les guides que le membre a choisi d'enregistrer (cache « bdm-guides ») sont servis
     hors connexion et rafraîchis à chaque visite en ligne ;
   - les fichiers statiques de Next (/_next/static) sont pris sur le réseau et gardés en copie ;
   - toute autre navigation passe par le réseau ; hors connexion, la page /hors-ligne s'affiche.
   Jamais de mise en cache des pages privées (espace membre, admin, connexion, API). */

const VERSION = "v1";
const GUIDES = `bdm-guides-${VERSION}`;
const ASSETS = `bdm-assets-${VERSION}`;
const FALLBACK = "/hors-ligne";
const PRIVE = ["/compte", "/admin", "/api", "/connexion", "/inscription", "/en/sign-in", "/en/join", "/publier", "/recherche"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(GUIDES).then((c) => c.add(FALLBACK)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("bdm-") && k !== GUIDES && k !== ASSETS).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  const d = event.data || {};
  if (d.type === "save" && typeof d.url === "string") {
    event.waitUntil(
      (async () => {
        const guides = await caches.open(GUIDES);
        await guides.add(d.url);
        if (Array.isArray(d.assets) && d.assets.length) {
          const assets = await caches.open(ASSETS);
          await Promise.all(d.assets.map((a) => assets.add(a).catch(() => {})));
        }
        const clients = await self.clients.matchAll();
        clients.forEach((c) => c.postMessage({ type: "saved", url: d.url }));
      })().catch(async () => {
        const clients = await self.clients.matchAll();
        clients.forEach((c) => c.postMessage({ type: "save-failed", url: d.url }));
      }),
    );
  }
  if (d.type === "remove" && typeof d.url === "string") {
    event.waitUntil(caches.open(GUIDES).then((c) => c.delete(d.url)));
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  /* Fichiers statiques de Next : réseau d'abord (toujours à jour en ligne, y compris en
     développement), copie gardée pour le hors connexion. */
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(ASSETS).then(async (c) => {
        try {
          const res = await fetch(req);
          if (res.ok) c.put(req, res.clone()).catch(() => {});
          return res;
        } catch (e) {
          const hit = await c.match(req);
          if (hit) return hit;
          throw e;
        }
      }),
    );
    return;
  }

  /* Navigations : réseau d'abord ; la copie d'un guide enregistré est rafraîchie ;
     hors connexion, le guide enregistré ou la page d'attente. */
  if (req.mode === "navigate") {
    if (PRIVE.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"))) return;
    const key = url.pathname;
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && res.type === "basic") {
            const copie = res.clone();
            caches.open(GUIDES).then(async (c) => { if (await c.match(key)) await c.put(key, copie); }).catch(() => {});
          }
          return res;
        })
        .catch(async () => (await caches.match(key)) || (await caches.match(FALLBACK)) || Response.error()),
    );
  }
});
