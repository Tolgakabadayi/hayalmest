import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Heart, Award, Users, CheckCircle2, CalendarCheck, Phone } from 'lucide-react';
import { REVIEWS_DATA } from '@/data/reviewsData';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-20">
      
      {/* Header / Intro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kadıköy Bostancı&apos;nın Buluşma Noktası</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white leading-tight">
            Hayatın En Özel Anlarını <br />
            <span className="gold-gradient-text italic font-normal">HayalMest’te Kutlayın</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light">
            Hayat, kutlamaya değer anlarla güzelleşir! İster romantik bir akşam yemeği, ister eğlenceli bir bekarlığa veda partisi, ister sevdiklerinizle paylaşacağınız özel bir davet... HayalMest Anadolu Meyhanesi, bu unutulmaz anlarınıza ev sahipliği yapmak için sizleri bekliyor.
          </p>

          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            HayalMest, sadece lezzetli yemekleriyle değil; sunduğu sıcak atmosfer, şık dekorasyonu ve özenli hizmetiyle de özel anlarınızı daha anlamlı kılıyor. Butik bir akşam yemeğinden kalabalık şirket kutlamalarına kadar her ayrıntıyı sizin için düşünüyoruz.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/rezervasyon"
              className="px-6 py-3.5 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/20 flex items-center gap-2"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Online Masa Ayırt</span>
            </Link>
            <a
              href="tel:05305012458"
              className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-meyhane-border font-medium text-xs uppercase tracking-wider flex items-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4 text-gold" />
              <span>0530 501 24 58</span>
            </a>
          </div>
        </div>

        <div className="relative h-96 sm:h-[450px] rounded-3xl overflow-hidden border border-meyhane-border shadow-2xl">
          <Image
            src="/assets/HayalMest-Meyhanesi-Bostanci-1.jpg"
            alt="HayalMest Bostancı Salon"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-meyhane-surface/90 border border-gold/30 backdrop-blur-md">
            <div className="text-xs text-gold font-semibold uppercase tracking-wider">
              Bostancı Kasaplar Çarşısı
            </div>
            <div className="text-sm font-bold text-white font-serif mt-0.5">
              Samimi Hizmet, Titiz İşletmecilik &amp; Gerçek Meyhane Adabı
            </div>
          </div>
        </div>
      </div>

      {/* Values & Standards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="luxury-card p-8 rounded-3xl border border-meyhane-border/70 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/40 text-gold flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold font-serif text-white">Tazelik &amp; Günlük Mezeler</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Mutfak tezgahımıza giren her zeytinyağı, ot, peynir ve et bizzat şefimiz tarafından seçilir. Dondurulmuş değil, her gün taze pişirilen geleneksel reçeteler servis edilir.
          </p>
        </div>

        <div className="luxury-card p-8 rounded-3xl border border-meyhane-border/70 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/40 text-gold flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold font-serif text-white">Titiz ve Güleryüzlü Servis</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Misafirlerimizin memnuniyeti en büyük önceliğimizdir. Servisin her aşamasında temiz tabak değişimi, eksiksiz masa ilgisi ve güler yüzlü karşılama standardımızdır.
          </p>
        </div>

        <div className="luxury-card p-8 rounded-3xl border border-meyhane-border/70 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/40 text-gold flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold font-serif text-white">Özel Organizasyon Danışmanlığı</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Doğum günü, bekarlığa veda veya nişan yemeklerinizde menü seçiminden masa süslemesine ve canlı müzik isteklerine kadar tüm süreci sizinle birlikte planlıyoruz.
          </p>
        </div>
      </div>

      {/* Verified Google Reviews */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white">
            Misafirlerimizin Yorumları
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Google Maps üzerinde işletmemizi değerlendiren 270+ misafirimizin samimi geri bildirimleri.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS_DATA.slice(0, 3).map((r) => (
            <div
              key={r.id}
              className="p-6 rounded-2xl bg-meyhane-surface/80 border border-meyhane-border/70 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{r.name}</span>
                <span className="text-gold font-semibold">5 / 5 ★</span>
              </div>
              <p className="text-gray-300 italic leading-relaxed">
                &ldquo;{r.comment}&rdquo;
              </p>
              <div className="text-[10px] text-meyhane-muted pt-2 border-t border-meyhane-border/50">
                {r.source} • {r.date}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
