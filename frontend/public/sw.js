// Service Worker for PWA Push Notifications
const CACHE_NAME = "aquaculture-v1";
const urlsToCache = [
  "/",
  "/offline.html",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/alert-icon.png",
  "/icons/badge.png",
  "/icons/view.png",
  "/icons/close.png",
];

// Install Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Push Event - Handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  let notificationData;

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: "Nouvelle alerte",
        body: event.data.text() || "Vous avez une nouvelle alerte",
        icon: "/icons/alert-icon.png",
        badge: "/icons/badge.png",
      };
    }
  } else {
    notificationData = {
      title: "Nouvelle alerte",
      body: "Vous avez une nouvelle alerte",
      icon: "/icons/alert-icon.png",
      badge: "/icons/badge.png",
    };
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon || "/icons/alert-icon.png",
    badge: notificationData.badge || "/icons/badge.png",
    tag: notificationData.tag || "alert",
    data: notificationData.data || {},
    actions: notificationData.actions || [
      {
        action: "view",
        title: "Voir l'alerte",
        icon: "/icons/view.png",
      },
      {
        action: "dismiss",
        title: "Ignorer",
        icon: "/icons/close.png",
      },
    ],
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    vibrate:
      notificationData.severity === "CRITICAL"
        ? [200, 100, 200, 100, 200]
        : [200, 100, 200],
    sound:
      notificationData.severity === "CRITICAL"
        ? "/sounds/critical-alert.mp3"
        : "/sounds/alert.mp3",
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationOptions
    )
  );
});

// Notification Click Event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  const notificationData = event.notification.data;
  let targetUrl = "/";

  if (event.action === "view") {
    targetUrl = notificationData.url || `/alerts/${notificationData.alertId}`;
  } else if (event.action === "dismiss") {
    // Just close the notification
    return;
  } else {
    // Default click action
    targetUrl = notificationData.url || `/alerts/${notificationData.alertId}`;
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }

        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Background Sync Event (for offline functionality)
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle background sync tasks
      console.log("Background sync event:", event)
    );
  }
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Message Event - Handle messages from the main thread
self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Handle push subscription changes
self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("Push subscription changed:", event);

  event.waitUntil(
    // Handle subscription change
    fetch("/api/notifications/subscription-change", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        oldSubscription: event.oldSubscription,
        newSubscription: event.newSubscription,
      }),
    })
  );
});
