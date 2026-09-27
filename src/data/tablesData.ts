export interface TableSection {
  id: 'vip_sahne' | 'salon' | 'bahce' | 'loca';
  name: string;
  shortDesc: string;
  longDesc: string;
  badge: string;
  icon: string;
  capacityRange: string;
  image: string;
  tables: TableItem[];
}

export interface TableItem {
  id: string;
  number: string;
  sectionId: 'vip_sahne' | 'salon' | 'bahce' | 'loca';
  capacity: number;
  minGuests: number;
  adjacentWith: string[]; // IDs of adjacent tables that can be merged
  mergedCapacity?: number;
  posX: number; // 0-100 percentage inside floor plan
  posY: number; // 0-100 percentage inside floor plan
  isAvailable?: boolean;
}

export const VENUE_SECTIONS: TableSection[] = [
  {
    id: 'vip_sahne',
    name: 'Sahne Önü (VIP Fasıl)',
    shortDesc: 'Canlı müzik ve fasıl ekibine en yakın ön sıra masalar',
    longDesc: 'Fasıl heyeti ve sahne performansını en yakından deneyimlemek isteyen misafirlerimiz için ayrılmış özel masalardır.',
    badge: 'Canlı Müzik Odaklı',
    icon: 'Music',
    capacityRange: '2 - 8 Kişi',
    image: '/assets/Hayalmest-sahne.jpg',
    tables: [
      { id: 'v-1', number: 'VIP-1', sectionId: 'vip_sahne', capacity: 4, minGuests: 2, adjacentWith: ['v-2'], mergedCapacity: 8, posX: 22, posY: 24 },
      { id: 'v-2', number: 'VIP-2', sectionId: 'vip_sahne', capacity: 4, minGuests: 2, adjacentWith: ['v-1'], mergedCapacity: 8, posX: 38, posY: 24 },
      { id: 'v-3', number: 'VIP-3', sectionId: 'vip_sahne', capacity: 6, minGuests: 3, adjacentWith: ['v-4'], mergedCapacity: 12, posX: 62, posY: 24 },
      { id: 'v-4', number: 'VIP-4', sectionId: 'vip_sahne', capacity: 6, minGuests: 3, adjacentWith: ['v-3'], mergedCapacity: 12, posX: 78, posY: 24 },
    ]
  },
  {
    id: 'salon',
    name: 'Orta Salon (Keyif & Muhabbet)',
    shortDesc: 'Meyhane ruhunu tam yaşayan, rahat ve şık ana salon',
    longDesc: 'Müziğin ve muhabbetin dengelendiği, ahşap dekorasyonu ve sıcak ışıklandırmasıyla dost meclislerinin vazgeçilmez noktası.',
    badge: 'En Çok Tercih Edilen',
    icon: 'Users',
    capacityRange: '2 - 12 Kişi',
    image: '/assets/HayalMest-Meyhanesi-Bostanci-1.jpg',
    tables: [
      { id: 's-1', number: 'Masa 11', sectionId: 'salon', capacity: 2, minGuests: 1, adjacentWith: ['s-2'], mergedCapacity: 6, posX: 20, posY: 48 },
      { id: 's-2', number: 'Masa 12', sectionId: 'salon', capacity: 4, minGuests: 2, adjacentWith: ['s-1', 's-3'], mergedCapacity: 8, posX: 36, posY: 48 },
      { id: 's-3', number: 'Masa 14', sectionId: 'salon', capacity: 4, minGuests: 2, adjacentWith: ['s-2'], mergedCapacity: 8, posX: 52, posY: 48 },
      { id: 's-4', number: 'Masa 15', sectionId: 'salon', capacity: 6, minGuests: 3, adjacentWith: ['s-5'], mergedCapacity: 12, posX: 68, posY: 48 },
      { id: 's-5', number: 'Masa 16', sectionId: 'salon', capacity: 6, minGuests: 4, adjacentWith: ['s-4'], mergedCapacity: 12, posX: 84, posY: 48 },
      { id: 's-6', number: 'Masa 18 (Grup)', sectionId: 'salon', capacity: 12, minGuests: 6, adjacentWith: [], mergedCapacity: 12, posX: 50, posY: 64 },
    ]
  },
  {
    id: 'bahce',
    name: 'Bahçe & Teras (Ferah Alan)',
    shortDesc: 'Açık hava esintisi, yemyeşil bitkiler ve ferah oturum',
    longDesc: 'Havadar, sigara içilebilen ve modern ısıtıcılarıyla kışın da keyifli teras alanımız.',
    badge: 'Ferah & Havadar',
    icon: 'TreePine',
    capacityRange: '2 - 8 Kişi',
    image: '/assets/HayalMest-Meyhanesi-Bostanci-2.jpg',
    tables: [
      { id: 'b-1', number: 'Bahçe 1', sectionId: 'bahce', capacity: 2, minGuests: 1, adjacentWith: ['b-2'], mergedCapacity: 6, posX: 64, posY: 82 },
      { id: 'b-2', number: 'Bahçe 2', sectionId: 'bahce', capacity: 4, minGuests: 2, adjacentWith: ['b-1'], mergedCapacity: 6, posX: 74, posY: 82 },
      { id: 'b-3', number: 'Bahçe 3', sectionId: 'bahce', capacity: 6, minGuests: 3, adjacentWith: ['b-4'], mergedCapacity: 12, posX: 84, posY: 82 },
      { id: 'b-4', number: 'Bahçe 4', sectionId: 'bahce', capacity: 6, minGuests: 3, adjacentWith: ['b-3'], mergedCapacity: 12, posX: 94, posY: 82 },
    ]
  },
  {
    id: 'loca',
    name: 'Özel Loca (Grup & Kutlama)',
    shortDesc: 'Doğum günü, bekarlığa veda ve özel davetler için ayrılmış',
    longDesc: 'Grubunuza özel konfor alanı sunan, isteğe bağlı süsleme ve pasta servisi ayrıcalığı olan kutlama locamız.',
    badge: 'Kutlama & Özel Davet',
    icon: 'Crown',
    capacityRange: '6 - 20 Kişi',
    image: '/assets/HayalMest-Meyhanesi-Bostanci-3.jpg',
    tables: [
      { id: 'l-1', number: 'Loca A (Kutlama)', sectionId: 'loca', capacity: 10, minGuests: 6, adjacentWith: ['l-2'], mergedCapacity: 24, posX: 15, posY: 82 },
      { id: 'l-2', number: 'Loca B (Gala Grubu)', sectionId: 'loca', capacity: 16, minGuests: 10, adjacentWith: ['l-1'], mergedCapacity: 26, posX: 35, posY: 82 },
    ]
  }
];

