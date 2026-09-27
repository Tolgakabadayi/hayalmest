'use client';

import React, { useState } from 'react';
import { Music, Users, Sparkles, AlertCircle, Check, ArrowRight, X, DoorOpen, DoorClosed, CreditCard } from 'lucide-react';
import { ALL_TABLES, VENUE_SECTIONS, TableItem } from '@/data/tablesData';

interface SeatingFloorPlanProps {
  selectedTableId: string;
  onSelectTable: (tableId: string, sectionId: any) => void;
  guestCount: number;
  occupiedTableIds: string[];
}

export default function SeatingFloorPlan({
  selectedTableId,
  onSelectTable,
  guestCount,
  occupiedTableIds,
}: SeatingFloorPlanProps) {
  const [mergePrompt, setMergePrompt] = useState<{
    targetTable: TableItem;
    adjacentTable: TableItem;
  } | null>(null);

  const [suggestPrompt, setSuggestPrompt] = useState<{
    targetTable: TableItem;
    recommendedTable: TableItem;
  } | null>(null);

  const handleTableClick = (table: TableItem) => {
    const isOccupied = occupiedTableIds.includes(table.id);
    if (isOccupied) return;

    // Check if guest count exceeds single table capacity
    if (guestCount > table.capacity) {
      // 1. Check if an adjacent table is available to merge
      const availableAdjacent = table.adjacentWith
        .map(adjId => ALL_TABLES.find(t => t.id === adjId))
        .find(adj => adj && !occupiedTableIds.includes(adj.id));

      if (availableAdjacent) {
        setMergePrompt({ targetTable: table, adjacentTable: availableAdjacent });
        return;
      }

      // 2. If no adjacent table or cannot merge, suggest a larger table (e.g. Loca or Masa 18)
      const suitableTable = ALL_TABLES.find(
        t => t.capacity >= guestCount && !occupiedTableIds.includes(t.id)
      );

      if (suitableTable) {
        setSuggestPrompt({ targetTable: table, recommendedTable: suitableTable });
        return;
      }
    }

    onSelectTable(table.id, table.sectionId);
  };

  const confirmMerge = () => {
    if (!mergePrompt) return;
    const mergedId = `${mergePrompt.targetTable.id}+${mergePrompt.adjacentTable.id}`;
    onSelectTable(mergedId, mergePrompt.targetTable.sectionId);
    setMergePrompt(null);
  };

  const isSelected = (tableId: string) => {
    if (selectedTableId === tableId) return true;
    if (selectedTableId.includes('+')) {
      const parts = selectedTableId.split('+');
      return parts.includes(tableId);
    }
    return false;
  };

  return (
    <div className="space-y-6">
      
      {/* Legend / Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-2xl bg-meyhane-surface/90 border border-meyhane-border text-xs">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            <span className="text-gray-300">Müsait Masa</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gold shadow-sm shadow-gold/50"></span>
            <span className="text-white font-medium">Seçili Masa</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
            <span className="text-gray-400">Dolu Masa</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
            <span className="text-blue-300">Birleştirilmiş</span>
          </span>
        </div>

        <div className="text-[11px] text-meyhane-muted font-light">
          * Masaların üzerine tıklayarak doğrudan yerinizi seçebilirsiniz.
        </div>
      </div>

      {/* Interactive Floor Plan Map (Aircraft / Theatre visual style) */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#12161E] via-[#0E1116] to-[#0A0C0F] border border-meyhane-border/90 p-4 sm:p-8 shadow-2xl overflow-hidden min-h-[540px]">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370f_1px,transparent_1px),linear-gradient(to_bottom,#1f29370f_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* 1. SAHNE / FASIL ALANI (TOP) */}
        <div className="relative max-w-lg mx-auto mb-10 text-center">
          <div className="py-3 px-6 rounded-2xl bg-gradient-to-r from-gold/15 via-gold/30 to-gold/15 border-2 border-gold/60 text-gold shadow-[0_0_30px_rgba(212,175,55,0.25)] flex items-center justify-center gap-2">
            <Music className="w-5 h-5 text-gold animate-pulse" />
            <span className="text-sm font-bold font-serif uppercase tracking-[0.25em]">
              CANLI FASIL &amp; MÜZİK SAHNESİ
            </span>
          </div>
          <div className="text-[10px] text-gold-300/70 mt-1 uppercase tracking-widest font-mono">
            ♫ Akustik Canlı Performans Alanı ♫
          </div>
        </div>

        {/* 2. VIP SAHNE ÖNÜ MASALARI */}
        <div className="mb-10">
          <div className="text-center mb-3">
            <span className="text-[11px] text-gold font-semibold uppercase tracking-wider px-3 py-0.5 rounded-full bg-gold/10 border border-gold/30">
              VIP Sahne Önü Sırası
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {VENUE_SECTIONS[0].tables.map((tbl) => {
              const occupied = occupiedTableIds.includes(tbl.id);
              const selected = isSelected(tbl.id);
              const isMerged = selectedTableId.includes('+') && selectedTableId.includes(tbl.id);

              return (
                <button
                  key={tbl.id}
                  type="button"
                  disabled={occupied}
                  onClick={() => handleTableClick(tbl)}
                  className={`p-4 rounded-2xl border text-center transition-all duration-300 relative group ${
                    selected
                      ? isMerged
                        ? 'bg-blue-600 text-white border-blue-400 ring-4 ring-blue-500/30 shadow-xl scale-105'
                        : 'bg-gold text-black border-gold ring-4 ring-gold/30 shadow-xl scale-105'
                      : occupied
                      ? 'bg-red-950/20 border-red-900/40 text-gray-500 cursor-not-allowed opacity-60'
                      : 'bg-meyhane-surface/90 border-emerald-500/40 hover:border-gold hover:scale-105 text-white shadow-md'
                  }`}
                >
                  <div className="text-sm font-bold font-serif">{tbl.number}</div>
                  <div className="text-[10px] mt-1 opacity-80">{tbl.capacity} Kişilik</div>
                  <div className="text-[9px] uppercase tracking-wider font-semibold mt-1">
                    {selected ? (isMerged ? 'Birleşik' : 'Seçildi') : occupied ? 'Rezerve' : 'Müsait'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. ORTA SALON MASALARI & YAN BÖLGELER */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10 items-center">
          
          {/* Sol: Bar & İçecek Servisi */}
          <div className="md:col-span-2 p-4 rounded-2xl bg-meyhane-card/60 border border-meyhane-border/70 text-center space-y-1 hidden md:block">
            <div className="text-xs font-serif font-bold text-gray-300 uppercase tracking-wider">
              🍸 Kokteyl &amp; Rakı Barı
            </div>
            <div className="text-[10px] text-meyhane-muted">Hızlı Servis Hattı</div>
          </div>

          {/* Orta: Salon Masaları */}
          <div className="md:col-span-8 space-y-3">
            <div className="text-center">
              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                Orta Salon (Klasik Meyhane Masaları)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {VENUE_SECTIONS[1].tables.map((tbl) => {
                const occupied = occupiedTableIds.includes(tbl.id);
                const selected = isSelected(tbl.id);
                const isMerged = selectedTableId.includes('+') && selectedTableId.includes(tbl.id);

                return (
                  <button
                    key={tbl.id}
                    type="button"
                    disabled={occupied}
                    onClick={() => handleTableClick(tbl)}
                    className={`p-3.5 rounded-2xl border text-center transition-all duration-300 relative group ${
                      selected
                        ? isMerged
                          ? 'bg-blue-600 text-white border-blue-400 ring-4 ring-blue-500/30 shadow-xl scale-105'
                          : 'bg-gold text-black border-gold ring-4 ring-gold/30 shadow-xl scale-105'
                        : occupied
                        ? 'bg-red-950/20 border-red-900/40 text-gray-500 cursor-not-allowed opacity-60'
                        : 'bg-meyhane-surface/90 border-emerald-500/40 hover:border-gold hover:scale-105 text-white shadow-md'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold font-serif">{tbl.number}</div>
                    <div className="text-[10px] mt-0.5 opacity-80">{tbl.capacity} Kişilik</div>
                    <div className="text-[9px] uppercase tracking-wider font-semibold mt-0.5">
                      {selected ? (isMerged ? 'Birleşik' : 'Seçildi') : occupied ? 'Rezerve' : 'Müsait'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sağ: Şarap Kavı & Karşılama */}
          <div className="md:col-span-2 p-4 rounded-2xl bg-meyhane-card/60 border border-meyhane-border/70 text-center space-y-1 hidden md:block">
            <div className="text-xs font-serif font-bold text-gray-300 uppercase tracking-wider">
              🍷 Şarap Kavı &amp; Karşılama
            </div>
            <div className="text-[10px] text-meyhane-muted">Giriş Bölümü</div>
          </div>

        </div>

        {/* 4. ALT SIRALAR: ÖZEL LOCALAR & BAHÇE ALANI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-meyhane-border/70">
          
          {/* Özel Loca Grubu */}
          <div className="p-4 rounded-2xl bg-meyhane-card/40 border border-meyhane-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-serif text-white uppercase tracking-wider flex items-center gap-1.5">
                👑 Özel Kutlama Locaları
              </span>
              <span className="text-[10px] text-gold font-medium">Kutlama &amp; Büyük Grup</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {VENUE_SECTIONS[3].tables.map((tbl) => {
                const occupied = occupiedTableIds.includes(tbl.id);
                const selected = isSelected(tbl.id);

                return (
                  <button
                    key={tbl.id}
                    type="button"
                    disabled={occupied}
                    onClick={() => handleTableClick(tbl)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selected
                        ? 'bg-gold text-black border-gold ring-2 ring-gold/30 shadow-lg scale-105'
                        : occupied
                        ? 'bg-red-950/20 border-red-900/40 text-gray-500 cursor-not-allowed opacity-60'
                        : 'bg-meyhane-surface/90 border-emerald-500/40 hover:border-gold text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{tbl.number}</div>
                    <div className="text-[10px] opacity-80">{tbl.capacity} Kişi</div>
                    <div className="text-[9px] uppercase font-semibold mt-0.5">
                      {selected ? 'Seçildi' : occupied ? 'Rezerve' : 'Müsait'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bahçe & Teras Masaları */}
          <div className="p-4 rounded-2xl bg-meyhane-card/40 border border-meyhane-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-serif text-white uppercase tracking-wider flex items-center gap-1.5">
                🌿 Bahçe &amp; Teras Masaları
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Açık / Ferah Alan</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {VENUE_SECTIONS[2].tables.map((tbl) => {
                const occupied = occupiedTableIds.includes(tbl.id);
                const selected = isSelected(tbl.id);

                return (
                  <button
                    key={tbl.id}
                    type="button"
                    disabled={occupied}
                    onClick={() => handleTableClick(tbl)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      selected
                        ? 'bg-gold text-black border-gold ring-2 ring-gold/30 shadow-lg scale-105'
                        : occupied
                        ? 'bg-red-950/20 border-red-900/40 text-gray-500 cursor-not-allowed opacity-60'
                        : 'bg-meyhane-surface/90 border-emerald-500/40 hover:border-gold text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{tbl.number}</div>
                    <div className="text-[9px] opacity-80">{tbl.capacity} Kişi</div>
                    <div className="text-[8px] uppercase font-semibold mt-0.5">
                      {selected ? 'Seçildi' : occupied ? 'Dolu' : 'Müsait'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* 5. MİMARİ KROKİ ALT ŞERİDİ: GİRİŞ, WC, ÇIKIŞ, KASA */}
        <div className="pt-6 border-t border-meyhane-border/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-2 shadow-sm">
            <DoorOpen className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold">Ana Giriş Kapısı</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-300 flex items-center justify-center gap-2 shadow-sm">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold">Kasa &amp; Karşılama</span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center gap-2 shadow-sm">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold">Bay &amp; Bayan WC</span>
          </div>
          <div className="p-3 rounded-2xl bg-red-950/30 border border-red-500/40 text-red-300 flex items-center justify-center gap-2 shadow-sm">
            <DoorClosed className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold">Acil Çıkış Kapısı</span>
          </div>
        </div>

      </div>

      {/* SMART MERGE PROMPT MODAL */}
      {mergePrompt && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/80 to-meyhane-surface border-2 border-blue-500/60 shadow-2xl animate-fadeIn space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm font-serif">
              <Sparkles className="w-5 h-5" />
              <span>Akıllı Masa Birleştirme Talebi</span>
            </div>
            <button
              onClick={() => setMergePrompt(null)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-gray-200 leading-relaxed">
            Seçtiğiniz <strong className="text-white">{mergePrompt.targetTable.number}</strong> ({mergePrompt.targetTable.capacity} kişilik), <strong className="text-gold">{guestCount} kişilik</strong> grubunuz için küçük kalmaktadır. Yanındaki komşu <strong className="text-white">{mergePrompt.adjacentTable.number}</strong> ile birleştirilerek <strong className="text-emerald-400">{mergePrompt.targetTable.capacity + mergePrompt.adjacentTable.capacity} kişilik</strong> ortak masa oluşturulabilir.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={confirmMerge}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Masaları Birleştir ({mergePrompt.targetTable.number} + {mergePrompt.adjacentTable.number})</span>
            </button>

            <button
              type="button"
              onClick={() => setMergePrompt(null)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {/* SMART SUGGESTION MODAL (IF MERGE NOT POSSIBLE) */}
      {suggestPrompt && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/80 to-meyhane-surface border-2 border-gold/60 shadow-2xl animate-fadeIn space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-gold font-bold text-sm font-serif">
              <AlertCircle className="w-5 h-5" />
              <span>Masa Kapasite Önerisi</span>
            </div>
            <button
              onClick={() => setSuggestPrompt(null)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-gray-200 leading-relaxed">
            Seçtiğiniz <strong className="text-white">{suggestPrompt.targetTable.number}</strong> kapasitesi {suggestPrompt.targetTable.capacity} kişidir. Grubunuz ({guestCount} kişi) için en uygun olan <strong className="text-gold">{suggestPrompt.recommendedTable.number}</strong> ({suggestPrompt.recommendedTable.capacity} Kişilik) masaya geçmek ister misiniz?
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                onSelectTable(suggestPrompt.recommendedTable.id, suggestPrompt.recommendedTable.sectionId);
                setSuggestPrompt(null);
              }}
              className="px-5 py-2.5 rounded-xl bg-gold hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Önerilen Masayı Seç ({suggestPrompt.recommendedTable.number})</span>
            </button>

            <button
              type="button"
              onClick={() => setSuggestPrompt(null)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium"
            >
              Farklı Masa Bak
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
