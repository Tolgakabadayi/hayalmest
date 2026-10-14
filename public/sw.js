// HayalMest Garson - Service Worker for PWA & Background Push Notifications
const CACHE_NAME = 'hayalmest-garson-v1';

self.addEventListener('install', (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Background Push Notification Event (Handles screen-off wakeups and vibration)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Masa Çağrısı',
        body: event.data.text(),
      };
    }
  }

  const title = data.title || '🔔 HayalMest: Yeni Masa Çağrısı';
  const options = {
    body: data.body || 'Masadan servis talebi iletildi.',
    icon: data.icon || '/icons/garson-icon.jpg',
    badge: data.badge || '/icons/garson-icon.jpg',
    vibrate: data.vibrate || [400, 150, 400, 150, 500],
    tag: data.tag || `hayalmest-${Date.now()}`,
    renotify: true,
    requireInteraction: true, // Keep notification visible until actioned
    data: data.data || { url: '/garson' },
    actions: [
      { action: 'open', title: '📲 Masaya Git' },
      { action: 'dismiss', title: 'Kapat' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Handler - Focus or Open Waiter Panel
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/garson';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a waiter panel window is already open, focus it and refresh
      for (const client of clientList) {
        if (client.url.includes('/garson') && 'focus' in client) {
          client.postMessage({ type: 'NEW_CALL_ARRIVED' });
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
