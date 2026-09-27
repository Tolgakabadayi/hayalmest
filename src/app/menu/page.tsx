'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Utensils, Wine, Sparkles, CalendarCheck } from 'lucide-react';
import { MENU_ITEMS, MENU_CATEGORIES, MenuItem } from '@/data/menuData';

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = MENU_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold">
          <Utensils className="w-3.5 h-3.5" />
          <span>Geleneksel &amp; İmza Meyhane Mutfağı</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">
          HayalMest Lezzet Menüsü
        </h1>
        <p className="text-sm sm:text-base text-gray-300 font-light leading-relaxed">
          Trakya ve Ege’nin taze mezeleri, kömür ateşinde pişen kebaplar ve zengin içki kütüphanemiz ile lezzete kadeh kaldırın.
        </p>
      </div>

      {/* Category Pills & Search */}
      <div className="space-y-4">
        {/* Search */}
        <div className="max-w-md mx-auto relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Meze, kebap, rakı veya tatlı ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-meyhane-surface border border-meyhane-border pl-11 pr-4 py-3 rounded-2xl text-white text-sm focus:border-gold focus:outline-none"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              selectedCategory === 'all'
                ? 'bg-gold text-black shadow-lg shadow-gold/20'
                : 'bg-meyhane-surface/80 text-gray-300 hover:text-white border border-meyhane-border'
            }`}
          >
            Tüm Menü ({MENU_ITEMS.length})
          </button>
          {MENU_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gold text-black shadow-lg shadow-gold/20'
                  : 'bg-meyhane-surface/80 text-gray-300 hover:text-white border border-meyhane-border'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="luxury-card rounded-2xl p-5 border border-meyhane-border/70 hover:border-gold/40 transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              {item.image && (
                <div className="relative h-44 w-full rounded-xl overflow-hidden mb-2">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-meyhane-card via-transparent to-transparent" />
                </div>
              )}

              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold font-serif text-white group-hover:text-gold transition-colors">
                    {item.name}
                  </h3>
                  {item.badge && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-gold/15 text-gold text-[10px] font-semibold border border-gold/30">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-base font-bold font-serif text-gold">
                    {item.price.toLocaleString('tr-TR')} TL
                  </div>
                  {item.unit && (
                    <div className="text-[10px] text-meyhane-muted">{item.unit}</div>
                  )}
                </div>
              </div>

              {item.description && (
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  {item.description}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-meyhane-border/40 flex items-center justify-between text-xs">
              <span className="text-[11px] text-meyhane-muted uppercase tracking-wider">
                {MENU_CATEGORIES.find(c => c.id === item.category)?.label}
              </span>
              <Link
                href="/rezervasyon"
                className="text-gold hover:text-white font-medium flex items-center gap-1 transition-colors"
              >
                <span>Masa Ayırt</span>
                <CalendarCheck className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-gray-400 text-sm">Aradığınız kriterlere uygun lezzet bulunamadı.</p>
          <button
            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
            className="text-xs text-gold underline hover:text-white"
          >
            Filtreleri Temizle
          </button>
        </div>
      )}

      {/* Reservation CTA Banner */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-meyhane-card via-meyhane-surface to-meyhane-card border border-gold/30 text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white">
          Bu Lezzetleri Masanızda Deneyimleyin
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto">
          Zengin meze dolabımız ve usta kebapçılarımızın günlük hazırladığı özel tatlar için yerinizi hemen ayırtın.
        </p>
        <Link
          href="/rezervasyon"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/20"
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Rezervasyon Yap</span>
        </Link>
      </div>

    </div>
  );
}
