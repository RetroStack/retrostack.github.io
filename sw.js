/**
 * RetroStack Service Worker
 *
 * Provides offline functionality for the RetroStack PWA.
 *
 * Caching strategies:
 * - Static assets (JS, CSS, images, fonts): Cache-first
 * - HTML pages: Network-first with cache fallback
 *
 * To invalidate caches after a breaking change, increment CACHE_VERSION.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `retrostack-static-${CACHE_VERSION}`;
const PAGES_CACHE = `retrostack-pages-${CACHE_VERSION}`;

/**
 * Static assets to precache on install
 */
const PRECACHE_ASSETS = [
  "/",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/images/logo.png",
];

// =============================================================================
// Install Event
// =============================================================================

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Skip waiting to activate immediately (silent update strategy)
  self.skipWaiting();
});

// =============================================================================
// Activate Event
// =============================================================================

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Remove old versioned caches
            return (
              (name.startsWith("retrostack-static-") && name !== STATIC_CACHE) ||
              (name.startsWith("retrostack-pages-") && name !== PAGES_CACHE)
            );
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// =============================================================================
// Fetch Event
// =============================================================================

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Static assets: Cache-first strategy
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages: Network-first strategy with cache fallback
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(request, PAGES_CACHE));
    return;
  }

  // Other same-origin requests: Cache-first (e.g., JSON data)
  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a URL is a static asset that should be cached
 */
function isStaticAsset(url) {
  const pathname = url.pathname;

  // Next.js static assets
  if (pathname.startsWith("/_next/static/")) {
    return true;
  }

  // Common static file extensions
  if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|webp)$/)) {
    return true;
  }

  // Manifest and icons
  if (pathname === "/manifest.json" || pathname.includes("manifest")) {
    return true;
  }

  return false;
}

/**
 * Cache-first strategy: Try cache, then network
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed and no cache - return error
    return new Response("Network error", { status: 503, statusText: "Service Unavailable" });
  }
}

/**
 * Network-first strategy: Try network, then cache
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // No cache for this page, try returning cached homepage as fallback
    const fallback = await caches.match("/");
    if (fallback) {
      return fallback;
    }

    // Nothing available
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
  }
}
