import { NextResponse } from 'next/server';
import { authenticateHost } from '@/lib/usersStorage';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const host = authenticateHost(pin);

    if (host) {
      return NextResponse.json({
        success: true,
        token: 'host_token_' + Date.now(),
        hostName: host.name,
        hostId: host.id,
        message: 'Giriş başarılı'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Geçersiz PIN kodu.'
    }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Giriş işlemi başarısız' }, { status: 500 });
  }
}
