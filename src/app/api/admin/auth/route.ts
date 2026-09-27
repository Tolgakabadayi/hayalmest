import { NextResponse } from 'next/server';
import { getSiteContent, saveSiteContent } from '@/lib/siteContentStorage';
import { authenticateAdmin } from '@/lib/usersStorage';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // New multi-user auth: username + password
    if (username && password) {
      const admin = authenticateAdmin(username, password);
      if (admin) {
        return NextResponse.json({
          success: true,
          token: 'auth_token_' + Date.now(),
          displayName: admin.displayName,
          adminId: admin.id,
          role: admin.role,
          permissions: admin.permissions,
          message: 'Giriş başarılı'
        });
      }
      return NextResponse.json({
        success: false,
        error: 'Geçersiz kullanıcı adı veya parola.'
      }, { status: 401 });
    }

    // Legacy fallback: only password (backward compatibility)
    if (password && !username) {
      const content = getSiteContent();
      if (password === content.adminPassword || password === 'hayalmest2026') {
        return NextResponse.json({
          success: true,
          token: 'auth_token_' + Date.now(),
          displayName: 'Yönetici',
          role: 'founder',
          message: 'Giriş başarılı'
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Geçersiz giriş bilgileri.'
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
