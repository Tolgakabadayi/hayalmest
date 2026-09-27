'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, CalendarCheck, ShieldCheck, UserCheck } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide customer navbar on admin and host desks to prevent overlapping dashboard
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/host')) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Anasayfa' },
    { href: '/rezervasyon', label: 'Rezervasyon' },
    { href: '/menu', label: 'Menümüz' },
    { href: '/etkinlikler', label: 'Canlı Sahne' },
    { href: '/galeri', label: 'Galeri' },
    { href: '/hakkimizda', label: 'Hakkımızda' },
    { href: '/iletisim', label: 'İletişim' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled 
          ? 'bg-meyhane-bg/95 backdrop-blur-md border-b border-meyhane-border/70 py-3 shadow-2xl' 
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-full border border-gold/40 overflow-hidden bg-meyhane-surface flex items-center justify-center shadow-lg group-hover:border-gold transition-colors">
            <Image 
              src="/assets/favicon-300x300.png" 
              alt="HayalMest Logo"
              width={40}
              height={40}
              className="object-contain p-1"
            />
          </div>
          <div>
            <div className="text-xl font-bold tracking-wider text-white flex items-center gap-1 font-serif">
              HAYAL<span className="text-gold">MEST</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-meyhane-muted">
              Anadolu Meyhanesi
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm tracking-wide font-medium transition-colors relative py-1 ${
                  isActive 
                    ? 'text-gold font-semibold' 
                    : 'text-gray-300 hover:text-gold'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Quick Phone Call */}
          <a
            href="tel:05305012458"
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title="Telefonla Arayın"
          >
            <Phone className="w-3.5 h-3.5 text-gold" />
            <span className="hidden xl:inline">0530 501 24 58</span>
          </a>

          {/* Reserve CTA */}
          <Link
            href="/rezervasyon"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg bg-gradient-to-r from-gold-500 via-gold to-gold-600 text-black hover:brightness-110 shadow-lg shadow-gold/20 active:scale-95 transition-all"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Masa Ayırt</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/rezervasyon"
            className="px-3 py-1.5 text-xs font-semibold rounded bg-gold text-black uppercase tracking-wider"
          >
            Rezervasyon
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-300 hover:text-white rounded-lg focus:outline-none"
            aria-label="Menü"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="sm:hidden bg-meyhane-surface/98 border-b border-meyhane-border px-4 pt-3 pb-6 space-y-3 backdrop-blur-xl animate-fadeIn">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-base font-medium ${
                pathname === link.href
                  ? 'bg-gold/15 text-gold font-semibold border-l-4 border-gold'
                  : 'text-gray-200 hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-meyhane-border/70 flex flex-col gap-2">
            <a
              href="tel:05305012458"
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 text-gray-200 text-sm font-medium"
            >
              <Phone className="w-4 h-4 text-gold" />
              0530 501 24 58 (Bizi Arayın)
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
