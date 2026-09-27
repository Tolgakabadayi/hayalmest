'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Users, 
  Calendar, 
  Clock, 
  Phone, 
  MessageCircle, 
  CheckCircle, 
  MapPin, 
  Sparkles, 
  Utensils, 
  RefreshCw, 
  ShieldCheck, 
  Eye, 
  UserCheck, 
  ArrowRight,
  PartyPopper,
  X,
  Layers,
  ChevronRight,
  Wine,
  LogOut
} from 'lucide-react';
import { Reservation } from '@/lib/storage';
import { ALL_TABLES, VENUE_SECTIONS, TableItem } from '@/data/tablesData';
import { formatTableDisplay } from '@/lib/formatters';

export default function HostPanelPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [statusTab, setStatusTab] = useState<'all' | 'waiting' | 'seated'>('all');
  
  // Highlighted table modal for visual floor positioning
  const [highlightedTable, setHighlightedTable] = useState<{
    tableId: string;
    tableName: string;
    sectionId: string;
    guestName: string;
    guestCount: number;
    pnr: string;
  } | null>(null);

  // Table change state
  const [changingReservation, setChangingReservation] = useState<Reservation | null>(null);
  const [newTableSelection, setNewTableSelection] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reservations');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setReservations(json.data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('hayalmest_admin_token');
    if (!token) {
      router.push('/admin/login?redirect=/host');
      return;
    }
    setIsAuthenticated(true);
    fetchReservations();
  }, [router]);

  // Update status (e.g. seated)
  const handleMarkSeated = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'seated' ? 'confirmed' : 'seated';
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: nextStatus as any } : r));
      }
    } catch (err) {
      alert('Durum güncellenemedi');
    }
  };

  // Change table
  const handleConfirmTableChange = async () => {
    if (!changingReservation || !newTableSelection) return;
    try {
      const tableObj = ALL_TABLES.find(t => t.id === newTableSelection);
      const res = await fetch(`/api/reservations/${changingReservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableId: newTableSelection,
          sectionId: tableObj?.sectionId || changingReservation.sectionId
        }),
      });
      const json = await res.json();
      if (json.success) {
        setReservations(prev => prev.map(r => r.id === changingReservation.id ? { 
          ...r, 
          tableId: newTableSelection,
          sectionId: tableObj?.sectionId || r.sectionId
        } : r));
        setChangingReservation(null);
      }
    } catch (err) {
      alert('Masa değiştirilemedi');
    }
  };

  // Active filter date string
  const activeDate = 
    dateFilter === 'today' ? todayStr :
    dateFilter === 'tomorrow' ? tomorrowStr :
    dateFilter === 'custom' ? customDate : null;

  // Filtered reservations
  const filtered = reservations.filter(r => {
    // 1. Search term match (PNR, Phone, Name)
    const cleanSearch = searchTerm.trim().toLowerCase();
    const cleanPhone = r.phone.replace(/[^0-9]/g, '');
    const cleanPnr = r.pnr.toLowerCase();
    const cleanName = r.fullName.toLowerCase();

    const matchesSearch = !cleanSearch || 
      cleanPnr.includes(cleanSearch) || 
      cleanPhone.includes(cleanSearch) || 
      cleanName.includes(cleanSearch);

    // 2. Date match
    const matchesDate = !activeDate || r.date === activeDate;

    // 3. Status tab match
    const matchesStatus = 
      statusTab === 'all' ? r.status !== 'cancelled' :
      statusTab === 'waiting' ? (r.status === 'confirmed' || r.status === 'pending') :
      r.status === 'seated';

    return matchesSearch && matchesDate && matchesStatus;
  });

  // Today's summary stats
  const activeDateReservations = reservations.filter(r => (!activeDate || r.date === activeDate) && r.status !== 'cancelled');
  const seatedCount = activeDateReservations.filter(r => r.status === 'seated').length;
  const waitingCount = activeDateReservations.filter(r => r.status === 'confirmed' || r.status === 'pending').length;
  const totalGuests = activeDateReservations.reduce((acc, curr) => acc + curr.guestCount, 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-meyhane-bg flex items-center justify-center">
        <div className="text-center space-y-3 p-8 luxury-card rounded-3xl border border-gold/30">
          <ShieldCheck className="w-12 h-12 text-gold animate-pulse mx-auto" />
          <h2 className="text-lg font-bold font-serif text-white">Host Masası Güvenlik Kontrolü</h2>
          <p className="text-xs text-meyhane-muted">Yönetici yetkisi doğrulanıyor, lütfen bekleyin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-meyhane-bg text-white pb-16">
      
      {/* Top Banner / Navigation */}
      <div className="bg-[#12161E] border-b border-gold/30 sticky top-0 z-40 backdrop-blur-md shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/50 flex items-center justify-center text-gold shadow-md">
              <UserCheck className="w-5 h-5 text-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-serif uppercase tracking-wider text-white">
                  HayalMest Host &amp; Karşılama Masası
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                  GÜVENLİ OTURUM
                </span>
              </div>
              <p className="text-[11px] text-meyhane-muted">
                Kapı Karşılama, Masa Yerleşimi &amp; Anlık PNR/Telefon Doğrulama
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchReservations}
              className="p-2.5 rounded-xl bg-meyhane-surface border border-meyhane-border text-gray-300 hover:text-gold transition-colors"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-gold' : ''}`} />
            </button>
            <Link
              href="/admin"
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-meyhane-border text-xs font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-gold" />
              <span>Admin Paneli</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('hayalmest_admin_token');
                router.push('/admin/login?redirect=/host');
              }}
              className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-xs font-semibold text-red-200 transition-colors flex items-center gap-1.5"
              title="Oturumu Kapat"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* 1. FAST SEARCH BAR (HERO) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#171D27] via-[#121620] to-[#0E1218] border border-gold/40 shadow-2xl space-y-4">
          <div className="max-w-3xl space-y-2">
            <span className="text-xs uppercase font-semibold tracking-widest text-gold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              Hızlı Misafir Doğrulama &amp; Masa Bulucu
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white">
              Gelen Misafirin Masasını Anında Bulun
            </h1>
            <p className="text-xs sm:text-sm text-gray-300">
              Müşterinin size ilettiği <strong>PNR Takip Kodu</strong>nu, <strong>Telefon Numarası</strong>nı veya <strong>İsim/Soyisim</strong> bilgisini girin.
            </p>
          </div>

          <div className="relative max-w-3xl">
            <Search className="w-5 h-5 text-gold absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Örn: HM-9796 veya 0532 veya Ahmet Yılmaz..."
              className="w-full bg-black/60 border-2 border-gold/50 rounded-2xl pl-12 pr-12 py-4 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/20 shadow-inner transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Quick Date & Status Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-meyhane-border/70 text-xs">
            
            {/* Date Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDateFilter('today')}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                  dateFilter === 'today'
                    ? 'bg-gold text-black shadow-md'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                Bugün ({todayStr})
              </button>

              <button
                type="button"
                onClick={() => setDateFilter('tomorrow')}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                  dateFilter === 'tomorrow'
                    ? 'bg-gold text-black shadow-md'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                Yarın ({tomorrowStr})
              </button>

              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                  dateFilter === 'all'
                    ? 'bg-gold text-black shadow-md'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                Tüm Kayıtlar
              </button>

              <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-meyhane-border">
                <span className="text-[11px] text-meyhane-muted">Özel Tarih:</span>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setDateFilter('custom');
                  }}
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Status Queue Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-meyhane-border">
              <button
                type="button"
                onClick={() => setStatusTab('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusTab === 'all' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Tümü ({activeDateReservations.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('waiting')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  statusTab === 'waiting' ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40' : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Kapıda / Bekliyor ({waitingCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('seated')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  statusTab === 'seated' ? 'bg-blue-500/30 text-blue-200 border border-blue-500/40' : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>Masada ({seatedCount})</span>
              </button>
            </div>

          </div>
        </div>

        {/* 2. STATS OVERVIEW FOR SELECTED DATE */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-meyhane-surface border border-meyhane-border space-y-1">
            <span className="text-[11px] text-meyhane-muted uppercase tracking-wider block">Toplam Beklenen Misafir</span>
            <div className="text-2xl font-bold font-serif text-gold">{totalGuests} Kişi</div>
            <div className="text-[10px] text-gray-400">Bugünkü oturumlar toplamı</div>
          </div>
          <div className="p-4 rounded-2xl bg-meyhane-surface border border-meyhane-border space-y-1">
            <span className="text-[11px] text-meyhane-muted uppercase tracking-wider block">Kapıda / Karşılama Bekleyen</span>
            <div className="text-2xl font-bold font-serif text-amber-400">{waitingCount} Rezervasyon</div>
            <div className="text-[10px] text-gray-400">Masa ayrılmış, misafir bekleniyor</div>
          </div>
          <div className="p-4 rounded-2xl bg-meyhane-surface border border-meyhane-border space-y-1">
            <span className="text-[11px] text-meyhane-muted uppercase tracking-wider block">Masaya Oturanlar</span>
            <div className="text-2xl font-bold font-serif text-blue-400">{seatedCount} Masa</div>
            <div className="text-[10px] text-gray-400">Servis başladı</div>
          </div>
          <div className="p-4 rounded-2xl bg-meyhane-surface border border-meyhane-border space-y-1">
            <span className="text-[11px] text-meyhane-muted uppercase tracking-wider block">Görüntülenen Tarih</span>
            <div className="text-xl font-bold font-mono text-white">{activeDate || 'Tüm Tarihler'}</div>
            <div className="text-[10px] text-gray-400">Canlı takip modu</div>
          </div>
        </div>

        {/* 3. RESERVATIONS LIST / HOST CARDS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-serif text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-gold" />
              <span>Misafir Karşılama Listesi ({filtered.length})</span>
            </h2>
            {searchTerm && (
              <span className="text-xs text-gold">
                &ldquo;{searchTerm}&rdquo; için arama sonuçları gösteriliyor
              </span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="luxury-card p-12 rounded-3xl border border-meyhane-border text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-meyhane-border mx-auto flex items-center justify-center text-gray-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Eşleşen Rezervasyon Bulunamadı</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Aradığınız PNR kodu, telefon veya isimle kayıtlı rezervasyon bulunmuyor. Lütfen arama terimini veya tarih filtresini kontrol edin.
              </p>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 rounded-xl bg-gold/15 text-gold text-xs font-semibold hover:bg-gold hover:text-black transition-colors"
                >
                  Aramayı Temizle
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((res) => {
                const isSeated = res.status === 'seated';
                const formattedTable = formatTableDisplay(res.tableId, res.sectionId);
                const section = VENUE_SECTIONS.find(s => s.id === res.sectionId);

                return (
                  <div
                    key={res.id}
                    className={`luxury-card p-5 sm:p-6 rounded-3xl border transition-all space-y-4 shadow-xl relative overflow-hidden ${
                      isSeated 
                        ? 'border-blue-500/50 bg-[#0E1524]' 
                        : 'border-gold/40 bg-[#12161E] hover:border-gold'
                    }`}
                  >
                    {/* Status Top Ribbon */}
                    <div className="flex items-start justify-between gap-3 border-b border-meyhane-border/70 pb-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-bold text-gold tracking-wider">
                            #{res.pnr}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isSeated
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : res.status === 'confirmed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {isSeated ? 'Masada Oturuyor' : res.status === 'confirmed' ? 'Onaylı / Bekleniyor' : 'Teyit Bekliyor'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gold" />
                          <span>{res.date}</span>
                          <span>•</span>
                          <Clock className="w-3.5 h-3.5 text-gold" />
                          <span className="font-semibold text-white">{res.time}</span>
                        </div>
                      </div>

                      {/* Guest Count Badge */}
                      <div className="text-right">
                        <div className="text-xl font-bold font-serif text-white">
                          {res.guestCount} <span className="text-xs font-sans text-meyhane-muted font-normal">Kişi</span>
                        </div>
                        <span className="text-[10px] text-gray-400 block">{res.occasion}</span>
                      </div>
                    </div>

                    {/* BIG TABLE HIGHLIGHT BOX (THE STAR OF HOST PANEL) */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-black/80 via-meyhane-bg/90 to-black/80 border-2 border-gold/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-[10px] text-gold uppercase tracking-wider font-semibold">
                          AYRILAN MASA &amp; BÖLGE
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
                          {formattedTable}
                        </div>
                        <div className="text-xs text-gray-300 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                          <span>{section?.name || res.sectionId}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setHighlightedTable({
                            tableId: res.tableId,
                            tableName: formattedTable,
                            sectionId: res.sectionId,
                            guestName: res.fullName,
                            guestCount: res.guestCount,
                            pnr: res.pnr,
                          });
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gold/15 hover:bg-gold hover:text-black border border-gold/40 text-gold text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md self-start sm:self-center"
                        title="Salonda bu masanın yerini krokide göster"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Krokide Yeri Göster</span>
                      </button>
                    </div>

                    {/* Guest Contact Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-meyhane-muted block text-[11px]">Misafir Adı:</span>
                        <span className="font-bold text-white text-sm">{res.fullName}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-meyhane-muted block text-[11px]">Telefon:</span>
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${res.phone}`}
                            className="text-white hover:text-gold font-medium flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5 text-gold" />
                            <span>{res.phone}</span>
                          </a>
                          <a
                            href={`https://wa.me/90${res.phone.replace(/[^0-9]/g, '').replace(/^0/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Menu Package & Notes */}
                    <div className="pt-2 border-t border-meyhane-border/50 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-meyhane-muted">Seçilen Menü:</span>
                        <span className="text-gold font-semibold">
                          {res.packageId === 'premium_fix' ? 'HayalMest Gurme & Rakı Menüsü' : res.packageId === 'standart_fix' ? 'Klasik Meyhane Fiks' : 'A La Carte'}
                        </span>
                      </div>
                      {res.specialRequests && (
                        <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-200 italic">
                          &ldquo;{res.specialRequests}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* HOST ACTION BUTTONS */}
                    <div className="pt-2 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleMarkSeated(res.id, res.status)}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                          isSeated
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{isSeated ? 'Masadan Kalktı / Geri Al' : '✓ Misafiri Masaya Oturt'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setChangingReservation(res);
                          setNewTableSelection(res.tableId);
                        }}
                        className="px-3.5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-meyhane-border text-xs font-semibold"
                        title="Masa Değiştir"
                      >
                        Masa Değiştir
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* 4. VISUAL FLOOR POSITION POPUP MODAL */}
      {highlightedTable && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn">
          <div className="luxury-card max-w-2xl w-full rounded-3xl p-6 sm:p-8 border border-gold/50 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-meyhane-border/70 pb-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-gold font-semibold">
                  Masa Konum Haritası
                </div>
                <h3 className="text-2xl font-bold font-serif text-white">
                  {highlightedTable.tableName}
                </h3>
                <p className="text-xs text-gray-300">
                  {highlightedTable.guestName} ({highlightedTable.guestCount} Misafir) • #{highlightedTable.pnr}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHighlightedTable(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Floor Layout Diagram highlighting this specific table */}
            <div className="relative rounded-3xl bg-gradient-to-b from-[#12161E] to-[#0A0C0F] border border-meyhane-border p-6 shadow-2xl space-y-6">
              
              {/* Stage at the top */}
              <div className="py-2.5 px-4 rounded-xl bg-gold/20 border border-gold/50 text-gold text-center text-xs font-bold font-serif uppercase tracking-widest max-w-md mx-auto">
                CANLI FASIL SAHNESİ
              </div>

              {/* Sections & Tables */}
              <div className="space-y-4">
                {VENUE_SECTIONS.map((sec) => (
                  <div key={sec.id} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                      <span>{sec.name}</span>
                      <span className="text-[10px] text-meyhane-muted">{sec.badge}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {sec.tables.map((tbl) => {
                        const isThisTable = 
                          highlightedTable.tableId === tbl.id || 
                          highlightedTable.tableId.includes(tbl.id);

                        return (
                          <div
                            key={tbl.id}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              isThisTable
                                ? 'bg-gold text-black border-gold ring-4 ring-gold/40 shadow-2xl scale-105 font-bold animate-pulse'
                                : 'bg-meyhane-surface/60 border-meyhane-border text-gray-400 opacity-60'
                            }`}
                          >
                            <div className="text-xs font-serif font-bold">{tbl.number}</div>
                            <div className="text-[10px]">{tbl.capacity} Kişilik</div>
                            {isThisTable && (
                              <div className="text-[9px] uppercase tracking-wider font-extrabold mt-0.5 text-black">
                                ★ BURAYA OTURUYOR ★
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Entrance at the bottom */}
              <div className="text-center pt-2">
                <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-400">
                  ↓ Kapı Girişi &amp; Karşılama Masası
                </span>
              </div>

            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setHighlightedTable(null)}
                className="px-6 py-2.5 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110"
              >
                Anladım / Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. TABLE SWITCH MODAL */}
      {changingReservation && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn">
          <div className="luxury-card max-w-md w-full rounded-3xl p-6 border border-gold/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-meyhane-border pb-3">
              <h3 className="text-base font-bold font-serif text-white">Masa Değiştir</h3>
              <button onClick={() => setChangingReservation(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-gray-300">
              <strong>{changingReservation.fullName}</strong> ({changingReservation.guestCount} Kişi) için yeni bir masa seçin:
            </p>

            <div className="space-y-1">
              <label className="text-[11px] text-gray-400">Yeni Masa:</label>
              <select
                value={newTableSelection}
                onChange={(e) => setNewTableSelection(e.target.value)}
                className="w-full bg-meyhane-surface border border-meyhane-border p-2.5 rounded-xl text-xs text-white focus:border-gold focus:outline-none cursor-pointer"
              >
                {ALL_TABLES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.number} ({t.capacity} Kişilik - {t.sectionId})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setChangingReservation(null)}
                className="px-4 py-2 rounded-xl bg-white/5 text-xs text-gray-300"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmTableChange}
                className="px-5 py-2 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider"
              >
                Masa Değişikliğini Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
