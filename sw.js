// sw.js — Scale Trainer service worker (cache-first, offline-capable).
// Bump CACHE_VERSION on EVERY release. If script files are added/removed,
// update the ASSETS list to match index.html (keep boot.js last).
// (c) 2026 Peter Birchley. All rights reserved.

const CACHE_VERSION = "st-v3";

const ASSETS = [
  "./",
  "index.html",
  "styles.css",
  "config.js",
  "syllabus.js",
  "state.js",
  "storage.js",
  "scheduler.js",
  "session.js",
  "render.js",
  "dispatch.js",
  "boot.js",
  "manifest.json",
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_VERSION) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

// cache-first, fall back to network, then cache index for navigations offline
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).catch(function () {
        if (e.request.mode === "navigate") return caches.match("index.html");
      });
    })
  );
});
