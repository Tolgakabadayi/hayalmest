import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

// Permanent VAPID Keys for HayalMest Waiter PWA Push Notifications
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BLwNaVvcL2v98WFkJWk-qzcXNKm3-J2XQGD3BTl2W48Bmbujr7fHtNCfOWYoHIYAzmgk98ll2C0WGqZbQW-1Uzg';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'fXV9VLNcjwtNfTLWELUZpWbJFNsFxQm4-R4tqQnuo8Y';
const VAPID_SUBJECT = 'mailto:info@hayalmest.com';

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  waiterId?: string;
  waiterName?: string;
  userAgent?: string;
  updatedAt: string;
}

const SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'data', 'pushSubscriptions.json');

function ensureDataDir() {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

export function getStoredSubscriptions(): PushSubscriptionData[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
    return JSON.parse(data) || [];
  } catch (err) {
    console.error('Error reading push subscriptions:', err);
    return [];
  }
}

export function saveSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  waiterId?: string;
  waiterName?: string;
  userAgent?: string;
}): boolean {
  try {
    ensureDataDir();
    const current = getStoredSubscriptions();
    const filtered = current.filter(s => s.endpoint !== sub.endpoint);
    
    filtered.push({
      endpoint: sub.endpoint,
      keys: sub.keys,
      waiterId: sub.waiterId,
      waiterName: sub.waiterName,
      userAgent: sub.userAgent,
      updatedAt: new Date().toISOString(),
    });

    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving push subscription:', err);
    return false;
  }
}

export function removeSubscription(endpoint: string): void {
  try {
    const current = getStoredSubscriptions();
    const updated = current.filter(s => s.endpoint !== endpoint);
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error removing subscription:', err);
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  vibrate?: number[];
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

export async function sendPushToWaiters(payload: PushNotificationPayload): Promise<{
  successCount: number;
  failureCount: number;
}> {
  const subs = getStoredSubscriptions();
  if (subs.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icons/garson-icon.jpg',
    badge: payload.badge || '/icons/garson-icon.jpg',
    tag: payload.tag || 'hayalmest-service-call',
    vibrate: payload.vibrate || [300, 100, 300, 100, 400],
    data: {
      url: '/garson',
      timestamp: Date.now(),
      ...payload.data,
    },
    actions: payload.actions || [
      { action: 'open', title: '📲 Talebi Aç' },
      { action: 'dismiss', title: 'Tamam' },
    ],
  });

  let successCount = 0;
  let failureCount = 0;
  const expiredEndpoints: string[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        notificationPayload
      );
      successCount++;
    } catch (err: any) {
      failureCount++;
      // If 410 (Gone) or 404 (Not Found), subscription is revoked or expired
      if (err.statusCode === 410 || err.statusCode === 404) {
        expiredEndpoints.push(sub.endpoint);
      } else {
        console.warn(`Web push delivery error (${sub.endpoint.slice(0, 35)}...):`, err.message);
      }
    }
  }

  // Clean up expired tokens
  if (expiredEndpoints.length > 0) {
    const remaining = subs.filter(s => !expiredEndpoints.includes(s.endpoint));
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(remaining, null, 2), 'utf-8');
  }

  return { successCount, failureCount };
}
