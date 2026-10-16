import { safeReadJson, safeWriteJson, recordDeletedId } from './safeStorage';

export interface Reservation {
  id: string;
  pnr: string;
  createdAt: string;
  fullName: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  serviceType: string;
  guestCount: number;
  occasion: string;
  sectionId: 'vip_sahne' | 'salon' | 'bahce' | 'loca';
  tableId: string;
  packageId: 'standart_fix' | 'premium_fix' | 'alacarte';
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'cancelled';
  adminNotes?: string;
}

const FILE_NAME = 'reservations.json';

const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'res-1',
    pnr: 'HM-9821',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    fullName: 'Burak Yılmaz',
    phone: '0532 456 78 90',
    email: 'burak.yilmaz@gmail.com',
    date: new Date().toISOString().split('T')[0],
    time: '20:30',
    serviceType: 'Canlı Fasıl Gecesi',
    guestCount: 4,
    occasion: 'Doğum Günü Kutlaması',
    sectionId: 'vip_sahne',
    tableId: 'v-1',
    packageId: 'premium_fix',
    specialRequests: 'Doğum günü pastası getireceğiz, pasta servisinde müzik rica ediyoruz.',
    status: 'confirmed',
    adminNotes: 'Masa hazırlandı, VIP ön sıra.'
  },
  {
    id: 'res-2',
    pnr: 'HM-7345',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    fullName: 'Zeynep Aksoy',
    phone: '0544 321 65 43',
    email: 'zeynep.aksoy@outlook.com',
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    serviceType: 'Akşam Muhabbet & Fasıl',
    guestCount: 6,
    occasion: 'Arkadaş Buluşması',
    sectionId: 'salon',
    tableId: 's-4',
    packageId: 'standart_fix',
    specialRequests: 'Cam kenarına yakın masa olursa çok seviniriz.',
    status: 'confirmed'
  },
  {
    id: 'res-3',
    pnr: 'HM-4519',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    fullName: 'Mert Çetinkaya',
    phone: '0535 789 12 34',
    email: 'mert.c@sirket.com',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '19:30',
    serviceType: 'Şirket Yemeği',
    guestCount: 12,
    occasion: 'Şirket Yemeği',
    sectionId: 'loca',
    tableId: 'l-2',
    packageId: 'premium_fix',
    specialRequests: 'Fatura şirket adına kesilecek, 12 kişilik grup.',
    status: 'pending'
  },
  {
    id: 'res-4',
    pnr: 'HM-2980',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    fullName: 'Ece Güner',
    phone: '0507 654 32 10',
    email: 'ece.guner@yahoo.com',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    time: '20:30',
    serviceType: 'Canlı Fasıl Gecesi',
    guestCount: 2,
    occasion: 'Romantik Akşam',
    sectionId: 'salon',
    tableId: 's-2',
    packageId: 'alacarte',
    specialRequests: 'Sessiz ve şık bir masa rica ediyoruz.',
    status: 'pending'
  }
];

export function getReservations(): Reservation[] {
  return safeReadJson<Reservation[]>(FILE_NAME, INITIAL_RESERVATIONS);
}

export function saveReservation(reservationData: Omit<Reservation, 'id' | 'pnr' | 'createdAt' | 'status'>): Reservation {
  const reservations = getReservations();
  
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const pnr = `HM-${randomNum}`;
  const id = `res-${Date.now()}`;

  const newReservation: Reservation = {
    ...reservationData,
    id,
    pnr,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  reservations.unshift(newReservation);
  safeWriteJson(FILE_NAME, reservations);
  return newReservation;
}

export function updateReservation(id: string, updates: Partial<Reservation>): Reservation | null {
  const reservations = getReservations();
  const index = reservations.findIndex(r => r.id === id);
  if (index === -1) return null;

  reservations[index] = {
    ...reservations[index],
    ...updates
  };

  safeWriteJson(FILE_NAME, reservations);
  return reservations[index];
}

export function deleteReservation(id: string): boolean {
  recordDeletedId(FILE_NAME, id);
  let reservations = getReservations();
  const initialLen = reservations.length;
  reservations = reservations.filter(r => r.id !== id);
  safeWriteJson(FILE_NAME, reservations);
  return true;
}
