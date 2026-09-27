export interface StageEvent {
  id: string;
  title: string;
  performer: string;
  genre: 'fasıl' | 'akustik' | 'nostalji' | 'ozel_sahne';
  genreLabel: string;
  day: string;
  time: string;
  dateStr: string;
  description: string;
  badge?: string;
  image: string;
}

export const STAGE_EVENTS: StageEvent[] = [
  {
    id: 'e-1',
    title: 'Geleneksel Canlı Fasıl & Meze Gecesi',
    performer: 'HayalMest Fasıl Heyeti (Kanun, Ud, Keman, Ritim)',
    genre: 'fasıl',
    genreLabel: 'Canlı Fasıl',
    day: 'Her Çarşamba & Cuma',
    time: '20:30 - 00:30',
    dateStr: 'Haftalık Düzenli',
    badge: 'En Popüler',
    description: 'Klasik Türk Sanat Müziği eserleri, masalara eşlik eden sıcacık nağmeler ve unutulmaz fasıl şarkıları eşliğinde kadeh kaldırıyoruz.',
    image: '/assets/Hayalmest-sahne.jpg'
  },
  {
    id: 'e-2',
    title: 'Bostancı Akustik Meyhane & 90’lar Türkçe Pop',
    performer: 'Selin & Akustik Trio',
    genre: 'nostalji',
    genreLabel: '90lar & Nostalji',
    day: 'Her Perşembe',
    time: '20:45 - 00:15',
    dateStr: 'Haftalık Düzenli',
    badge: 'Keyifli & Dinamik',
    description: '90’ların dillerden düşmeyen unutulmaz şarkılarını akustik gitar, keman ve vurmalılar eşliğinde hep birlikte söylüyoruz.',
    image: '/assets/HayalMest-Meyhanesi-Bostanci-4.jpg'
  },
  {
    id: 'e-3',
    title: 'Büyük Cumartesi Gala Faslı & Kutlama Gecesi',
    performer: 'Üstat Fasıl Topluluğu & Solist',
    genre: 'fasıl',
    genreLabel: 'Gala Gecesi',
    day: 'Her Cumartesi',
    time: '20:00 - 01:00',
    dateStr: 'Haftalık Düzenli',
    badge: 'Hızlı Doluyor',
    description: 'Haftanın en coşkulu gecesi! Doğum günleri, bekarlığa veda ve dost kutlamaları için vazgeçilmez zengin repertuvar ve tempo.',
    image: '/assets/Bostanci-Meyhane-Keyif-Masasi.jpeg'
  },
  {
    id: 'e-4',
    title: 'Pazar Huzuru: Ege & Balkan Ezgileri',
    performer: 'Ege Rebetiko & Balkan Grubu',
    genre: 'akustik',
    genreLabel: 'Ege & Rebetiko',
    day: 'Her Pazar',
    time: '19:30 - 23:00',
    dateStr: 'Haftalık Düzenli',
    badge: 'Sakin & Samimi',
    description: 'Haftanın yorgunluğunu geride bırakan, Ege kıyılarının meltemini Bostancı’ya taşıyan hafif tempolu tınılar ve keyifli sohbet.',
    image: '/assets/HayalMest-Meyhanesi-Bostanci-5.jpg'
  }
];
