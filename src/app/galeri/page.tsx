'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Camera, X, CalendarCheck, ZoomIn } from 'lucide-react';

interface GalleryItem {
  src: string;
  title: string;
  category: 'salon' | 'lezzet' | 'sahne';
  categoryLabel: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  { src: '/assets/Bostanci-Meyhane-Keyif-Masasi.jpeg', title: 'Meyhane Keyif Masası & Rakı Sunumu', category: 'lezzet', categoryLabel: 'Lezzet & Masalar' },
  { src: '/assets/Hayalmest-sahne.jpg', title: 'Canlı Müzik & Fasıl Sahnesi', category: 'sahne', categoryLabel: 'Sahne & Fasıl' },
  { src: '/assets/HayalMest-Meyhanesi-Bostanci-1.jpg', title: 'Ana Salon Ahşap Detaylar & Masa Düzeni', category: 'salon', categoryLabel: 'Salon & Ambiyans' },
  { src: '/assets/Hayamest-Mezeler.jpg', title: 'Günlük Taze Meze Çeşitlerimiz', category: 'lezzet', categoryLabel: 'Lezzet & Masalar' },
  { src: '/assets/HayalMest-Meyhanesi-Bostanci-2.jpg', title: 'Ferah Masa Oturumu & Şık Aydınlatma', category: 'salon', categoryLabel: 'Salon & Ambiyans' },
  { src: '/assets/Karisi-Kebap.jpg', title: 'Özel Zırh Kıyma Karışık Kebap', category: 'lezzet', categoryLabel: 'Lezzet & Masalar' },
  { src: '/assets/HayalMest-Meyhanesi-Bostanci-3.jpg', title: 'Grup Kutlama Masaları & Özel Loca', category: 'salon', categoryLabel: 'Salon & Ambiyans' },
  { src: '/assets/HayalMest-Meyhanesi-Bostanci-4.jpg', title: 'Sahne Açısı & Sıcak Işıklar', category: 'sahne', categoryLabel: 'Sahne & Fasıl' },
  { src: '/assets/Ickiler.jpg', title: 'Zengin Rakı & İçecek Menümüz', category: 'lezzet', categoryLabel: 'Lezzet & Masalar' },
  { src: '/assets/HayalMest-Meyhanesi-Bostanci-5.jpg', title: 'Meyhane Giriş & Dinlenme Alanı', category: 'salon', categoryLabel: 'Salon & Ambiyans' },
  { src: '/assets/Salatalar.jpg', title: 'Taze Çoban ve Gavurdağı Salatası', category: 'lezzet', categoryLabel: 'Lezzet & Masalar' },
  { src: '/assets/mevye-tabagi.jpg', title: 'Mevsim Meyveleri & İkram Tabağı', category: 'lezzet', categoryLabel: 'Lezzet & Masalar' },
];

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeImage, setActiveImage] = useState<GalleryItem | null>(null);

  const filtered = GALLERY_ITEMS.filter(
    item => selectedCategory === 'all' || item.category === selectedCategory
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold">
          <Camera className="w-3.5 h-3.5" />
          <span>Görsel Deneyim</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">
          HayalMest Fotoğraf Galerisi
        </h1>
        <p className="text-sm sm:text-base text-gray-300 font-light leading-relaxed">
          Bostancı’daki mekanımızın sıcak atmosferi, usta ellerden çıkan meze sunumları ve canlı fasıl gecelerimizden anlar.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
            selectedCategory === 'all'
              ? 'bg-gold text-black shadow-lg shadow-gold/20'
              : 'bg-meyhane-surface text-gray-300 hover:text-white border border-meyhane-border'
          }`}
        >
          Tüm Fotoğraflar ({GALLERY_ITEMS.length})
        </button>
        <button
          onClick={() => setSelectedCategory('salon')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
            selectedCategory === 'salon'
              ? 'bg-gold text-black shadow-lg shadow-gold/20'
              : 'bg-meyhane-surface text-gray-300 hover:text-white border border-meyhane-border'
          }`}
        >
          Salon &amp; Ambiyans
        </button>
        <button
          onClick={() => setSelectedCategory('lezzet')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
            selectedCategory === 'lezzet'
              ? 'bg-gold text-black shadow-lg shadow-gold/20'
              : 'bg-meyhane-surface text-gray-300 hover:text-white border border-meyhane-border'
          }`}
        >
          Meze &amp; Lezzetler
        </button>
        <button
          onClick={() => setSelectedCategory('sahne')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
            selectedCategory === 'sahne'
              ? 'bg-gold text-black shadow-lg shadow-gold/20'
              : 'bg-meyhane-surface text-gray-300 hover:text-white border border-meyhane-border'
          }`}
        >
          Canlı Sahne &amp; Fasıl
        </button>
      </div>

      {/* Masonry / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item, index) => (
          <div
            key={index}
            onClick={() => setActiveImage(item)}
            className="group relative h-72 rounded-2xl overflow-hidden cursor-pointer border border-meyhane-border/70 hover:border-gold/50 shadow-xl transition-all"
          >
            <Image
              src={item.src}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />

            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-4 h-4" />
            </div>

            <div className="absolute bottom-4 left-4 right-4 space-y-1">
              <span className="text-[10px] text-gold font-semibold uppercase tracking-wider block">
                {item.categoryLabel}
              </span>
              <h3 className="text-sm font-bold text-white font-serif line-clamp-1">
                {item.title}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div 
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 sm:p-10 flex items-center justify-center animate-fadeIn"
        >
          <button
            onClick={() => setActiveImage(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[85vh] w-full rounded-2xl overflow-hidden bg-meyhane-card border border-gold/40 flex flex-col shadow-2xl"
          >
            <div className="relative h-[65vh] w-full bg-black">
              <Image
                src={activeImage.src}
                alt={activeImage.title}
                fill
                className="object-contain"
              />
            </div>
            <div className="p-4 sm:p-6 bg-meyhane-surface flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-gold font-semibold uppercase tracking-wider block">
                  {activeImage.categoryLabel}
                </span>
                <h3 className="text-base font-bold text-white font-serif mt-0.5">
                  {activeImage.title}
                </h3>
              </div>
              <Link
                href="/rezervasyon"
                className="px-5 py-2.5 rounded-xl bg-gold text-black text-xs font-semibold uppercase tracking-wider hover:brightness-110 flex items-center gap-1.5 flex-shrink-0"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Masa Ayırt</span>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
