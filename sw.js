"use strict";
/* Tracker service worker: makes the app load offline.
   Bump CACHE whenever index.html or any listed file changes, or installed
   copies keep serving the old version. */
var CACHE = "tracker-pwa-v6";
var FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE; })
        .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* Cache first, so it opens instantly and works with no connection.
   Page navigations that miss the cache fall back to index.html. */
self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method!=="GET" || new URL(req.url).origin!==self.location.origin) return;
  e.respondWith(
    caches.match(req, {ignoreSearch:true}).then(function(hit){
      if(hit) return hit;
      return fetch(req).catch(function(){
        if(req.mode==="navigate") return caches.match("./index.html");
        return Response.error();
      });
    })
  );
});

/* The page asks for this when the user taps "Update". */
self.addEventListener("message", function(e){
  if(e.data==="skipWaiting") self.skipWaiting();
});
