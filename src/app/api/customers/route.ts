import { NextResponse } from 'next/server';
import { getAllCustomers, saveCustomerOverride, exportCustomersToCSV } from '@/lib/customersStorage';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // CSV Export option
    if (searchParams.get('export') === 'csv') {
      const csv = exportCustomersToCSV();
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="hayalmest-misafir-portfoyu-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    const customers = getAllCustomers();

    // Summary stats
    const totalCustomers = customers.length;
    const vipCount = customers.filter(c => c.isVip).length;
    const regularCount = customers.filter(c => c.totalReservations >= 2).length;
    const totalGuestsBrought = customers.reduce((sum, c) => sum + c.totalGuests, 0);
    const totalBookings = customers.reduce((sum, c) => sum + c.totalReservations, 0);

    return NextResponse.json({
      success: true,
      data: customers,
      stats: {
        totalCustomers,
        vipCount,
        regularCount,
        totalGuestsBrought,
        totalBookings,
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ success: false, error: 'Misafir verileri alınamadı' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { phone, isVip, adminNotes, allergyNotes, tags } = body;

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Telefon numarası gereklidir.' }, { status: 400 });
    }

    const saved = saveCustomerOverride(phone, {
      isVip,
      adminNotes,
      allergyNotes,
      tags,
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ success: false, error: 'Misafir notları güncellenemedi' }, { status: 500 });
  }
}
