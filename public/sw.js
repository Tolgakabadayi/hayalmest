// HayalMest Garson - Service Worker for PWA & Background Push Notifications
const CACHE_NAME = 'hayalmest-garson-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Background Push Notification Event (Wakes up screen, vibrates & shows rich visual banner)
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

  const title = data.title || '🛎️ MASA ÇAĞRISI';
  const options = {
    body: data.body || 'Masadan servis talebi iletildi. Dokunarak açın.',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    image: data.image || '/icons/garson-icon.jpg', // Rich visual card banner on lock screen
    vibrate: data.vibrate || [500, 200, 500, 200, 500, 200, 700],
    tag: data.tag || `hayalmest-${Date.now()}`,
    renotify: true,
    requireInteraction: true, // Keep notification visible until actioned
    data: data.data || { url: '/garson' },
    actions: data.actions || [
      { action: 'complete', title: '✅ Masaya Gidildi' },
      { action: 'open', title: '📲 Masayı Aç' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Handler - Complete directly or Open Waiter Panel
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // If waiter tapped "Masaya Gidildi" directly from the lock screen notification
  if (event.action === 'complete') {
    const requestId = event.notification.data?.requestId;
    if (requestId) {
      event.waitUntil(
        fetch(`/api/service-requests/${requestId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed', completedBy: 'Kilit Ekranı' })
        }).then(() => {
          // Notify any open clients
          return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
              if (client.url.includes('/garson')) {
                client.postMessage({ type: 'REFRESH_REQUESTS' });
              }
            }
          });
        }).catch(err => console.error('Error completing from notification:', err))
      );
      return;
    }
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/garson';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a waiter panel window is already open, focus it and refresh
      for (const client of clientList) {
        if (client.url.includes('/garson') && 'focus' in client) {
          client.postMessage({ type: 'REFRESH_REQUESTS' });
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
