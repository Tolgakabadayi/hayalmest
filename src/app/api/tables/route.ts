import { NextResponse } from 'next/server';
import { 
  getStoredTables, 
  getStoredVenueElements, 
  saveVenueLayout, 
  saveTable, 
  updateTable, 
  deleteTable 
} from '@/lib/tablesStorage';
import { VENUE_SECTIONS, FIX_PACKAGES } from '@/data/tablesData';

export async function GET() {
  const tables = getStoredTables();
  const elements = getStoredVenueElements();

  return NextResponse.json({
    success: true,
    tables,
    elements,
    sections: VENUE_SECTIONS,
    packages: FIX_PACKAGES,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Bulk save entire floor plan layout from the drag-and-drop designer
    if (body.action === 'save_layout') {
      const { tables, elements } = body;
      const success = saveVenueLayout(tables, elements);
      return NextResponse.json({ success, message: 'Salon yerleşimi ve masalar başarıyla kaydedildi.' });
    }

    // Single table add
    if (!body.number || !body.sectionId || !body.capacity) {
      return NextResponse.json({ success: false, error: 'Masa numarası, bölge ve kapasite zorunludur.' }, { status: 400 });
    }

    const saved = saveTable(body);
    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Masa kaydedilemedi' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Masa ID gereklidir.' }, { status: 400 });
    }

    const updated = updateTable(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Masa bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Masa güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Masa ID zorunludur' }, { status: 400 });
    }

    const deleted = deleteTable(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Masa bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Masa başarıyla silindi.' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Silme işlemi başarısız' }, { status: 500 });
  }
}
