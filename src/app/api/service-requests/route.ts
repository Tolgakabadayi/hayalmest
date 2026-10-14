import { NextResponse } from 'next/server';
import { getServiceRequests, addServiceRequest } from '@/lib/serviceRequestsStorage';
import { sendPushToWaiters } from '@/lib/pushNotifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const requests = getServiceRequests();
    return NextResponse.json(
      { success: true, data: requests },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/service-requests error:', error);
    return NextResponse.json(
      { success: false, error: 'Talepler yüklenemedi.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.tableId || !body.tableName || !body.type) {
      return NextResponse.json({ 
        success: false, 
        error: 'Masa bilgisi ve çağrı tipi zorunludur.' 
      }, { status: 400 });
    }

    const titles: Record<string, string> = {
      waiter: 'Garson Çağrısı',
      ice_water: 'Buz & Su Talebi',
      bill: 'Hesap Talebi',
      cutlery: 'Servis / Çatal-Bıçak Talebi',
      order: 'Menü Siparişi',
      custom: 'Özel Talep',
    };

    const newReq = addServiceRequest({
      tableId: body.tableId,
      tableName: body.tableName,
      sectionId: body.sectionId,
      sectionName: body.sectionName,
      type: body.type,
      title: body.title || titles[body.type] || 'Servis Talebi',
      note: body.note || '',
      items: body.items || undefined,
      totalAmount: typeof body.totalAmount === 'number' ? body.totalAmount : undefined,
    });

    // Send push notification to all subscribed waiter phones (vibration & screen-off wakeup)
    try {
      const isOrder = newReq.type === 'order';
      const isBill = newReq.type === 'bill';
      const isWater = newReq.type === 'ice_water';

      const itemsSummary = newReq.items && newReq.items.length > 0 
        ? `${newReq.items.length} çeşit ürün (${newReq.totalAmount ? newReq.totalAmount.toLocaleString('tr-TR') + ' ₺' : ''})` 
        : '';

      let callTitle = `🛎️ ${newReq.tableName} — GARSON ÇAĞRISI`;
      let bannerImage = '/banners/waiter.jpg';

      if (isBill) {
        callTitle = `💳 ${newReq.tableName} — HESAP İSTİYOR`;
        bannerImage = '/banners/bill.jpg';
      } else if (isWater) {
        callTitle = `🧊 ${newReq.tableName} — BUZ & SU TALEBİ`;
        bannerImage = '/banners/ice-water.jpg';
      } else if (isOrder) {
        callTitle = `🍲 ${newReq.tableName} — YEMEK SİPARİŞİ`;
        bannerImage = '/banners/order.jpg';
      }

      // Clean section name (strip parenthetical text like '(Keyif & Muhabbet)')
      const cleanSection = newReq.sectionName ? newReq.sectionName.split('(')[0].trim() : '';

      let bodyText = '';
      if (isOrder) {
        const orderPreview = newReq.items ? newReq.items.map(it => `${it.quantity}x ${it.name}`).slice(0, 3).join(', ') : '';
        bodyText = `${cleanSection ? '📍 ' + cleanSection + ' • ' : ''}${orderPreview ? orderPreview : itemsSummary}${newReq.note ? ' • Not: "' + newReq.note + '"' : ''}`;
      } else if (newReq.note) {
        bodyText = `${cleanSection ? '📍 ' + cleanSection + ' • ' : ''}💬 "${newReq.note}"`;
      } else {
        bodyText = `${cleanSection ? '📍 ' + cleanSection + ' • ' : ''}Misafir masada servis bekliyor.`;
      }

      sendPushToWaiters({
        title: callTitle,
        body: bodyText,
        image: bannerImage,
        tag: `call-${newReq.tableId}-${Date.now()}`,
        data: {
          request: newReq,
          requestId: newReq.id,
          tableId: newReq.tableId,
          type: newReq.type,
          url: '/garson',
        },
        vibrate: [500, 200, 500, 200, 500, 200, 700],
      }).catch(err => console.error('Push broadcast error:', err));
    } catch (pushErr) {
      console.error('Push dispatch failed:', pushErr);
    }

    return NextResponse.json({ success: true, data: newReq }, { status: 201 });
  } catch (error) {
    console.error('POST /api/service-requests error:', error);
    return NextResponse.json({ success: false, error: 'Talep iletilemedi.' }, { status: 500 });
  }
}
