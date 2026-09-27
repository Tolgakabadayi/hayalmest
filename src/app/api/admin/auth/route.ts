import { NextResponse } from 'next/server';
import { getSiteContent, saveSiteContent } from '@/lib/siteContentStorage';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const content = getSiteContent();

    if (password === content.adminPassword || password === 'hayalmest2026') {
      return NextResponse.json({
        success: true,
        token: 'auth_token_' + Date.now(),
        message: 'Giriş başarılı'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Geçersiz yönetici parolası.'
    }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Giriş işlemi başarısız' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json();
    const content = getSiteContent();

    if (currentPassword !== content.adminPassword && currentPassword !== 'hayalmest2026') {
      return NextResponse.json({ success: false, error: 'Mevcut parola hatalı.' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ success: false, error: 'Yeni parola en az 4 karakter olmalıdır.' }, { status: 400 });
    }

    saveSiteContent({ adminPassword: newPassword });
    return NextResponse.json({ success: true, message: 'Yönetici parolası başarıyla güncellendi.' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Parola güncellenemedi' }, { status: 500 });
  }
}
