/**
 * @fileoverview ElectIQ Service Worker.
 * Provides offline capability by caching static assets.
 * Implements a cache-first strategy for assets, network-first for API calls.
 *
 * @module sw
 */

'use strict';

var CACHE_NAME    = 'electiq-v1';
var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
];

/* ------------------------------------------------------------------ */
/*  Install — cache static assets                                      */
/* ------------------------------------------------------------------ */

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/* ------------------------------------------------------------------ */
/*  Activate — clean up old caches                                     */
/* ------------------------------------------------------------------ */

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== CACHE_NAME; })
          .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

/* ------------------------------------------------------------------ */
/*  Fetch — cache-first for assets, network-first for API             */
/* ------------------------------------------------------------------ */

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Always use network for API calls — never serve stale election data
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(
          JSON.stringify({ error: 'You are offline. Please reconnect to get live election data.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        if (!response || response.status !== 200) { return response; }
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
