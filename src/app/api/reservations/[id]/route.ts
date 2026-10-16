import { NextResponse } from 'next/server';
import { updateReservation, deleteReservation } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    const updated = updateReservation(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Rezervasyon bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Güncelleme başarısız' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const deleted = deleteReservation(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Rezervasyon bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Silme işlemi başarısız' }, { status: 500 });
  }
}
