export interface ReviewItem {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
  source: 'Google Değerlendirmesi';
  avatarInitials: string;
}

export const REVIEWS_DATA: ReviewItem[] = [
  {
    id: 'rev-1',
    name: 'Gökçe Kurt',
    rating: 5,
    date: '2 hafta önce',
    comment: 'Mükemmel bir işletme, servis çok iyi, çalışanlar çok ilgililer. Mezelerin tazeliği ve lezzeti harikaydı. Çok teşekkür ederiz her şey için 🙏🏻',
    source: 'Google Değerlendirmesi',
    avatarInitials: 'GK'
  },
  {
    id: 'rev-2',
    name: 'Filiz BSLN',
    rating: 5,
    date: '1 ay önce',
    comment: 'Mekan çok şık. Müzik çok iyi. Garsonlar kibar. Servisin her kademesinde tabak değişiyor. Titiz bir işletmeci olduğu çok açık. Masamızı seçebilmek ve ekip arkadaşlarının ilgisi bizi çok mutlu etti.',
    source: 'Google Değerlendirmesi',
    avatarInitials: 'FB'
  },
  {
    id: 'rev-3',
    name: 'Ekrem Şahin',
    rating: 5,
    date: '3 hafta önce',
    comment: 'Mekan, ambiyans, yemek ve hizmet 10 numara 5 yıldız! Canlı müzik fasıl ekibi muhteşem eşlik etti, gönül rahatlığı ile gelebilirsiniz.',
    source: 'Google Değerlendirmesi',
    avatarInitials: 'EŞ'
  },
  {
    id: 'rev-4',
    name: 'Elif Ataker',
    rating: 5,
    date: 'Geçen ay',
    comment: 'Çok eğlendik! Ambiyans, lezzet, servis, konum ve güleryüzlü yaklaşımlarıyla HayalMest kesinlikle Bostancı’daki en favori meyhanemiz oldu.',
    source: 'Google Değerlendirmesi',
    avatarInitials: 'EA'
  },
  {
    id: 'rev-5',
    name: 'Onur Emre Danışman',
    rating: 5,
    date: '2 ay önce',
    comment: 'Şirket gecesi ve kutlama için tercih ettik, 20 kişilik grubumuzla eksiksiz ağırlandık. Sıcak mezeler ve kebaplar çok lezzetliydi.',
    source: 'Google Değerlendirmesi',
    avatarInitials: 'OD'
  },
  {
    id: 'rev-6',
    name: 'Can Gökçay',
    rating: 5,
    date: '1 ay önce',
    comment: 'Aydın Bey’e ve tüm servis ekibine çok teşekkür ederiz. Rezervasyondan ayrılana kadar her şey kusursuzdu.',
    source: 'Google Değerlendirmesi',
    avatarInitials: 'CG'
  }
];
