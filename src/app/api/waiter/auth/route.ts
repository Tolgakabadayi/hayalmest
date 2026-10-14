import { NextResponse } from 'next/server';
import { authenticateWaiter } from '@/lib/usersStorage';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const waiter = authenticateWaiter(pin);

    if (waiter) {
      return NextResponse.json({
        success: true,
        token: 'waiter_token_' + Date.now(),
        waiterName: waiter.name,
        waiterId: waiter.id,
        message: 'Giriş başarılı'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Geçersiz garson PIN kodu.'
    }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Giriş işlemi başarısız' }, { status: 500 });
  }
}
