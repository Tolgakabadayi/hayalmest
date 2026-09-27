import { NextResponse } from 'next/server';
import { getEvents, saveEvent, updateEvent, deleteEvent } from '@/lib/eventsStorage';

export async function GET() {
  const events = getEvents();
  return NextResponse.json({ success: true, data: events });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.performer || !body.day) {
      return NextResponse.json({ success: false, error: 'Lütfen etkinlik başlığı, sanatçı ve gün bilgilerini giriniz.' }, { status: 400 });
    }
    const saved = saveEvent(body);
    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Etkinlik oluşturulamadı' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Etkinlik ID gereklidir.' }, { status: 400 });
    }
    const updated = updateEvent(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Etkinlik bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Etkinlik güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID parametresi zorunludur' }, { status: 400 });
    }
    const deleted = deleteEvent(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Etkinlik bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Silme işlemi başarısız' }, { status: 500 });
  }
}
