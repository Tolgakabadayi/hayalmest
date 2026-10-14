import webpush from 'web-push';
import { safeReadJson, safeWriteJson } from './safeStorage';

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

const FILE_NAME = 'pushSubscriptions.json';

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

export function getStoredSubscriptions(): PushSubscriptionData[] {
  return safeReadJson<PushSubscriptionData[]>(FILE_NAME, []);
}

export function saveSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  waiterId?: string;
  waiterName?: string;
  userAgent?: string;
}): boolean {
  try {
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

    safeWriteJson(FILE_NAME, filtered);
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
    safeWriteJson(FILE_NAME, updated);
  } catch (err) {
    console.error('Error removing subscription:', err);
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, any>;
  vibrate?: number[];
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

export async function sendPushToWaiters(payload: PushNotificationPayload): Promise<{
  successCount: number;
  failureCount: number;
  totalSubscribers: number;
}> {
  const subs = getStoredSubscriptions();
  if (subs.length === 0) {
    console.log('[WebPush] No subscribers currently registered in pushSubscriptions.json');
    return { successCount: 0, failureCount: 0, totalSubscribers: 0 };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-192.png',
    image: payload.image || '/icons/garson-icon.jpg', // Rich visual banner on lock screen
    tag: payload.tag || `hayalmest-${Date.now()}`,
    vibrate: payload.vibrate || [500, 200, 500, 200, 500, 200, 700], // Strong Meyhane call pattern
    data: {
      url: '/garson',
      timestamp: Date.now(),
      ...payload.data,
    },
    actions: payload.actions || [
      { action: 'complete', title: '✅ Masaya Gidildi' },
      { action: 'open', title: '📲 Masayı Aç' },
    ],
  });

  let successCount = 0;
  let failureCount = 0;
  const expiredEndpoints: string[] = [];

  for (const sub of subs) {
    try {
      // TTL: 300 seconds, urgency: 'high' forces instant wakeup and screen lighting on Android/iOS
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        notificationPayload,
        {
          TTL: 300,
          urgency: 'high',
        }
      );
      successCount++;
    } catch (err: any) {
      failureCount++;
      // If 410 (Gone) or 404 (Not Found), subscription is revoked or expired
      if (err.statusCode === 410 || err.statusCode === 404) {
        expiredEndpoints.push(sub.endpoint);
      } else {
        console.warn(`[WebPush] Delivery warning (${sub.endpoint.slice(0, 30)}...):`, err.message);
      }
    }
  }

  // Clean up expired tokens
  if (expiredEndpoints.length > 0) {
    const remaining = subs.filter(s => !expiredEndpoints.includes(s.endpoint));
    safeWriteJson(FILE_NAME, remaining);
  }

  console.log(`[WebPush] Sent to ${successCount} devices (${failureCount} failed)`);
  return { successCount, failureCount, totalSubscribers: subs.length };
}
