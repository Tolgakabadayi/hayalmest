import { NextResponse } from 'next/server';
import { getMenuItems, saveMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/menuStorage';
import { MENU_CATEGORIES } from '@/data/menuData';

export async function GET() {
  const items = getMenuItems();
  return NextResponse.json({
    success: true,
    categories: MENU_CATEGORIES,
    items,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.price || !body.category) {
      return NextResponse.json({ success: false, error: 'Ürün adı, fiyat ve kategori zorunludur.' }, { status: 400 });
    }
    const saved = saveMenuItem(body);
    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Menü ürünü eklenemedi' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Ürün ID gereklidir.' }, { status: 400 });
    }
    const updated = updateMenuItem(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Ürün bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Ürün güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID parametresi zorunludur' }, { status: 400 });
    }
    const deleted = deleteMenuItem(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Ürün bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Silme işlemi başarısız' }, { status: 500 });
  }
}
