'use client';

import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  Wine, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Utensils, 
  MessageCircle, 
  Trash2, 
  Sparkles,
  PartyPopper,
  Edit3
} from 'lucide-react';
import { Reservation } from '@/lib/storage';
import { ALL_TABLES, VENUE_SECTIONS, TableItem } from '@/data/tablesData';
import { formatTableDisplay } from '@/lib/formatters';

interface ReservationDetailModalProps {
  reservation: Reservation | null;
  tables?: TableItem[];
  onClose: () => void;
  onStatusChange: (id: string, status: Reservation['status']) => void;
  onTableChange: (id: string, newTableId: string, newSectionId?: any) => void;
  onDelete: (id: string) => void;
}

export default function ReservationDetailModal({
  reservation,
  tables,
  onClose,
  onStatusChange,
  onTableChange,
  onDelete,
}: ReservationDetailModalProps) {
  const [isChangingTable, setIsChangingTable] = useState(false);
  const [selectedNewTable, setSelectedNewTable] = useState(reservation?.tableId || '');

  if (!reservation) return null;

  const pool = (tables && tables.length > 0) ? tables : ALL_TABLES;
  const section = VENUE_SECTIONS.find(s => s.id === reservation.sectionId);
  const formattedTable = formatTableDisplay(reservation.tableId, reservation.sectionId, pool);

  const handleApplyTableChange = () => {
    const tableObj = pool.find(t => t.id === selectedNewTable);
    onTableChange(reservation.id, selectedNewTable, tableObj?.sectionId || reservation.sectionId);
    setIsChangingTable(false);
  };

  const whatsappMessage = `Merhaba Sayın ${reservation.fullName}, HayalMest Anadolu Meyhanesi #${reservation.pnr} kodlu rezervasyonunuz hakkında yazıyorum. Tarih: ${reservation.date}, Saat: ${reservation.time}, Kişi: ${reservation.guestCount} (${formattedTable}).`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center animate-fadeIn">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="luxury-card max-w-2xl w-full rounded-3xl p-6 sm:p-8 border border-gold/40 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto"
      >
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-meyhane-border/70 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-gold tracking-wider">
                #{reservation.pnr}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                reservation.status === 'confirmed'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : reservation.status === 'pending'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : reservation.status === 'seated'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {reservation.status === 'confirmed' && 'Onaylandı'}
                {reservation.status === 'pending' && 'Onay Bekliyor'}
                {reservation.status === 'seated' && 'Masada'}
                {reservation.status === 'cancelled' && 'İptal Edildi'}
              </span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-white">
              {reservation.fullName}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact Strip */}
        <div className="p-4 rounded-2xl bg-meyhane-bg/70 border border-meyhane-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <a
              href={`tel:${reservation.phone}`}
              className="flex items-center gap-1.5 text-white hover:text-gold font-semibold transition-colors"
            >
              <Phone className="w-4 h-4 text-gold" />
              <span>{reservation.phone}</span>
            </a>

            {reservation.email && (
              <a
                href={`mailto:${reservation.email}`}
                className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 text-gold" />
                <span>{reservation.email}</span>
              </a>
            )}
          </div>

          <a
            href={`https://wa.me/90${reservation.phone.replace(/[^0-9]/g, '').replace(/^0/, '')}?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp ile İletişime Geç</span>
          </a>
        </div>

        {/* Key Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          {/* Box 1: Time & Service */}
          <div className="p-4 rounded-2xl bg-meyhane-surface/80 border border-meyhane-border/70 space-y-2">
            <div className="text-[10px] uppercase font-semibold text-meyhane-muted flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gold" />
              Tarih ve Seans Bilgisi
            </div>
            <div className="text-base font-bold text-white font-serif">{reservation.date}</div>
            <div className="text-gray-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gold" />
              <span>Saat: {reservation.time}</span>
            </div>
            <div className="text-[11px] text-gold-300">{reservation.serviceType}</div>
          </div>

          {/* Box 2: Table & Seating */}
          <div className="p-4 rounded-2xl bg-meyhane-surface/80 border border-meyhane-border/70 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase font-semibold text-meyhane-muted flex items-center gap-1.5">
                <Wine className="w-3.5 h-3.5 text-gold" />
                Masa &amp; Salon Yerleşimi
              </div>
              <button
                type="button"
                onClick={() => setIsChangingTable(!isChangingTable)}
                className="text-[10px] text-gold hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Masayı Değiştir</span>
              </button>
            </div>

            {isChangingTable ? (
              <div className="space-y-2 pt-1">
                <select
                  value={selectedNewTable}
                  onChange={(e) => setSelectedNewTable(e.target.value)}
                  className="w-full bg-meyhane-bg border border-gold/60 p-2 rounded-xl text-white text-xs"
                >
                  {pool.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.number} ({t.capacity} Kişi - {t.sectionId})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyTableChange}
                    className="px-3 py-1 rounded bg-gold text-black font-bold text-[10px]"
                  >
                    Uygula
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingTable(false)}
                    className="text-[10px] text-gray-400"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm font-bold text-white font-serif">{formattedTable}</div>
                <div className="text-[11px] text-gold">{section?.name || reservation.sectionId}</div>
                <div className="text-gray-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-gold" />
                  <span>{reservation.guestCount} Kişilik Rezervasyon</span>
                </div>
              </>
            )}
          </div>

          {/* Box 3: Occasion & Menu */}
          <div className="p-4 rounded-2xl bg-meyhane-surface/80 border border-meyhane-border/70 space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase font-semibold text-meyhane-muted flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-gold" />
                Menü Paketi &amp; Kutlama Amacı
              </div>
              <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-gold font-medium border border-gold/30">
                {reservation.packageId === 'premium_fix' ? 'HayalMest Premium Rakı Menüsü' : reservation.packageId === 'standart_fix' ? 'Klasik Meyhane Fiks Menü' : 'A La Carte'}
              </span>
            </div>
            <div className="text-xs text-white font-medium flex items-center gap-1.5 pt-1">
              <PartyPopper className="w-4 h-4 text-gold" />
              <span>{reservation.occasion}</span>
            </div>
          </div>

        </div>

        {/* Special Requests / Notes */}
        {reservation.specialRequests && (
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-1.5 text-xs">
            <div className="text-amber-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Misafir Özel İstekleri &amp; Notları:</span>
            </div>
            <p className="text-amber-100/90 italic leading-relaxed text-xs">
              &ldquo;{reservation.specialRequests}&rdquo;
            </p>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="pt-2 border-t border-meyhane-border/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2">
            {reservation.status !== 'confirmed' && (
              <button
                onClick={() => onStatusChange(reservation.id, 'confirmed')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white font-semibold transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Onayla</span>
              </button>
            )}

            {reservation.status !== 'seated' && (
              <button
                onClick={() => onStatusChange(reservation.id, 'seated')}
                className="px-4 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white font-semibold transition-colors flex items-center gap-1.5"
              >
                <Utensils className="w-4 h-4" />
                <span>Masaya Oturt</span>
              </button>
            )}

            {reservation.status !== 'cancelled' && (
              <button
                onClick={() => onStatusChange(reservation.id, 'cancelled')}
                className="px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white font-medium transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>İptal Et</span>
              </button>
            )}
          </div>

          <button
            onClick={() => onDelete(reservation.id)}
            className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors flex items-center gap-1.5"
            title="Rezervasyonu Tamamen Sil"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Sil</span>
          </button>

        </div>

      </div>
    </div>
  );
}
