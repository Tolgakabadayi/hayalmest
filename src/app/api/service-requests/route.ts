import { NextResponse } from 'next/server';
import { getServiceRequests, addServiceRequest } from '@/lib/serviceRequestsStorage';

export async function GET() {
  try {
    const requests = getServiceRequests();
    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error('GET /api/service-requests error:', error);
    return NextResponse.json({ success: true, data: [] });
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

    return NextResponse.json({ success: true, data: newReq }, { status: 201 });
  } catch (error) {
    console.error('POST /api/service-requests error:', error);
    return NextResponse.json({ success: false, error: 'Talep iletilemedi.' }, { status: 500 });
  }
}
