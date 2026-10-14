import { NextResponse } from 'next/server';
import { getReservations, saveReservation } from '@/lib/storage';

export async function GET() {
  try {
    const data = getReservations();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET reservations error:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // basic validation
    if (!body.fullName || !body.phone || !body.date || !body.guestCount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Lütfen zorunlu alanları (Ad Soyad, Telefon, Tarih, Kişi Sayısı) doldurunuz.' 
      }, { status: 400 });
    }

    const saved = saveReservation(body);
    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Rezervasyon kaydedilemedi' }, { status: 500 });
  }
}
