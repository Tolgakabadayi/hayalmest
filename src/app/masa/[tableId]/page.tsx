'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Bell, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Wine, 
  Utensils, 
  CreditCard, 
  Banknote, 
  Search, 
  X, 
  ChevronRight, 
  Music,
  MapPin,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { MENU_ITEMS, MENU_CATEGORIES, MenuItem } from '@/data/menuData';
import { ALL_TABLES, VENUE_SECTIONS } from '@/data/tablesData';
import { STAGE_EVENTS } from '@/data/eventsData';
import { formatTableDisplay, setRegisteredTables } from '@/lib/formatters';

interface ServiceCallStatus {
  id: string;
  type: string;
  title: string;
  note?: string;
  createdAt: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export default function TableQrMenuPage({ params }: { params: { tableId: string } }) {
  const rawTableId = decodeURIComponent(params.tableId || '');
  
  // Table info state
  const [tableName, setTableName] = useState<string>(rawTableId);
  const [sectionName, setSectionName] = useState<string>('HayalMest Ana Salon');
  const [tableCapacity, setTableCapacity] = useState<number | null>(null);

  // Active service calls from this table
  const [myCalls, setMyCalls] = useState<ServiceCallStatus[]>([]);
  const [isCalling, setIsCalling] = useState(false);
  const [callFeedback, setCallFeedback] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Bill request modal
  const [showBillModal, setShowBillModal] = useState(false);
  const [billPaymentMethod, setBillPaymentMethod] = useState<'card' | 'cash' | 'split'>('card');
  const [billNote, setBillNote] = useState('');

  // Menu filtering & search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  // Tonight's event
  const tonightEvent = STAGE_EVENTS[0] || null;

  // Resolve table information
  useEffect(() => {
    // 1. Try finding in ALL_TABLES
    const found = ALL_TABLES.find(t => 
      t.id.toLowerCase() === rawTableId.toLowerCase() ||
      t.number.toLowerCase() === rawTableId.toLowerCase() ||
      t.number.replace(/\s+/g, '').toLowerCase() === rawTableId.replace(/\s+/g, '').toLowerCase()
    );

    if (found) {
      setTableName(found.number);
      setTableCapacity(found.capacity);
      const sec = VENUE_SECTIONS.find(s => s.id === found.sectionId);
      if (sec) setSectionName(sec.name);
    } else {
      // Format as readable name
      setTableName(rawTableId.startsWith('t-') ? rawTableId.replace('t-', 'Masa ') : rawTableId);
    }

    // Also fetch dynamic tables from API if available
    fetch('/api/tables')
      .then(res => res.json())
      .then(data => {
        if (data?.tables?.length) {
          setRegisteredTables(data.tables);
          const dynFound = data.tables.find((t: any) => 
            t.id.toLowerCase() === rawTableId.toLowerCase() ||
            t.number.toLowerCase() === rawTableId.toLowerCase() ||
            t.number.replace(/\s+/g, '').toLowerCase() === rawTableId.replace(/\s+/g, '').toLowerCase()
          );
          if (dynFound) {
            setTableName(dynFound.number);
            setTableCapacity(dynFound.capacity);
            const sec = VENUE_SECTIONS.find(s => s.id === dynFound.sectionId);
            if (sec) setSectionName(sec.name);
          }
        }
      })
      .catch(() => {});
  }, [rawTableId]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Send a service request
  const handleCallService = async (type: 'waiter' | 'ice_water' | 'bill' | 'cutlery', note?: string) => {
    if (cooldown > 0) return;

    setIsCalling(true);
    try {
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: rawTableId,
          tableName,
          sectionName,
          type,
          note: note || '',
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setMyCalls(prev => [json.data, ...prev]);
        setCooldown(45); // 45s cooldown
        setShowBillModal(false);

        const titles: Record<string, string> = {
          waiter: 'Garson çağrınız salon ekibimize iletildi!',
          ice_water: 'Buz & Soğuk Su talebiniz iletildi!',
          bill: 'Hesap isteğiniz kasaya iletildi!',
          cutlery: 'Servis / Çatal-Bıçak talebiniz iletildi!',
        };

        setCallFeedback(titles[type] || 'Talebiniz iletildi!');
        setTimeout(() => setCallFeedback(null), 5000);
      } else {
        alert('Talebiniz iletilemedi, lütfen garsonumuza sesleniniz.');
      }
    } catch (err) {
      console.error('Call error:', err);
      alert('Bağlantı hatası oluştu.');
    } finally {
      setIsCalling(false);
    }
  };

  // Filtered menu items
  const filteredItems = MENU_ITEMS.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-meyhane-bg text-gray-100 pb-28 selection:bg-gold selection:text-black">
      
      {/* 1. MASA TANITIM VE HEADER */}
      <header className="sticky top-0 z-40 bg-[#121620]/95 backdrop-blur-xl border-b border-gold/30 shadow-2xl">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/50 flex items-center justify-center text-gold shadow-md">
              <Wine className="w-5 h-5 text-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-serif text-white tracking-wide">
                  HayalMest
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gold/20 border border-gold/50 text-gold text-[10px] font-bold">
                  {tableName}
                </span>
              </div>
              <p className="text-[11px] text-meyhane-muted line-clamp-1">
                {sectionName} {tableCapacity ? `· ${tableCapacity} Kişilik` : ''}
              </p>
            </div>
          </div>

          <Link
            href="/rezervasyon"
            className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-meyhane-border transition-colors"
          >
            Yeniden Ayırt
          </Link>
        </div>
      </header>

      {/* 2. CANLI GERİ BİLDİRİM BANNER'I */}
      {callFeedback && (
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 border-b border-emerald-500/50 text-white px-4 py-3 text-center text-xs font-semibold animate-fadeIn flex items-center justify-center gap-2 shadow-lg">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-bounce" />
          <span>{callFeedback} Servis görevlimiz masanıza yönlendirildi.</span>
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-5">
        
        {/* 3. MASAYA ÖZEL HIZLI ÇAĞRI KONTROL MERKEZİ */}
        <div className="luxury-card rounded-3xl p-4 sm:p-5 border border-gold/40 shadow-xl space-y-3 bg-[#151924]/95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gold" />
              <span className="text-xs uppercase tracking-wider text-gold font-bold font-serif">
                Masa Servis &amp; Çağrı Butonları
              </span>
            </div>
            {cooldown > 0 && (
              <span className="text-[11px] text-amber-400 font-mono font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {cooldown}s bekleyin
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Masanızdan anında servis görevlisi çağırabilir, buz/su isteyebilir veya hesap talep edebilirsiniz.
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* 1. Garson Çağır */}
            <button
              type="button"
              disabled={isCalling || cooldown > 0}
              onClick={() => handleCallService('waiter')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                cooldown > 0
                  ? 'bg-white/5 border-meyhane-border text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-br from-gold/25 to-gold/5 border-gold/60 text-white hover:brightness-110 active:scale-95 shadow-md shadow-gold/20'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-gold text-black flex items-center justify-center shadow-md">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Garson Çağır</div>
                <div className="text-[10px] text-gold/80">Masaya servis görevlisi</div>
              </div>
            </button>

            {/* 2. Buz & Su İste */}
            <button
              type="button"
              disabled={isCalling || cooldown > 0}
              onClick={() => handleCallService('ice_water')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                cooldown > 0
                  ? 'bg-white/5 border-meyhane-border text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-br from-cyan-950/40 to-cyan-900/10 border-cyan-500/40 text-white hover:border-cyan-400 active:scale-95 shadow-md'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shadow-md">
                <span className="text-sm">🧊</span>
              </div>
              <div>
                <div className="text-xs font-bold text-white">Buz &amp; Su İste</div>
                <div className="text-[10px] text-cyan-300">Buz kovası &amp; soğuk su</div>
              </div>
            </button>

            {/* 3. Hesap İste */}
            <button
              type="button"
              disabled={isCalling || cooldown > 0}
              onClick={() => setShowBillModal(true)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                cooldown > 0
                  ? 'bg-white/5 border-meyhane-border text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-br from-emerald-950/40 to-emerald-900/10 border-emerald-500/40 text-white hover:border-emerald-400 active:scale-95 shadow-md'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-md">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Hesap İste</div>
                <div className="text-[10px] text-emerald-300">Nakit / Kart / Adisyon</div>
              </div>
            </button>

            {/* 4. Servis & Çatal Bıçak */}
            <button
              type="button"
              disabled={isCalling || cooldown > 0}
              onClick={() => handleCallService('cutlery')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                cooldown > 0
                  ? 'bg-white/5 border-meyhane-border text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-br from-purple-950/40 to-purple-900/10 border-purple-500/40 text-white hover:border-purple-400 active:scale-95 shadow-md'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center shadow-md">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Çatal / Tabak</div>
                <div className="text-[10px] text-purple-300">Temiz servis &amp; tabak</div>
              </div>
            </button>
          </div>

          {/* Son Gönderilen Çağrılar */}
          {myCalls.length > 0 && (
            <div className="pt-2 border-t border-meyhane-border/70 space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-meyhane-muted font-bold block">
                Son Çağrılarınız
              </span>
              <div className="space-y-1.5 max-h-24 overflow-y-auto scrollbar-none">
                {myCalls.slice(0, 3).map((call) => (
                  <div 
                    key={call.id}
                    className="p-2 rounded-xl bg-black/40 border border-meyhane-border text-[11px] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span className="text-white font-medium">{call.title}</span>
                      {call.note && <span className="text-gray-400">({call.note})</span>}
                    </div>
                    <span className="text-[10px] text-gold font-mono">İletildi</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. BU AKŞAMIN CANLI SAHNE PROGRAMI */}
        {tonightEvent && (
          <div className="luxury-card rounded-2xl p-4 border border-gold/30 bg-gradient-to-r from-gold/15 via-[#181D2A] to-[#121620] flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/50 flex items-center justify-center text-gold">
                <Music className="w-5 h-5 text-gold animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gold font-bold">
                  Bu Akşam Canlı Fasıl
                </span>
                <div className="text-sm font-bold font-serif text-white">{tonightEvent.title}</div>
                <div className="text-[11px] text-gray-300">{tonightEvent.performer} · Saat: {tonightEvent.time}</div>
              </div>
            </div>
          </div>
        )}

        {/* 5. ARAMA VE KATEGORİ FİLTRELERİ */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Meze, kebap, rakı veya şarap ara..."
              className="w-full bg-[#151924] border border-meyhane-border pl-10 pr-4 py-2.5 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Kategori Kaydırma Çubuğu */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-gold text-black shadow-md font-bold'
                  : 'bg-white/5 border border-meyhane-border text-gray-300 hover:text-white'
              }`}
            >
              Tüm Menü ({MENU_ITEMS.length})
            </button>
            {MENU_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-gold text-black shadow-md font-bold'
                    : 'bg-white/5 border border-meyhane-border text-gray-300 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6. MENÜ LİSTESİ */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-meyhane-muted px-1">
            <span>Listelenen Lezzetler: <strong className="text-white">{filteredItems.length}</strong></span>
            <span>Masaya Servis Edilir</span>
          </div>

          <div className="space-y-2">
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedMenuItem(item)}
                className="p-3 rounded-2xl bg-[#141822]/90 hover:bg-[#181D2A] border border-meyhane-border/70 hover:border-gold/40 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.image ? (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-meyhane-border">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white/5 border border-meyhane-border flex items-center justify-center text-gold/70 flex-shrink-0">
                      <Utensils className="w-6 h-6" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white group-hover:text-gold transition-colors truncate">
                        {item.name}
                      </h4>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded-md bg-gold/15 text-gold text-[9px] font-bold border border-gold/40 flex-shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5 font-light">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold font-mono text-gold">
                    ₺{item.price.toLocaleString('tr-TR')}
                  </div>
                  {item.unit && (
                    <div className="text-[9px] text-meyhane-muted">{item.unit}</div>
                  )}
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="p-8 text-center luxury-card rounded-3xl border border-meyhane-border space-y-2">
                <AlertCircle className="w-8 h-8 text-gold/60 mx-auto" />
                <div className="text-xs font-semibold text-white">Aradığınız lezzet bulunamadı</div>
                <p className="text-[11px] text-gray-400">Lütfen farklı bir kelime deneyin veya filtreyi sıfırlayın.</p>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* 7. HESAP İSTE MODALI */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn">
          <div className="luxury-card max-w-sm w-full rounded-3xl p-5 border border-gold/40 shadow-2xl space-y-4 bg-[#141824]">
            <div className="flex items-center justify-between border-b border-meyhane-border/70 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gold" />
                <span className="text-sm font-bold font-serif text-white">
                  Masa {tableName} - Hesap Talebi
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowBillModal(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Nasıl ödemek istersiniz? Tercihinizi seçtiğinizde servis görevlimiz adisyon ve pos cihazı ile masanıza gelecektir.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBillPaymentMethod('card')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  billPaymentMethod === 'card'
                    ? 'bg-gold text-black border-gold font-bold shadow-md'
                    : 'bg-white/5 border-meyhane-border text-gray-300'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-[11px]">Kredi Kartı</span>
              </button>

              <button
                type="button"
                onClick={() => setBillPaymentMethod('cash')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  billPaymentMethod === 'cash'
                    ? 'bg-gold text-black border-gold font-bold shadow-md'
                    : 'bg-white/5 border-meyhane-border text-gray-300'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span className="text-[11px]">Nakit</span>
              </button>

              <button
                type="button"
                onClick={() => setBillPaymentMethod('split')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  billPaymentMethod === 'split'
                    ? 'bg-gold text-black border-gold font-bold shadow-md'
                    : 'bg-white/5 border-meyhane-border text-gray-300'
                }`}
              >
                <span className="text-sm font-bold">½</span>
                <span className="text-[11px]">Ayrı Ayrı</span>
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-meyhane-muted">Özel Notunuz (Varsa):</label>
              <input
                type="text"
                value={billNote}
                onChange={(e) => setBillNote(e.target.value)}
                placeholder="Örn: Yemek kartı / Şirket faturası..."
                className="w-full bg-[#10141D] border border-meyhane-border p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-gold"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowBillModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 border border-meyhane-border transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  const methodText = 
                    billPaymentMethod === 'card' ? 'Kredi Kartı ile Ödeme' :
                    billPaymentMethod === 'cash' ? 'Nakit Ödeme' : 'Ayrı Ayrı Ödeme';
                  const fullNote = billNote ? `${methodText} - ${billNote}` : methodText;
                  handleCallService('bill', fullNote);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gold hover:brightness-110 text-black text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-gold/20"
              >
                Hesap İste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. YEMEK DETAY MODALI */}
      {selectedMenuItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn">
          <div className="luxury-card max-w-sm w-full rounded-3xl overflow-hidden border border-gold/40 shadow-2xl bg-[#141824] space-y-0 relative">
            {selectedMenuItem.image ? (
              <div className="relative h-48 w-full">
                <Image
                  src={selectedMenuItem.image}
                  alt={selectedMenuItem.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141824] via-transparent to-black/40" />
                <button
                  type="button"
                  onClick={() => setSelectedMenuItem(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedMenuItem(null)}
                  className="p-1.5 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold font-serif text-white">{selectedMenuItem.name}</h3>
                  {selectedMenuItem.badge && (
                    <span className="px-2 py-0.5 rounded-md bg-gold/15 text-gold text-[10px] font-bold border border-gold/40 mt-1 inline-block">
                      {selectedMenuItem.badge}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-gold">
                    ₺{selectedMenuItem.price.toLocaleString('tr-TR')}
                  </div>
                </div>
              </div>

              {selectedMenuItem.description && (
                <p className="text-xs text-gray-300 leading-relaxed font-light">
                  {selectedMenuItem.description}
                </p>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMenuItem(null);
                    handleCallService('waiter', `${selectedMenuItem.name} siparişi vermek istiyoruz`);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gold hover:brightness-110 text-black text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-gold/20"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Bu Lezzet İçin Garson Çağır</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