export const ALL_TABLES: TableItem[] = VENUE_SECTIONS.flatMap(s => s.tables);

export const FIX_PACKAGES = [
  {
    id: 'standart_fix',
    name: 'Klasik Meyhane Fiks Menü',
    price: 1650,
    unit: 'Kişi Başı',
    badge: 'Popüler',
    features: [
      'Günün En Taze 6 Çeşit Soğuk Mezesi (Atom, Fava, Haydari, vb.)',
      'Mevsim Salata veya Çoban Salata',
      '2 Çeşit Sıcak Meze / Ara Sıcak (Paçanga & İçli Köfte)',
      'Ana Yemek: Özel Zırh Adana / Urfa veya Tavuk Şiş',
      'Meyve Tabağı & Tatlı İkramı',
      'Soft İçecekler & Su Dahil'
    ]
  },
  {
    id: 'premium_fix',
    name: 'HayalMest Gurme & Rakı Menüsü',
    price: 2450,
    unit: 'Kişi Başı',
    badge: 'Önerilen',
    features: [
      '8 Çeşit Zengin Gurme Meze (Girit Ezme, Enginar, Atom, vb.)',
      'Özel Peynirli Roka Salatası & Ceviz',
      '3 Çeşit Sıcak Meze (İstiridye Mantarı, Karides Güveç, Börek)',
      'Ana Yemek: Karışık Izgara & Lokum Tabağı',
      'Kişi Başı 35 cl Yeni Rakı veya Eşdeğer Şarap / 3 Duble Rakı',
      'Mevsim Meyveleri, Lüks Çerez & Sıcak Helva'
    ]
  },
  {
    id: 'alacarte',
    name: 'A La Carte (Menüden Seçim)',
    price: 0,
    unit: 'Tüketime Göre',
    badge: 'Serbest Seçim',
    features: [
      'Menümüzdeki 50+ çeşit meze, ara sıcak ve kebaptan dilediğinizi seçin',
      'Geniş kav ve alkol menüsü alternatifleri',
      'Masaya özel servis ve dilediğinizce sipariş imkanı',
      'Minimum harcama tutarı canlı müzik günlerinde 1.500 TL/kişi'
    ]
  }
];
