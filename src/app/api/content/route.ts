import { NextResponse } from 'next/server';
import { getSiteContent, saveSiteContent } from '@/lib/siteContentStorage';

export async function GET() {
  const content = getSiteContent();
  // omit password in public response
  const { adminPassword, ...safeContent } = content;
  return NextResponse.json({ success: true, data: safeContent });
}

export async function PUT(request: Request) {
  try {
    const updates = await request.json();
    const updated = saveSiteContent(updates);
    const { adminPassword, ...safeContent } = updated;
    return NextResponse.json({ success: true, data: safeContent });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'İçerik kaydedilemedi' }, { status: 500 });
  }
}
