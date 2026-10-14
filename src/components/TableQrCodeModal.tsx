'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Wine,
  QrCode as QrIcon
} from 'lucide-react';
import { TableItem, VENUE_SECTIONS } from '@/data/tablesData';

interface TableQrCodeModalProps {
  table: TableItem | { id: string; number: string; sectionId?: string; capacity?: number };
  onClose: () => void;
}

export default function TableQrCodeModal({ table, onClose }: TableQrCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const printCardRef = useRef<HTMLDivElement>(null);

  const section = VENUE_SECTIONS.find(s => s.id === table.sectionId);
  const sectionName = section ? section.name : 'HayalMest Ana Salon';

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hayalmest.com';
  const tableUrl = `${baseUrl}/masa/${encodeURIComponent(table.id)}`;

  useEffect(() => {
    QRCode.toDataURL(tableUrl, {
      width: 450,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR code generation error:', err));
  }, [tableUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(tableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `HayalMest-QR-${table.number.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn">
      <div className="luxury-card max-w-md w-full rounded-3xl p-5 sm:p-6 border border-gold/40 shadow-2xl bg-[#141824] space-y-4 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-meyhane-border/70 pb-3">
          <div className="flex items-center gap-2">
            <QrIcon className="w-5 h-5 text-gold" />
            <div>
              <h3 className="text-sm font-bold font-serif text-white">
                Masaya Özel QR Kod
              </h3>
              <p className="text-[11px] text-meyhane-muted">
                {table.number} · {sectionName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PRINTABLE TABLE TENT CARD TEMPLATE */}
        <div 
          ref={printCardRef}
          className="printable-card p-6 rounded-2xl bg-gradient-to-b from-[#181D2A] to-[#10131B] border-2 border-gold/50 shadow-xl text-center space-y-3 relative overflow-hidden"
        >
          {/* Subtle gold corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold/70" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold/70" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold/70" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold/70" />

          {/* Logo & Venue Name */}
          <div className="space-y-0.5">
            <div className="text-[10px] tracking-[0.25em] uppercase text-gold font-semibold">
              Anadolu Meyhanesi · Bostancı
            </div>
            <h2 className="text-xl font-bold font-serif text-white tracking-wider">
              HayâlMest
            </h2>
          </div>

          {/* Table Badge */}
          <div className="inline-block px-3 py-1 rounded-full bg-gold/15 border border-gold/50 text-gold text-xs font-bold font-serif">
            {table.number} · {sectionName}
          </div>

          {/* QR Code Canvas/Image */}
          <div className="flex justify-center py-2">
            {qrDataUrl ? (
              <div className="p-3 bg-white rounded-2xl shadow-xl inline-block border-2 border-gold/40">
                <img 
                  src={qrDataUrl} 
                  alt={`QR Code for ${table.number}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                />
              </div>
            ) : (
              <div className="w-48 h-48 bg-white/5 rounded-2xl flex items-center justify-center text-xs text-gray-400">
                QR Kod Üretiliyor...
              </div>
            )}
          </div>

          {/* Call to Action */}
          <div className="space-y-1">
            <div className="text-xs font-bold text-white tracking-wide">
              Menüyü İnceleyin &amp; Garson Çağırın
            </div>
            <p className="text-[10px] text-gray-400 max-w-xs mx-auto">
              Akıllı telefonunuzun kamerası ile QR kodu okutarak canlı menüye ulaşabilir, masanıza tek tıkla garson veya hesap çağırabilirsiniz.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownload}
            className="py-2.5 px-3 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-gold/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>QR'ı İndir</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 border border-meyhane-border"
          >
            <Printer className="w-3.5 h-3.5 text-gold" />
            <span>Yazdır (Print)</span>
          </button>
        </div>

        {/* Link Copy & Direct Open */}
        <div className="pt-1 flex items-center justify-between text-xs border-t border-meyhane-border/70">
          <button
            type="button"
            onClick={handleCopy}
            className="text-gray-400 hover:text-gold flex items-center gap-1.5 transition-colors py-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Kopyalandı!' : 'Masa Linkini Kopyala'}</span>
          </button>

          <a
            href={tableUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold/90 hover:text-gold flex items-center gap-1 transition-colors py-1"
          >
            <span>Sayfayı Test Et</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </div>
  );
}
