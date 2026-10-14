import { safeReadJson, safeWriteJson } from './safeStorage';
import { getReservations, Reservation } from '@/lib/storage';

export interface CustomerOverride {
  phone: string; // Normalized phone key
  isVip?: boolean;
  adminNotes?: string;
  allergyNotes?: string;
  tags?: string[];
  updatedAt?: string;
}

export interface CustomerProfile {
  id: string; // Normalized phone
  fullName: string;
  phone: string;
  email: string;
  totalReservations: number;
  confirmedCount: number;
  seatedCount: number;
  pendingCount: number;
  cancelledCount: number;
  totalGuests: number;
  firstVisit: string;
  lastVisit: string;
  favoriteSection: string;
  favoriteSectionId: 'vip_sahne' | 'salon' | 'bahce' | 'loca' | '';
  favoriteTable: string;
  isVip: boolean;
  vipTier: 'vip_gold' | 'regular' | 'new';
  tags: string[];
  adminNotes: string;
  allergyNotes: string;
  reservations: Reservation[];
}

const CUSTOMERS_FILE = 'customers.json';

// Normalize phone for grouping (e.g. "+90 532 123 45 67" -> "05321234567")
export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  let cleaned = rawPhone.replace(/\D/g, '');
  if (cleaned.startsWith('90') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  } else if (cleaned.length === 10 && cleaned.startsWith('5')) {
    cleaned = '0' + cleaned;
  }
  return cleaned || rawPhone.trim().toLowerCase();
}

// Format phone for clean display (e.g. "0532 123 45 67")
export function formatPhoneDisplay(rawPhone: string): string {
  const norm = normalizePhone(rawPhone);
  if (norm.length === 11 && norm.startsWith('0')) {
    return `${norm.slice(0, 4)} ${norm.slice(4, 7)} ${norm.slice(7, 9)} ${norm.slice(9, 11)}`;
  }
  return rawPhone || '-';
}

// Read overrides from customers.json
export function getCustomerOverrides(): Record<string, CustomerOverride> {
  return safeReadJson<Record<string, CustomerOverride>>(CUSTOMERS_FILE, {});
}

// Save overrides to customers.json
export function saveCustomerOverride(phone: string, updates: Partial<CustomerOverride>): CustomerOverride {
  const overrides = getCustomerOverrides();
  const normPhone = normalizePhone(phone);

  const existing = overrides[normPhone] || { phone: normPhone };
  const updated: CustomerOverride = {
    ...existing,
    ...updates,
    phone: normPhone,
    updatedAt: new Date().toISOString(),
  };

  overrides[normPhone] = updated;
  safeWriteJson(CUSTOMERS_FILE, overrides);
  return updated;
}

// Section names helper
const SECTION_NAMES: Record<string, string> = {
  vip_sahne: 'VIP Sahne Önü',
  salon: 'Orta Salon',
  loca: 'Özel Loca',
  bahce: 'Bahçe / Teras',
};

