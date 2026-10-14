import { NextResponse } from 'next/server';
import { getVapidPublicKey, saveSubscription, removeSubscription, sendPushToWaiters } from '@/lib/pushNotifications';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    publicKey: getVapidPublicKey(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscription, waiterId, waiterName, test } = body;

    if (test) {
      // Trigger a test notification
      const result = await sendPushToWaiters({
        title: '🔔 Test Bildirimi: HayalMest Garson',
        body: 'Tebrikler! Masa çağrı ve titreşim bildirimleriniz başarıyla aktifleştirildi.',
        data: { test: true },
        vibrate: [300, 100, 300, 100, 400],
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz abonelik verisi.' },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get('user-agent') || '';
    const saved = saveSubscription({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      waiterId,
      waiterName,
      userAgent,
    });

    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Abonelik kaydedilemedi.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Bildirim aboneliği başarıyla kaydedildi.' });
  } catch (error) {
    console.error('Error handling push subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { endpoint } = await req.json();
    if (endpoint) {
      removeSubscription(endpoint);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
