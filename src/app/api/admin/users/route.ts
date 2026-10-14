import { NextResponse } from 'next/server';
import { 
  getUsers, 
  addAdmin, 
  updateAdmin, 
  deleteAdmin, 
  addHost, 
  updateHost, 
  deleteHost,
  addWaiter,
  updateWaiter,
  deleteWaiter
} from '@/lib/usersStorage';

export async function GET() {
  try {
    const data = getUsers();
    const safeAdmins = data.admins.map(({ password, ...rest }) => ({ ...rest, hasPassword: !!password }));
    const safeHosts = data.hosts.map(({ pin, ...rest }) => ({ ...rest, pinLength: pin.length }));
    const safeWaiters = (data.waiters || []).map(({ pin, ...rest }) => ({ ...rest, pinLength: pin.length }));
    return NextResponse.json({ success: true, admins: safeAdmins, hosts: safeHosts, waiters: safeWaiters });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Kullanıcılar yüklenemedi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, ...userData } = body;

    if (type === 'admin') {
      if (!userData.username || !userData.password || !userData.displayName) {
        return NextResponse.json({ success: false, error: 'Kullanıcı adı, şifre ve görünen ad zorunludur.' }, { status: 400 });
      }
      const admin = addAdmin({
        username: userData.username,
        password: userData.password,
        displayName: userData.displayName,
        role: 'admin',
        permissions: userData.permissions || ['reservations'],
        createdBy: userData.createdBy || 'unknown',
      });
      const { password, ...safe } = admin;
      return NextResponse.json({ success: true, user: safe });
    }

    if (type === 'host') {
      if (!userData.name || !userData.pin) {
        return NextResponse.json({ success: false, error: 'İsim ve PIN zorunludur.' }, { status: 400 });
      }
      if (userData.pin.length < 4 || userData.pin.length > 6) {
        return NextResponse.json({ success: false, error: 'PIN 4-6 haneli olmalıdır.' }, { status: 400 });
      }
      const host = addHost({
        name: userData.name,
        pin: userData.pin,
        active: true,
        createdBy: userData.createdBy || 'unknown',
      });
      const { pin, ...safe } = host;
      return NextResponse.json({ success: true, user: safe });
    }

    if (type === 'waiter') {
      if (!userData.name || !userData.pin) {
        return NextResponse.json({ success: false, error: 'İsim ve PIN zorunludur.' }, { status: 400 });
      }
      if (userData.pin.length < 4 || userData.pin.length > 6) {
        return NextResponse.json({ success: false, error: 'PIN 4-6 haneli olmalıdır.' }, { status: 400 });
      }
      const waiter = addWaiter({
        name: userData.name,
        pin: userData.pin,
        active: true,
        createdBy: userData.createdBy || 'unknown',
      });
      const { pin, ...safe } = waiter;
      return NextResponse.json({ success: true, user: safe });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz kullanıcı tipi.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Kullanıcı eklenemedi' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { type, id, ...updates } = body;

    if (type === 'admin') {
      const result = updateAdmin(id, updates);
      if (!result) return NextResponse.json({ success: false, error: 'Yönetici bulunamadı.' }, { status: 404 });
      const { password, ...safe } = result;
      return NextResponse.json({ success: true, user: safe });
    }

    if (type === 'host') {
      const result = updateHost(id, updates);
      if (!result) return NextResponse.json({ success: false, error: 'Host bulunamadı.' }, { status: 404 });
      const { pin, ...safe } = result;
      return NextResponse.json({ success: true, user: safe });
    }

    if (type === 'waiter') {
      const result = updateWaiter(id, updates);
      if (!result) return NextResponse.json({ success: false, error: 'Garson bulunamadı.' }, { status: 404 });
      const { pin, ...safe } = result;
      return NextResponse.json({ success: true, user: safe });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz tip.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Güncelleme başarısız' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ success: false, error: 'Tip ve ID zorunludur.' }, { status: 400 });
    }

    if (type === 'admin') {
      const ok = deleteAdmin(id);
      if (!ok) return NextResponse.json({ success: false, error: 'Kurucu yönetici silinemez.' }, { status: 403 });
      return NextResponse.json({ success: true });
    }

    if (type === 'host') {
      deleteHost(id);
      return NextResponse.json({ success: true });
    }

    if (type === 'waiter') {
      deleteWaiter(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz tip.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Silme başarısız' }, { status: 500 });
  }
}