// Aggregate all customers from reservations and overrides
export function getAllCustomers(): CustomerProfile[] {
  const reservations = getReservations();
  const overrides = getCustomerOverrides();

  const customerMap = new Map<string, {
    reservations: Reservation[];
    names: string[];
    emails: string[];
    rawPhones: string[];
  }>();

  // Group reservations by normalized phone or email/fullName
  for (const res of reservations) {
    const normPhone = normalizePhone(res.phone) || res.email?.trim().toLowerCase() || res.fullName?.trim().toLowerCase() || res.id;
    
    if (!customerMap.has(normPhone)) {
      customerMap.set(normPhone, {
        reservations: [],
        names: [],
        emails: [],
        rawPhones: [],
      });
    }

    const group = customerMap.get(normPhone)!;
    group.reservations.push(res);
    if (res.fullName) group.names.push(res.fullName.trim());
    if (res.email) group.emails.push(res.email.trim());
    if (res.phone) group.rawPhones.push(res.phone.trim());
  }

  const profiles: CustomerProfile[] = [];

  customerMap.forEach((group, normPhone) => {
    // Sort reservations by date descending (newest first)
    const sortedRes = [...group.reservations].sort((a, b) => {
      const dateA = a.date + (a.time || '00:00');
      const dateB = b.date + (b.time || '00:00');
      return dateB.localeCompare(dateA);
    });

    const override = overrides[normPhone] || {};
    
    // Choose most recent or most frequent name & email
    const fullName = group.names[group.names.length - 1] || sortedRes[0]?.fullName || 'Misafir';
    const email = group.emails[group.emails.length - 1] || sortedRes[0]?.email || '';
    const phone = group.rawPhones[group.rawPhones.length - 1] || sortedRes[0]?.phone || normPhone;

    // Counts
    const totalReservations = sortedRes.length;
    const confirmedCount = sortedRes.filter(r => r.status === 'confirmed').length;
    const seatedCount = sortedRes.filter(r => r.status === 'seated').length;
    const pendingCount = sortedRes.filter(r => r.status === 'pending').length;
    const cancelledCount = sortedRes.filter(r => r.status === 'cancelled').length;
    const totalGuests = sortedRes
      .filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => sum + (r.guestCount || 0), 0);

    // Dates
    const dates = sortedRes.map(r => r.date).filter(Boolean).sort();
    const firstVisit = dates[0] || '';
    const lastVisit = dates[dates.length - 1] || '';

    // Calculate favorite section & table
    const sectionCounts: Record<string, number> = {};
    const tableCounts: Record<string, number> = {};
    for (const r of sortedRes) {
      if (r.sectionId) {
        sectionCounts[r.sectionId] = (sectionCounts[r.sectionId] || 0) + 1;
      }
      if (r.tableId) {
        tableCounts[r.tableId] = (tableCounts[r.tableId] || 0) + 1;
      }
    }

    let favoriteSectionId: 'vip_sahne' | 'salon' | 'bahce' | 'loca' | '' = '';
    let maxSectionCount = 0;
    for (const [sec, count] of Object.entries(sectionCounts)) {
      if (count > maxSectionCount) {
        maxSectionCount = count;
        favoriteSectionId = sec as any;
      }
    }

    let favoriteTable = '';
    let maxTableCount = 0;
    for (const [tbl, count] of Object.entries(tableCounts)) {
      if (count > maxTableCount) {
        maxTableCount = count;
        favoriteTable = tbl;
      }
    }

    // VIP calculation: override.isVip OR >= 3 bookings OR >= 16 total guests
    const isVip = Boolean(override.isVip || totalReservations >= 3 || totalGuests >= 16);
    const vipTier: CustomerProfile['vipTier'] = isVip
      ? 'vip_gold'
      : totalReservations >= 2
      ? 'regular'
      : 'new';

    // Auto tags + custom tags
    const computedTags: string[] = [];
    if (isVip) computedTags.push('👑 VIP Müdavim');
    else if (totalReservations >= 2) computedTags.push('⭐ Müdavim Misafir');
    else computedTags.push('✨ Yeni Misafir');

    if (totalGuests >= 10) computedTags.push('👥 Büyük Grup');
    if (cancelledCount > 0) computedTags.push('⚠️ İptal Geçmişi Var');

    if (override.tags && override.tags.length > 0) {
      for (const t of override.tags) {
        if (!computedTags.includes(t)) computedTags.push(t);
      }
    }

    profiles.push({
      id: normPhone,
      fullName,
      phone: formatPhoneDisplay(phone),
      email,
      totalReservations,
      confirmedCount,
      seatedCount,
      pendingCount,
      cancelledCount,
      totalGuests,
      firstVisit,
      lastVisit,
      favoriteSection: favoriteSectionId ? SECTION_NAMES[favoriteSectionId] || favoriteSectionId : 'Belirtilmedi',
      favoriteSectionId,
      favoriteTable,
      isVip,
      vipTier,
      tags: computedTags,
      adminNotes: override.adminNotes || '',
      allergyNotes: override.allergyNotes || '',
      reservations: sortedRes,
    });
  });

  // Sort by total reservations descending, then last visit descending
  profiles.sort((a, b) => {
    if (b.totalReservations !== a.totalReservations) {
      return b.totalReservations - a.totalReservations;
    }
    return (b.lastVisit || '').localeCompare(a.lastVisit || '');
  });

  return profiles;
}

// Generate CSV export with UTF-8 BOM for clean Turkish Excel display
export function exportCustomersToCSV(): string {
  const customers = getAllCustomers();
  
  const headers = [
    'Müşteri ID / Tel',
    'Ad Soyad',
    'Telefon',
    'E-Posta',
    'Toplam Rezervasyon',
    'Onaylanan Ziyaret',
    'İptal Sayısı',
    'Toplam Getirilen Misafir',
    'İlk Ziyaret Tarihi',
    'Son Ziyaret Tarihi',
    'Favori Alan',
    'Favori Masa',
    'VIP Durumu',
    'Etiketler',
    'Özel Yönetici Notları',
    'Alerji / Özel Talepler'
  ];

  const rows = customers.map(c => [
    `"${c.id}"`,
    `"${(c.fullName || '').replace(/"/g, '""')}"`,
    `"${(c.phone || '').replace(/"/g, '""')}"`,
    `"${(c.email || '').replace(/"/g, '""')}"`,
    c.totalReservations,
    c.confirmedCount + c.seatedCount,
    c.cancelledCount,
    c.totalGuests,
    `"${c.firstVisit || ''}"`,
    `"${c.lastVisit || ''}"`,
    `"${c.favoriteSection || ''}"`,
    `"${c.favoriteTable || ''}"`,
    c.isVip ? '"VIP"' : '"Standart"',
    `"${c.tags.join(', ')}"`,
    `"${(c.adminNotes || '').replace(/"/g, '""')}"`,
    `"${(c.allergyNotes || '').replace(/"/g, '""')}"`
  ]);

  // Prepend UTF-8 BOM so Excel opens Turkish characters (ş, ğ, ı, İ, ö, ü, ç) perfectly
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  return csvContent;
}
