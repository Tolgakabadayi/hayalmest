'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  Clock, 
  Sparkles, 
  Music, 
  Star, 
  ChevronRight, 
  MapPin, 
  Wine, 
  Utensils, 
  PartyPopper,
  CheckCircle2,
  ArrowRight,
  Eye,
  ChevronDown,
  X
} from 'lucide-react';
import { StageEvent, STAGE_EVENTS as FALLBACK_EVENTS } from '@/data/eventsData';
import { VENUE_SECTIONS, TableSection } from '@/data/tablesData';
import { REVIEWS_DATA } from '@/data/reviewsData';
import { getNextEventDate } from '@/lib/dateUtils';

export default function HomePage() {
  const router = useRouter();
  const [quickDate, setQuickDate] = useState('');
  useEffect(() => {
    setQuickDate(new Date().toISOString().split('T')[0]);
  }, []);
  const [quickGuests, setQuickGuests] = useState('4');
  const [quickSection, setQuickSection] = useState('vip_sahne');
  const [selectedSectionDetail, setSelectedSectionDetail] = useState<TableSection | null>(null);

  const [events, setEvents] = useState<StageEvent[]>(FALLBACK_EVENTS);
  const [siteContent, setSiteContent] = useState<any>(null);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setEvents(json.data);
        }
      })
      .catch(err => console.error('Events error:', err));

    fetch('/api/content')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setSiteContent(json.data);
        }
      })
      .catch(err => console.error('Content error:', err));
  }, []);

  const handleQuickBooking = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/rezervasyon?date=${quickDate}&guests=${quickGuests}&section=${quickSection}`);
  };

  const heroBg = siteContent?.hero?.backgroundImage || '/assets/HayalMest-Meyhanesi-Bostanci-1.jpg';
  const heroSubtitle = siteContent?.hero?.subtitle || 'Kadıköy Bostancı’da Canlı Fasıl & Anadolu Meyhanesi';
  const heroDescription = siteContent?.hero?.description || 'Geleneksel Türk mezeleri, kömür ateşinde pişen enfes kebaplar ve kanun nağmeleriyle süslenen unutulmaz geceler. Masanızı şimdiden ayırtın, anılarınıza lezzet katın.';

  return (
    <div className="space-y-24 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden -mt-20 pt-24">
        {/* Background Image with Dark Vignette */}
        <div className="absolute inset-0 z-0">
          <Image
            src={heroBg}
            alt="HayalMest Bostancı Meyhanesi"
            fill
            priority
            className="object-cover object-center scale-105 filter brightness-[0.38] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-meyhane-bg via-meyhane-bg/60 to-black/70" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-meyhane-bg" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 pt-12">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/40 text-gold-300 text-xs sm:text-sm font-medium tracking-wide backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>{heroSubtitle}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold font-serif text-white tracking-tight leading-[1.15]">
            Her Kadehte Bir Anı, <br />
            <span className="gold-gradient-text italic font-normal">Her Masada Bir Dostluk</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-300 leading-relaxed font-light">
            {heroDescription}
          </p>

          {/* Quick Interactive Booking Bar */}
          <div className="max-w-4xl mx-auto pt-4">
            <form 
              onSubmit={handleQuickBooking}
              className="p-3 sm:p-4 rounded-2xl bg-meyhane-surface/90 border border-gold/30 backdrop-blur-xl shadow-2xl grid grid-cols-1 sm:grid-cols-4 gap-3 text-left"
            >
              {/* Date */}
              <div className="p-2.5 rounded-xl bg-meyhane-card/90 border border-meyhane-border/70 hover:border-gold/40 transition-colors">
                <label className="block text-[11px] uppercase tracking-wider text-meyhane-muted font-medium mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  Rezervasyon Tarihi
                </label>
                <input
                  type="date"
                  value={quickDate}
                  min={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  suppressHydrationWarning={true}
                  style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                  className="w-full bg-transparent text-sm text-white font-medium border-0 border-none outline-none ring-0 focus:ring-0 focus:outline-none cursor-pointer"
                  required
                />
              </div>

              {/* Guests */}
              <div className="p-2.5 rounded-xl bg-meyhane-card/90 border border-meyhane-border/70 hover:border-gold/40 transition-colors">
                <label className="block text-[11px] uppercase tracking-wider text-meyhane-muted font-medium mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gold" />
                  Kişi Sayısı
                </label>
                <div className="relative flex items-center">
                  <select
                    value={quickGuests}
                    onChange={(e) => setQuickGuests(e.target.value)}
                    style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    className="w-full bg-transparent text-sm text-white font-medium border-0 border-none outline-none ring-0 focus:ring-0 focus:outline-none cursor-pointer appearance-none pr-6"
                  >
                    <option value="2" className="bg-[#181D28] text-white">2 Kişilik Masa</option>
                    <option value="4" className="bg-[#181D28] text-white">4 Kişilik Masa</option>
                    <option value="6" className="bg-[#181D28] text-white">6 Kişilik Masa</option>
                    <option value="8" className="bg-[#181D28] text-white">8 Kişilik Grup</option>
                    <option value="12" className="bg-[#181D28] text-white">12+ Kişilik Özel Grup</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gold/80 absolute right-0 pointer-events-none" />
                </div>
              </div>

              {/* Section */}
              <div className="p-2.5 rounded-xl bg-meyhane-card/90 border border-meyhane-border/70 hover:border-gold/40 transition-colors">
                <label className="block text-[11px] uppercase tracking-wider text-meyhane-muted font-medium mb-1 flex items-center gap-1.5">
                  <Wine className="w-3.5 h-3.5 text-gold" />
                  Masa / Alan
                </label>
                <div className="relative flex items-center">
                  <select
                    value={quickSection}
                    onChange={(e) => setQuickSection(e.target.value)}
                    style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    className="w-full bg-transparent text-sm text-white font-medium border-0 border-none outline-none ring-0 focus:ring-0 focus:outline-none cursor-pointer appearance-none pr-6"
                  >
                    <option value="vip_sahne" className="bg-[#181D28] text-white">Sahne Önü (VIP Fasıl)</option>
                    <option value="salon" className="bg-[#181D28] text-white">Orta Salon (Muhabbet)</option>
                    <option value="bahce" className="bg-[#181D28] text-white">Bahçe &amp; Teras (Ferah)</option>
                    <option value="loca" className="bg-[#181D28] text-white">Özel Loca (Kutlama)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gold/80 absolute right-0 pointer-events-none" />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center">
                <button
                  type="submit"
                  className="w-full h-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-gold-500 via-gold to-gold-600 text-black font-semibold text-sm uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Masa Bul</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Highlights Mini Banner */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gold" />
              <span>Canlı Fasıl &amp; TSM</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gold" />
              <span>50+ Günlük Taze Meze</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gold" />
              <span>Kuşbakışı Masa Seçimi</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gold" />
              <span>Vale &amp; Otopark Hizmeti</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. CANLI SAHNE & ETKİNLİK VİTRİNİ (DYNAMIC FROM API) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-3">
              <Music className="w-4 h-4" />
              Sahnede Bu Hafta
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white">
              Canlı Fasıl ve Müzik Programı
            </h2>
          </div>
          <Link
            href="/etkinlikler"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm text-gold hover:text-white transition-colors"
          >
            <span>Tüm Sahne Takvimini Gör</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="luxury-card rounded-2xl overflow-hidden border border-meyhane-border/70 hover:border-gold/40 transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={event.image || '/assets/Hayalmest-sahne.jpg'}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-meyhane-surface via-transparent to-black/30" />
                {event.badge && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gold text-black text-[10px] font-bold uppercase tracking-wider">
                    {event.badge}
                  </span>
                )}
                <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-gold-300 text-xs font-medium border border-gold/30">
                  {event.day}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-meyhane-muted mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-gold" />
                    <span>{event.time}</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-gold transition-colors font-serif">
                    {event.title}
                  </h3>
                  <p className="text-xs text-gold-300/90 font-medium mt-1">
                    {event.performer}
                  </p>
                  <p className="text-xs text-gray-400 mt-2.5 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {(() => {
                  const targetDate = getNextEventDate(event);
                  return (
                    <Link
                      href={`/rezervasyon?event=${event.id}&date=${targetDate}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-gold hover:text-black border border-meyhane-border hover:border-gold text-xs font-semibold text-center transition-all duration-300 uppercase tracking-wider block"
                    >
                      Masa Ayırt ({targetDate})
                    </Link>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. MEYHANE AMBİYANSI & GÖRSEL VİTRİN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold font-semibold">
              <Sparkles className="w-4 h-4" />
              HayalMest Ruhu
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold font-serif text-white leading-tight">
              Bostancı’da Zamanın <br />
              <span className="gold-gradient-text italic font-normal">Yavaş Aktığı Masalar</span>
            </h2>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
              Meyhane sadece yemek yenilen bir yer değil; dostların birbiriyle dertleştiği, neşenin paylaşıldığı, kadehlerin sevgiye ve sağlığa kalktığı bir kültürdür.
            </p>
            <p className="text-gray-400 leading-relaxed text-sm">
              HayalMest Bostancı’da ahşap dokuların sıcaklığı, özenle seçilmiş loş aydınlatmalar ve her masaya titizlikle yetişen profesyonel servis ekibimizle sizi gerçek bir meyhane deneyimine davet ediyoruz.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-meyhane-surface/70 border border-meyhane-border">
                <div className="text-2xl sm:text-3xl font-bold font-serif text-gold">50+</div>
                <div className="text-xs text-gray-400 mt-1">Geleneksel Günlük Taze Meze</div>
              </div>
              <div className="p-4 rounded-xl bg-meyhane-surface/70 border border-meyhane-border">
                <div className="text-2xl sm:text-3xl font-bold font-serif text-gold">4.9 / 5</div>
                <div className="text-xs text-gray-400 mt-1">270+ Doğrulanmış Google Yorumu</div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/rezervasyon"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-black font-semibold text-sm uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/20"
              >
                Hemen Masa Ayırtın
              </Link>
              <Link
                href="/galeri"
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-meyhane-border font-medium text-sm transition-colors"
              >
                Fotoğraf Galerisini Gez
              </Link>
            </div>
          </div>

          {/* Mosaic Photos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="relative h-64 rounded-2xl overflow-hidden border border-meyhane-border/70 shadow-xl">
                <Image
                  src="/assets/Bostanci-Meyhane-Keyif-Masasi.jpeg"
                  alt="Meyhane Keyif Masası"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="relative h-44 rounded-2xl overflow-hidden border border-meyhane-border/70 shadow-xl">
                <Image
                  src="/assets/Hayamest-Mezeler.jpg"
                  alt="Özel HayalMest Mezeleri"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="relative h-44 rounded-2xl overflow-hidden border border-meyhane-border/70 shadow-xl">
                <Image
                  src="/assets/Karisi-Kebap.jpg"
                  alt="Karışık Kebap Sunumu"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="relative h-64 rounded-2xl overflow-hidden border border-meyhane-border/70 shadow-xl">
                <Image
                  src="/assets/HayalMest-Meyhanesi-Bostanci-3.jpg"
                  alt="Salon Görünümü"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. İNTERAKTİF SALON VE MASA SEÇİMİ TANITIMI */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold font-semibold">
            <Users className="w-4 h-4" />
            Kuşbakışı Masa &amp; Koltuk Seçimi
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white">
            Nerede Oturmak İstersiniz?
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">
            Sürpriz yok! Uçak koltuk seçimi gibi, kuşbakışı harita üzerinden sahneye mesafenizi ve masanızı canlı seçebilirsiniz.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {VENUE_SECTIONS.map((section) => (
            <div
              key={section.id}
              className="luxury-card rounded-2xl overflow-hidden border border-meyhane-border/70 hover:border-gold/50 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="relative h-44 w-full">
                <Image
                  src={section.image}
                  alt={section.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-meyhane-surface via-transparent to-black/30" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-gold text-[11px] font-semibold border border-gold/40">
                  {section.badge}
                </span>
                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-white/10 text-white text-[11px] font-medium backdrop-blur-sm">
                  {section.capacityRange}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold font-serif text-white group-hover:text-gold transition-colors">
                    {section.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    {section.shortDesc}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedSectionDetail(section)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-meyhane-border text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-gold" />
                    <span>Bölgeyi Gör</span>
                  </button>
                  <Link
                    href={`/rezervasyon?section=${section.id}`}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gold/15 hover:bg-gold text-gold hover:text-black border border-gold/40 text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
                  >
                    <span>Masa Ayırt</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. ÖNE ÇIKAN MENÜ VE LEZZETLER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="luxury-card rounded-3xl p-8 sm:p-12 border border-meyhane-border/80 relative overflow-hidden">
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-2">
                <Utensils className="w-4 h-4" />
                Ustalıkla Hazırlanan Eşsiz Tatlar
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white">
                Meyhane Klasikleri &amp; İmza Lezzetler
              </h2>
            </div>
            <Link
              href="/menu"
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-gold hover:text-black border border-gold/40 text-gold text-xs font-semibold uppercase tracking-wider transition-all"
            >
              Tam Menüyü &amp; Fiyatları Gör
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="p-5 rounded-2xl bg-meyhane-bg/70 border border-meyhane-border/70 hover:border-gold/30 transition-colors space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gold font-semibold uppercase tracking-wider">Soğuk Meze</span>
                <span className="text-xs font-bold text-white">300 TL</span>
              </div>
              <h3 className="text-base font-bold text-white font-serif">Özel Süzme Atom &amp; Fava</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Tereyağında dağlanmış Arnavut biberi ile süzme yoğurdun buluşması ve dereotlu sızma zeytinyağlı Ege favası.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-meyhane-bg/70 border border-meyhane-border/70 hover:border-gold/30 transition-colors space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gold font-semibold uppercase tracking-wider">Kömürde Izgara</span>
                <span className="text-xs font-bold text-white">800 TL</span>
              </div>
              <h3 className="text-base font-bold text-white font-serif">Zırhtan Çekme Adana &amp; Urfa</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Usta ellerde zırhla kıyılan kuzu eti, közlenmiş domates, biber ve sumaklı taze soğan salatası eşliğinde.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-meyhane-bg/70 border border-meyhane-border/70 hover:border-gold/30 transition-colors space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gold font-semibold uppercase tracking-wider">Şefin Gurme Seçimi</span>
                <span className="text-xs font-bold text-white">1.400 TL</span>
              </div>
              <h3 className="text-base font-bold text-white font-serif">Kuzu Pirzola &amp; Yağlı Kara</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Özel kekik marine edilmiş kemikli pirzola veya kuzu sırtından yumuşacık yağlı kara lezzeti.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. MİSAFİR DEĞERLENDİRMELERİ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold">
            <Star className="w-3.5 h-3.5 fill-gold text-gold" />
            <span>Google Doğrulanmış Değerlendirmeler</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white">
            Bizi Misafirlerimizden Dinleyin
          </h2>
          <p className="text-gray-400 text-sm">
            270+ mutlu misafir değerlendirmesiyle Kadıköy ve Bostancı’nın en sevilen Anadolu Meyhanesi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS_DATA.slice(0, 6).map((rev) => (
            <div
              key={rev.id}
              className="luxury-card p-6 rounded-2xl border border-meyhane-border/70 flex flex-col justify-between space-y-4 hover:border-gold/30 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gold">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <span className="text-[11px] text-meyhane-muted">{rev.date}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-meyhane-border/50">
                <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs font-bold flex items-center justify-center">
                  {rev.avatarInitials}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{rev.name}</div>
                  <div className="text-[10px] text-meyhane-muted">{rev.source}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. ÖZEL KUTLAMALAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-14 border border-gold/30 shadow-2xl bg-gradient-to-br from-meyhane-card via-meyhane-surface to-black">
          <div className="max-w-2xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-semibold">
              <PartyPopper className="w-3.5 h-3.5" />
              Özel Organizasyonlar &amp; Kutlamalar
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold font-serif text-white leading-tight">
              Hayatın En Özel Anlarını <br />
              <span className="gold-gradient-text italic font-normal">HayalMest’te Kutlayın</span>
            </h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Doğum günleri, bekarlığa veda partileri, yıl dönümleri veya şirket yemekleri... Masa süslemesi, pasta seremonisi ve canlı fasıl müziğimizle unutulmaz bir kutlama hazırlıyoruz.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/rezervasyon?occasion=dogum_gunu"
                className="px-6 py-3.5 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/25"
              >
                Kutlama Rezervasyonu Yap
              </Link>
              <a
                href="https://wa.me/905305012458?text=Merhaba,%20%C3%B6zel%20kutlama%20organizasyonu%20i%C3%A7in%20bilgi%20almak%20istiyorum."
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-meyhane-border font-medium text-xs uppercase tracking-wider transition-colors"
              >
                Özel Menü Teklifi Al (WhatsApp)
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 8. KONUM & ULAŞIM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold font-semibold">
              <MapPin className="w-4 h-4" />
              Kolay Ulaşım
            </div>
            <h2 className="text-3xl font-bold font-serif text-white">
              Bostancı Kasaplar Çarşısı’ndayız
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              {siteContent?.address || 'Altıntepe Mahallesi, Kasaplar Çarşısı, Altıntepe, Bağdat Cad. No:4, 34840 Maltepe / İstanbul.'}
            </p>
            <p className="text-xs text-meyhane-muted">
              Marmaray Bostancı istasyonuna ve minibüs caddesine yürüme mesafesinde. Aracınız için vale ve otopark imkanı mevcuttur.
            </p>
            <div className="pt-2">
              <a
                href="https://maps.google.com/?q=Altıntepe+Mahallesi+Kasaplar+Çarşısı+Bağdat+Cad+No:4+Maltepe"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold uppercase tracking-wider transition-colors border border-meyhane-border"
              >
                <MapPin className="w-4 h-4 text-gold" />
                Google Haritalarda Aç
              </a>
            </div>
          </div>

          <div className="lg:col-span-2 h-72 sm:h-80 rounded-2xl overflow-hidden border border-meyhane-border relative shadow-xl">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3013.3444458319694!2d29.0945863!3d40.9515904!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cac6420556157f%3A0x86619bf188f57297!2sAlt%C4%B1ntepe%2C%20Ba%C4%9Fdat%20Cd.%20No%3A4%2C%2034840%20Maltepe%2F%C4%B0stanbul!5e0!3m2!1str!2str!4v1710000000000!5m2!1str!2str"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale-[30%] contrast-[1.1] filter"
              title="HayalMest Bostancı Konum Haritası"
            />
          </div>
        </div>
      </section>

      {/* SECTION DETAIL PREVIEW MODAL */}
      {selectedSectionDetail && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn">
          <div className="luxury-card max-w-xl w-full rounded-3xl overflow-hidden border border-gold/40 shadow-2xl space-y-0 relative">
            <div className="relative h-64 sm:h-72 w-full">
              <Image
                src={selectedSectionDetail.image}
                alt={selectedSectionDetail.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-meyhane-card via-black/30 to-black/60" />
              
              <button
                type="button"
                onClick={() => setSelectedSectionDetail(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white border border-white/20 transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-gold text-xs font-semibold border border-gold/40">
                  {selectedSectionDetail.badge}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-sm">
                  {selectedSectionDetail.capacityRange}
                </span>
              </div>

              <div className="absolute bottom-4 left-5 right-5">
                <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white">
                  {selectedSectionDetail.name}
                </h3>
              </div>
            </div>

            <div className="p-6 sm:p-7 space-y-5 bg-meyhane-card">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-gold font-semibold mb-1.5">
                  Bölge Ambiyansı &amp; Özellikleri
                </h4>
                <p className="text-sm text-gray-200 leading-relaxed font-light">
                  {selectedSectionDetail.longDesc || selectedSectionDetail.shortDesc}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-meyhane-surface/80 border border-meyhane-border/70">
                  <div className="text-meyhane-muted text-[11px] mb-0.5">Masa Kapasitesi</div>
                  <div className="text-white font-semibold">{selectedSectionDetail.capacityRange}</div>
                </div>
                <div className="p-3 rounded-xl bg-meyhane-surface/80 border border-meyhane-border/70">
                  <div className="text-meyhane-muted text-[11px] mb-0.5">Konum Özelliği</div>
                  <div className="text-gold font-semibold">{selectedSectionDetail.badge}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSectionDetail(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-meyhane-border transition-colors text-center"
                >
                  Kapat
                </button>
                <Link
                  href={`/rezervasyon?section=${selectedSectionDetail.id}`}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gold-500 via-gold to-gold-600 text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/25 transition-all text-center flex items-center justify-center gap-2"
                >
                  <span>Bu Bölgede Masa Ayırt</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
