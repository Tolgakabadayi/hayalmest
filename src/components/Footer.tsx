'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Youtube, CalendarCheck, UserCheck } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Hide on admin and host panels
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/host')) {
    return null;
  }

  return (
    <footer className="bg-meyhane-bg border-t border-meyhane-border/70 pt-16 pb-12 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Col 1: About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-serif tracking-wider text-white">
                HAYAL<span className="text-gold">MEST</span>
              </span>
            </div>
            <p className="text-sm text-meyhane-muted leading-relaxed">
              Her kadehte bir anı, her masada bir dostluk. Lezzete kadeh kaldırın. HayalMest Anadolu Meyhanesi, en özel kutlamalarınıza, canlı fasıl gecelerine ve enfes lezzetlere Bostancı’da ev sahipliği yapıyor.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.instagram.com/hayalmest_bostanci/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-meyhane-surface border border-meyhane-border flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold transition-colors"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.facebook.com/hayalmestmeyhanesi"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-meyhane-surface border border-meyhane-border flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold transition-colors"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.youtube.com/@HayalmestBostancı"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-meyhane-surface border border-meyhane-border flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold transition-colors"
                title="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Fast Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-serif border-b border-gold/30 pb-2 inline-block">
              Hızlı Menü
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>
                <Link href="/" className="hover:text-gold transition-colors">Anasayfa</Link>
              </li>
              <li>
                <Link href="/rezervasyon" className="hover:text-gold transition-colors flex items-center gap-1.5 text-gold">
                  <CalendarCheck className="w-3.5 h-3.5" />
                  Online Masa Rezervasyonu
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-gold transition-colors">Meze & Yemek Menüsü</Link>
              </li>
              <li>
                <Link href="/etkinlikler" className="hover:text-gold transition-colors">Canlı Fasıl & Sahne Takvimi</Link>
              </li>
              <li>
                <Link href="/galeri" className="hover:text-gold transition-colors">Mekan Fotoğraf Galerisi</Link>
              </li>
              <li>
                <Link href="/hakkimizda" className="hover:text-gold transition-colors">Hakkımızda & Meyhane Ruhu</Link>
              </li>
              <li>
                <Link href="/iletisim" className="hover:text-gold transition-colors">Ulaşım & Kroki</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Hours & Booking */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-serif border-b border-gold/30 pb-2 inline-block">
              Çalışma & Seans Saatleri
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 text-gray-400">
                <Clock className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                <div>
                  <div className="text-white font-medium">Haftanın 7 Günü Açık</div>
                  <div className="text-xs text-meyhane-muted">16:00 - 02:00 Arası Hizmet</div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-meyhane-surface/70 border border-meyhane-border/70 text-xs leading-relaxed space-y-1">
                <div className="text-gold font-medium">Canlı Fasıl Saatleri:</div>
                <div className="text-gray-400">Çarşamba - Pazar: 20:30 - 00:30</div>
                <div className="text-[11px] text-meyhane-muted pt-1">Hafta sonu canlı müzik günlerinde erken rezervasyon önerilir.</div>
              </div>
            </div>
          </div>

          {/* Col 4: Contact info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-serif border-b border-gold/30 pb-2 inline-block">
              İletişim & Konum
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                <span className="text-xs text-gray-300 leading-relaxed">
                  Altıntepe Mahallesi, Kasaplar Çarşısı, Bağdat Caddesi No:4, 34840 Maltepe / İstanbul (Bostancı Sınırı)
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold flex-shrink-0" />
                <a href="tel:05305012458" className="text-white hover:text-gold transition-colors font-medium">
                  0530 501 24 58
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold flex-shrink-0" />
                <a href="mailto:rezervasyon@hayalmest.com" className="text-xs text-gray-400 hover:text-gold transition-colors">
                  rezervasyon@hayalmest.com
                </a>
              </li>
            </ul>
            <div className="pt-2">
              <Link
                href="/rezervasyon"
                className="w-full py-2.5 px-4 rounded-lg bg-gold/15 hover:bg-gold/25 border border-gold/50 text-gold hover:text-white text-xs font-semibold text-center block transition-all uppercase tracking-wider"
              >
                Hemen Masa Ayırtın
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-meyhane-border/50 flex flex-col sm:flex-row items-center justify-between text-xs text-meyhane-muted gap-4">
          <p>© <span suppressHydrationWarning>{new Date().getFullYear()}</span> HayalMest Anadolu Meyhanesi. Tüm Hakları Saklıdır.</p>
          <div className="flex items-center gap-6">
            <Link href="/menu" className="hover:text-gray-300">Menü & Fiyatlar</Link>
            <Link href="/rezervasyon" className="hover:text-gray-300">Rezervasyon Şartları</Link>
            <div className="flex items-center gap-2 border-l border-meyhane-border/40 pl-4">
              <Link href="/admin/login" className="text-meyhane-muted/40 hover:text-gray-400 text-[11px] transition-colors" title="Yönetici Girişi">
                Yönetici
              </Link>
              <span className="text-meyhane-muted/30">·</span>
              <Link href="/host/login" className="text-meyhane-muted/40 hover:text-gray-400 text-[11px] transition-colors" title="Host Masası Girişi">
                Host
              </Link>
              <span className="text-meyhane-muted/30">·</span>
              <Link href="/garson/login" className="text-meyhane-muted/40 hover:text-gray-400 text-[11px] transition-colors" title="Garson Paneli Girişi">
                Garson
              </Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
