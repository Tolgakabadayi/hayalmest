import { safeReadJson, safeWriteJson } from './safeStorage';

export interface SiteContent {
  adminPassword: string;
  phone: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
  youtube: string;
  hero: {
    title: string;
    subtitle: string;
    description: string;
    backgroundImage: string;
  };
  gallery: {
    id: string;
    src: string;
    title: string;
    category: 'salon' | 'lezzet' | 'sahne';
    categoryLabel: string;
  }[];
}

const DEFAULT_CONTENT: SiteContent = {
  adminPassword: 'hayalmest2026',
  phone: '0530 501 24 58',
  email: 'rezervasyon@hayalmest.com',
  address: 'Altıntepe Mahallesi, Kasaplar Çarşısı, Altıntepe, Bağdat Cad. No:4, 34840 Maltepe / İstanbul',
  instagram: 'https://www.instagram.com/hayalmest_bostanci/',
  facebook: 'https://www.facebook.com/hayalmestmeyhanesi',
  youtube: 'https://www.youtube.com/@HayalmestBostancı',
  hero: {
    title: 'Her Kadehte Bir Anı, Her Masada Bir Dostluk',
    subtitle: 'Kadıköy Bostancı’da Canlı Fasıl & Anadolu Meyhanesi',
    description: 'Geleneksel Türk mezeleri, kömür ateşinde pişen enfes kebaplar ve kanun nağmeleriyle süslenen unutulmaz geceler. Masanızı şimdiden ayırtın, anılarınıza lezzet katın.',
    backgroundImage: '/assets/HayalMest-Meyhanesi-Bostanci-1.jpg'
  },
  gallery: [
    { id: 'g-1', src: '/assets/Bostanci-Meyhane-Keyif-Masasi.jpeg', title: 'Meyhane Keyif Masası & Rakı Sunumu', category: 'lezzet', categoryLabel: 'Lezzet & Masalar' },
    { id: 'g-2', src: '/assets/Hayalmest-sahne.jpg', title: 'Canlı Müzik & Fasıl Sahnesi', category: 'sahne', categoryLabel: 'Sahne & Fasıl' },
    { id: 'g-3', src: '/assets/HayalMest-Meyhanesi-Bostanci-1.jpg', title: 'Ana Salon Ahşap Detaylar & Masa Düzeni', category: 'salon', categoryLabel: 'Salon & Ambiyans' },
    { id: 'g-4', src: '/assets/Hayamest-Mezeler.jpg', title: 'Günlük Taze Meze Çeşitlerimiz', category: 'lezzet', categoryLabel: 'Lezzet & Masalar' },
    { id: 'g-5', src: '/assets/HayalMest-Meyhanesi-Bostanci-2.jpg', title: 'Ferah Masa Oturumu & Şık Aydınlatma', category: 'salon', categoryLabel: 'Salon & Ambiyans' },
    { id: 'g-6', src: '/assets/Karisi-Kebap.jpg', title: 'Özel Zırh Kıyma Karışık Kebap', category: 'lezzet', categoryLabel: 'Lezzet & Masalar' },
    { id: 'g-7', src: '/assets/HayalMest-Meyhanesi-Bostanci-3.jpg', title: 'Grup Kutlama Masaları & Özel Loca', category: 'salon', categoryLabel: 'Salon & Ambiyans' },
    { id: 'g-8', src: '/assets/HayalMest-Meyhanesi-Bostanci-4.jpg', title: 'Sahne Açısı & Sıcak Işıklar', category: 'sahne', categoryLabel: 'Sahne & Fasıl' },
    { id: 'g-9', src: '/assets/Ickiler.jpg', title: 'Zengin Rakı & İçecek Menümüz', category: 'lezzet', categoryLabel: 'Lezzet & Masalar' },
    { id: 'g-10', src: '/assets/HayalMest-Meyhanesi-Bostanci-5.jpg', title: 'Meyhane Giriş & Dinlenme Alanı', category: 'salon', categoryLabel: 'Salon & Ambiyans' },
    { id: 'g-11', src: '/assets/Salatalar.jpg', title: 'Taze Çoban ve Gavurdağı Salatası', category: 'lezzet', categoryLabel: 'Lezzet & Masalar' },
    { id: 'g-12', src: '/assets/mevye-tabagi.jpg', title: 'Mevsim Meyveleri & İkram Tabağı', category: 'lezzet', categoryLabel: 'Lezzet & Masalar' },
  ]
};

const CONTENT_FILE = 'siteContent.json';

export function getSiteContent(): SiteContent {
  return safeReadJson<SiteContent>(CONTENT_FILE, DEFAULT_CONTENT);
}

export function saveSiteContent(updates: Partial<SiteContent>): SiteContent {
  const current = getSiteContent();
  const updated = { ...current, ...updates };
  safeWriteJson(CONTENT_FILE, updated);
  return updated;
}
