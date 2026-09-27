export interface MenuItem {
  id: string;
  name: string;
  category: 'mezeler' | 'salatalar' | 'izgaralar' | 'rakilar' | 'sarap_viski' | 'tatli_icecek';
  price: number;
  unit?: string;
  description?: string;
  badge?: string;
  image?: string;
}

export const MENU_CATEGORIES = [
  { id: 'mezeler', label: 'Soğuk Mezeler' },
  { id: 'izgaralar', label: 'Ana Yemek & Izgaralar' },
  { id: 'salatalar', label: 'Taze Salatalar' },
  { id: 'rakilar', label: 'Rakı Çeşitleri' },
  { id: 'sarap_viski', label: 'Şarap & Diğer İçkiler' },
  { id: 'tatli_icecek', label: 'Meyve, Tatlı & Soft' },
] as const;

export const MENU_ITEMS: MenuItem[] = [
  // SOĞUK MEZELER
  { id: 'm-1', name: 'Beyaz Peynir', category: 'mezeler', price: 150, description: 'Tam yağlı Ezine beyaz peynir', image: '/assets/Hayamest-Mezeler.jpg' },
  { id: 'm-2', name: 'Atom', category: 'mezeler', price: 300, badge: 'Çok Satan', description: 'Közlenmiş süzme yoğurt, tereyağında kavrulmuş acı kuru Arnavut biberi', image: '/assets/Hayamest-Mezeler.jpg' },
  { id: 'm-3', name: 'Fava', category: 'mezeler', price: 300, badge: 'Şefin İmzası', description: 'Dereotlu, kırmızı soğan ve zeytinyağlı klasik Ege favası', image: '/assets/Hayamest-Mezeler.jpg' },
  { id: 'm-4', name: 'Girit Ezme', category: 'mezeler', price: 300, description: 'Antep fıstıklı, fesleğenli ve cevizli özel peynir ezmesi' },
  { id: 'm-5', name: 'Haydari', category: 'mezeler', price: 300, description: 'Sarımsaklı süzme yoğurt, nane ve sızma zeytinyağı' },
  { id: 'm-6', name: 'Kuru Cacık', category: 'mezeler', price: 300, description: 'Kıtır salatalık, süzme yoğurt, taze nane' },
  { id: 'm-7', name: 'Şakşuka', category: 'mezeler', price: 300, description: 'Kızarmış patlıcan, biber ve ev yapımı domates sosu' },
  { id: 'm-8', name: 'Humus', category: 'mezeler', price: 300, description: 'Özel tahinli Hatay usulü humus, kimyon ve zeytinyağı ile' },
  { id: 'm-9', name: 'Deniz Börülcesi', category: 'mezeler', price: 300, description: 'Sarımsaklı zeytinyağı soslu taze deniz börülcesi' },
  { id: 'm-10', name: 'Köpoğlu', category: 'mezeler', price: 300, description: 'Közlenmiş sebzeler, sarımsaklı süzme yoğurt ve domates sos' },
  { id: 'm-11', name: 'Acılı Ezme', category: 'mezeler', price: 300, description: 'Zırhtan geçmiş taze domates, biber, nar ekşisi ve baharatlar' },
  { id: 'm-12', name: 'Enginar', category: 'mezeler', price: 450, badge: 'Özel', description: 'Garnitürlü taze zeytinyağlı çanak enginar' },
  { id: 'm-13', name: 'Ordövr Tabağı', category: 'mezeler', price: 500, description: 'Günün en taze 6 çeşit mezesinden oluşan özel tabak' },
  { id: 'm-14', name: 'Peynir Tabağı', category: 'mezeler', price: 750, description: 'Ezine, tulum, eski kaşar, ceviz ve kuru meyveler ile' },

  // ANA YEMEK & IZGARALAR
  { id: 'y-1', name: 'Adana Kebap', category: 'izgaralar', price: 800, badge: 'Özel Zırh', description: 'Közlenmiş domates, biber, sumaklı soğan ve lavaş ile', image: '/assets/Karisi-Kebap.jpg' },
  { id: 'y-2', name: 'Urfa Kebap', category: 'izgaralar', price: 800, description: 'Acısız kuzu kıyma kebap, köz sebzeler ve bulgur pilavı eşliğinde', image: '/assets/Karisi-Kebap.jpg' },
  { id: 'y-3', name: 'Kuzu Şiş', category: 'izgaralar', price: 950, badge: 'Özel Terbiye', description: 'Özel marine edilmiş yumuşacık kuzu but lokumları' },
  { id: 'y-4', name: 'Tavuk Şiş', category: 'izgaralar', price: 750, description: 'Özel baharat sosunda dinlendirilmiş tavuk but şiş' },
  { id: 'y-5', name: 'Izgara Kanat', category: 'izgaralar', price: 750, description: 'Közde nar gibi kızarmış marine tavuk kanat' },
  { id: 'y-6', name: 'Karışık Izgara', category: 'izgaralar', price: 1250, badge: 'Tavsiye', description: 'Adana kebap, kuzu şiş, tavuk şiş, köfte ve garnitürler', image: '/assets/Karisi-Kebap.jpg' },
  { id: 'y-7', name: 'Kuzu Pirzola', category: 'izgaralar', price: 1400, description: 'Kekikle dinlendirilmiş 4 parça kemikli kuzu pirzola' },
  { id: 'y-8', name: 'Kuzu Yağlı Kara', category: 'izgaralar', price: 1400, badge: 'Gurme', description: 'Kuzu sırtından özel kesim lezzet patlaması' },
  { id: 'y-9', name: 'Kuzu Lokum', category: 'izgaralar', price: 1300, description: 'Ağızda dağılan yumuşacık kuzu bonfile dilimleri' },
  { id: 'y-10', name: 'Kuzu Tandır', category: 'izgaralar', price: 1250, description: 'Fırında ağır ateşte nar gibi pişmiş kemiksiz kuzu tandır' },

  // SALATALAR
  { id: 's-1', name: 'Çoban Salata', category: 'salatalar', price: 250, description: 'Küp doğranmış domates, salatalık, biber, soğan, sızma zeytinyağı', image: '/assets/Salatalar.jpg' },
  { id: 's-2', name: 'Gavurdağı Salatası', category: 'salatalar', price: 480, badge: 'Favori', description: 'İnce kıyılmış domates, bol ceviz, nar ekşisi ve sumak', image: '/assets/Salatalar.jpg' },
  { id: 's-3', name: 'Mevsim Salata', category: 'salatalar', price: 450, description: 'Göbek, havuç, mor lahana, mısır, zeytinyağ limon sos' },
  { id: 's-4', name: 'Peynirli Roka Salatası', category: 'salatalar', price: 800, description: 'Taze körpe roka, Ezine peyniri küpleri, ceviz ve nar ekşili sos' },
  { id: 's-5', name: 'Pancar Salatası', category: 'salatalar', price: 730, description: 'Fırınlanmış taze pancar, sarımsaklı zeytinyağı ve taze otlar' },
  { id: 's-6', name: 'Tabule Salatası', category: 'salatalar', price: 625, description: 'İnce bulgur, bol maydanoz, nane, nar ekşisi ve taze soğan' },

  // RAKILAR
  { id: 'r-1', name: 'Yeni Rakı (35 cl)', category: 'rakilar', price: 2200, image: '/assets/Ickiler.jpg' },
  { id: 'r-2', name: 'Yeni Rakı (50 cl)', category: 'rakilar', price: 3000, image: '/assets/Ickiler.jpg' },
  { id: 'r-3', name: 'Yeni Rakı (70 cl)', category: 'rakilar', price: 3950, badge: 'Klasik', image: '/assets/Ickiler.jpg' },
  { id: 'r-4', name: 'Yeni Rakı (100 cl)', category: 'rakilar', price: 5100, image: '/assets/Ickiler.jpg' },
  { id: 'r-5', name: 'Yeni Seri (70 cl)', category: 'rakilar', price: 4400 },
  { id: 'r-6', name: 'Altın Seri (70 cl)', category: 'rakilar', price: 4800, badge: 'Özel Seri' },
  { id: 'r-7', name: 'Efe Gold (70 cl)', category: 'rakilar', price: 4800 },
  { id: 'r-8', name: 'Beylerbeyi Göbek (70 cl)', category: 'rakilar', price: 5200, badge: 'Premium' },
  { id: 'r-9', name: 'Tek Rakı (Kadeh)', category: 'rakilar', price: 550 },
  { id: 'r-10', name: 'Duble Rakı (Kadeh)', category: 'rakilar', price: 800 },
  { id: 'r-11', name: 'Sahne Rakı Özel', category: 'rakilar', price: 1000 },

  // ŞARAP & DİĞER İÇKİLER
  { id: 'i-1', name: 'Kadeh Şarap (Beyaz/Kırmızı/Rose)', category: 'sarap_viski', price: 750 },
  { id: 'i-2', name: 'Şişe Şarap (Kav Seçimi)', category: 'sarap_viski', price: 2900 },
  { id: 'i-3', name: 'Tuborg / Carlsberg (50 cl)', category: 'sarap_viski', price: 300 },
  { id: 'i-4', name: 'Chivas Regal 12 (Kadeh)', category: 'sarap_viski', price: 850 },
  { id: 'i-5', name: 'Jack Daniels (Kadeh)', category: 'sarap_viski', price: 850 },
  { id: 'i-6', name: 'Chivas Regal 12 (70 cl)', category: 'sarap_viski', price: 5800 },
  { id: 'i-7', name: 'İmza Meyhane Kokteyli', category: 'sarap_viski', price: 800, badge: 'İmza' },

  // MEYVE & TATLI & SOFT
  { id: 't-1', name: 'Mevsim Meyve Tabağı', category: 'tatli_icecek', price: 600, badge: 'Masa İkramı', description: 'Kavun, karpuz, üzüm, çilek ve mevsim meyveleri seçkisi', image: '/assets/mevye-tabagi.jpg' },
  { id: 't-2', name: 'Sıcak Karışık Lüks Çerez', category: 'tatli_icecek', price: 1000, description: 'Antep fıstığı, kaju, fındık, badem taze kavrulmuş' },
  { id: 't-3', name: 'Özel Tahinli Sıcak Helva', category: 'tatli_icecek', price: 350, description: 'Fırında güveçte nar gibi kızarmış fıstıklı sıcak helva' },
  { id: 't-4', name: 'Taze Şalgam Suyu (1 Lt)', category: 'tatli_icecek', price: 250 },
  { id: 't-5', name: 'Meşrubat Çeşitleri (Kola, Fanta, Soda)', category: 'tatli_icecek', price: 150 },
];
