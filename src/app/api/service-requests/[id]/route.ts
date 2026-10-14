import { NextResponse } from 'next/server';
import { updateServiceRequestStatus, deleteServiceRequest } from '@/lib/serviceRequestsStorage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const status = body.status || 'completed';
    const completedBy = body.completedBy || '';

    const updated = updateServiceRequestStatus(id, status, completedBy);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Talep bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('PATCH /api/service-requests/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Güncellenemedi.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const deleted = deleteServiceRequest(id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error('DELETE /api/service-requests/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Silinemedi.' }, { status: 500 });
  }
}
