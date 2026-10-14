'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const pathname = usePathname();

  // Hide on admin, host, waiter, and table menu desks
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/host') || pathname?.startsWith('/garson') || pathname?.startsWith('/masa')) {
    return null;
  }

  return (
    <aside aria-label="Hızlı WhatsApp İletişimi" className="fixed bottom-6 right-6 z-50 flex items-center group">
      <div className="hidden md:flex mr-3 px-3 py-1.5 rounded-full bg-meyhane-surface/95 border border-gold/40 text-xs text-gold-200 shadow-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
        Canlı Rezervasyon & Bilgi Hattı
      </div>
      <a
        href="https://wa.me/905305012458?text=Merhaba,%20HayalMest%20rezervasyonu%20i%C3%A7in%20bilgi%20almak%20istiyorum."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp üzerinden iletişime geçin"
        className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-emerald-400/40 relative"
      >
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400"></span>
        </span>
        <MessageCircle className="w-7 h-7" />
      </a>
    </aside>
  );
}
