// HayalMest Garson - Service Worker for PWA & Background Push Notifications
const CACHE_NAME = 'hayalmest-garson-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Periodic background sync if supported by Android Chrome
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-calls') {
    event.waitUntil(
      fetch('/api/service-requests?_t=' + Date.now())
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
              for (const c of clients) {
                c.postMessage({ type: 'REFRESH_REQUESTS' });
              }
            });
          }
        })
        .catch(() => {})
    );
  }
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
    silent: false, // Ensures screen wake and audio alert even when locked
    timestamp: Date.now(),
    data: data.data || { url: '/garson' },
    actions: data.actions || [
      { action: 'complete', title: '✅ GİDİLDİ' },
      { action: 'open', title: '📲 MASAYI AÇ' }
    ]
  };

  const notifyClients = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      if (client.url.includes('/garson')) {
        client.postMessage({
          type: 'NEW_CALL_ARRIVED',
          payload: data.data?.request,
        });
      }
    }
  }).catch((err) => console.warn('Could not post to clients:', err));

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      notifyClients
    ])
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
