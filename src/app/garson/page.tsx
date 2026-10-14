'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Utensils, 
  Bell, 
  Clock, 
  CheckCircle, 
  Wine, 
  CreditCard, 
  Search, 
  Volume2, 
  VolumeX, 
  LogOut, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  Flame, 
  ChevronRight,
  Filter,
  Check,
  Package,
  Layers
} from 'lucide-react';
import { ServiceRequest } from '@/lib/serviceRequestsStorage';
import { playNotificationChime } from '@/lib/audioNotification';

export default function WaiterPanelPage() {
  const router = useRouter();

  const [waiterName, setWaiterName] = useState('Garson');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('pending');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const prevPendingIds = useRef<Set<string>>(new Set());
  const initialFetchDone = useRef(false);

  // 1. Auth check
  useEffect(() => {
    const token = localStorage.getItem('hayalmest_waiter_token');
    const name = localStorage.getItem('hayalmest_waiter_name');
    if (!token) {
      router.push('/garson/login');
    } else {
      if (name) setWaiterName(name);
      setIsAuthenticated(true);
    }
  }, [router]);

  // 2. Fetch requests
  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch('/api/service-requests');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const data: ServiceRequest[] = json.data;
        setRequests(data);

        // Sound alert for new pending requests
        const currentPendingIds = new Set(data.filter(r => r.status === 'pending').map(r => r.id));
        if (initialFetchDone.current && soundEnabled) {
          const hasNew = Array.from(currentPendingIds).some(id => !prevPendingIds.current.has(id));
          if (hasNew) {
            playNotificationChime();
          }
        }
        prevPendingIds.current = currentPendingIds;
        initialFetchDone.current = true;
      }
    } catch (err) {
      console.error('Garson paneli talepleri getiremedi:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [soundEnabled]);

  // 3. Polling every 3.5s
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchRequests(false);
    const interval = setInterval(() => {
      fetchRequests(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchRequests]);

  // 4. Update request status
  const handleUpdateStatus = async (id: string, newStatus: 'in_progress' | 'completed') => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/service-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          completedBy: waiterName,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRequests(prev => prev.map(r => r.id === id ? { 
          ...r, 
          status: newStatus,
          completedBy: waiterName,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : r.completedAt
        } : r));
      }
    } catch (err) {
      alert('İşlem güncellenemedi');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLogout = () => {
    if (confirm('Garson oturumunu kapatmak istediğinize emin misiniz?')) {
      localStorage.removeItem('hayalmest_waiter_token');
      localStorage.removeItem('hayalmest_waiter_name');
      router.push('/garson/login');
    }
  };

  // Filtering
  const filteredRequests = requests.filter(req => {
    // Status filter
    if (selectedStatus !== 'all' && req.status !== selectedStatus) return false;

    // Type filter
    if (selectedType !== 'all' && req.type !== selectedType) return false;

    // Section filter
    if (selectedSection !== 'all') {
      const sec = req.sectionId || '';
      if (!sec.toLowerCase().includes(selectedSection.toLowerCase())) return false;
    }

    // Search query (table name, note, or item name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTable = req.tableName.toLowerCase().includes(q) || req.tableId.toLowerCase().includes(q);
      const matchTitle = req.title.toLowerCase().includes(q);
      const matchNote = (req.note || '').toLowerCase().includes(q);
      const matchItems = req.items?.some(i => i.name.toLowerCase().includes(q));
      if (!matchTable && !matchTitle && !matchNote && !matchItems) return false;
    }

    return true;
  });

  // Counters
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const inProgressCount = requests.filter(r => r.status === 'in_progress').length;
  const ordersCount = requests.filter(r => r.type === 'order' && r.status !== 'completed').length;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-meyhane-bg text-white pb-16">
      
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 bg-meyhane-surface/95 backdrop-blur-md border-b border-meyhane-border shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          {/* Waiter Brand & User */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-white text-sm sm:text-base">
                  HayalMest Servis
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  Canlı
                </span>
              </div>
              <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <span>{waiterName}</span>
                <span>•</span>
                <span className="text-gold font-mono">{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Sound Control */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nextState = !soundEnabled;
                setSoundEnabled(nextState);
                if (nextState) playNotificationChime();
              }}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                soundEnabled
                  ? 'bg-gold/15 text-gold border-gold/40 hover:bg-gold/25'
                  : 'bg-white/5 text-gray-400 border-white/10'
              }`}
              title={soundEnabled ? 'Sesli Uyarı Açık' : 'Sesli Uyarı Kapalı'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-gold" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Ses Açık' : 'Sessiz'}</span>
            </button>

            <button
              type="button"
              onClick={() => fetchRequests(false)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-colors"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-gold' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-red-950/30 hover:bg-red-950/50 border border-red-500/30 text-red-300 transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Quick Summary Pill Bar */}
        <div className="max-w-6xl mx-auto px-4 pb-2.5 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span>Bekleyen Çağrı:</span>
            <strong className="font-mono font-bold text-white">{pendingCount}</strong>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Hazırlanan:</span>
            <strong className="font-mono font-bold text-white">{inProgressCount}</strong>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gold/10 border border-gold/30 text-gold flex-shrink-0">
            <Flame className="w-3.5 h-3.5 text-gold" />
            <span>Aktif Menü Siparişi:</span>
            <strong className="font-mono font-bold text-white">{ordersCount}</strong>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">

        {/* 2.1 FILTERS & SEARCH */}
        <div className="space-y-2.5">
          
          {/* Status Tabs */}
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-meyhane-surface border border-meyhane-border text-xs">
            <button
              type="button"
              onClick={() => setSelectedStatus('pending')}
              className={`py-2 px-1 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 ${
                selectedStatus === 'pending'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Bekleyen</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-white text-[10px] font-mono">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus('in_progress')}
              className={`py-2 px-1 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 ${
                selectedStatus === 'in_progress'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>İşlemde</span>
              {inProgressCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-black text-[10px] font-mono">
                  {inProgressCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus('completed')}
              className={`py-2 px-1 rounded-xl font-semibold transition-all ${
                selectedStatus === 'completed'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Tamamlanan
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus('all')}
              className={`py-2 px-1 rounded-xl font-semibold transition-all ${
                selectedStatus === 'all'
                  ? 'bg-gold text-black shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Tümü ({requests.length})
            </button>
          </div>

          {/* Type Filters & Search Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Masa no, sipariş içeriği veya not ara..."
                className="w-full bg-meyhane-surface border border-meyhane-border pl-10 pr-4 py-2 rounded-xl text-white text-xs focus:border-gold focus:outline-none placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Request Type Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'Hepsi' },
                { id: 'order', label: '🍲 Sipariş' },
                { id: 'waiter', label: '🔔 Garson' },
                { id: 'bill', label: '💳 Hesap' },
                { id: 'ice_water', label: '🧊 Buz/Su' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedType(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedType === tab.id
                      ? 'bg-gold text-black font-bold'
                      : 'bg-meyhane-surface hover:bg-white/10 text-gray-300 border border-meyhane-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          </div>

        </div>

        {/* 2.2 REQUESTS LIST */}
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <RefreshCw className="w-8 h-8 text-gold animate-spin mx-auto" />
            <p className="text-xs text-gray-400 font-serif">Masa talepleri yükleniyor...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="luxury-card rounded-3xl p-10 text-center border border-meyhane-border/70 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-gray-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-base font-serif font-bold text-white">
              {selectedStatus === 'pending' ? 'Bekleyen Talep Yok' : 'Eşleşen Talep Bulunamadı'}
            </h3>
            <p className="text-xs text-meyhane-muted max-w-sm mx-auto">
              {selectedStatus === 'pending'
                ? 'Tüm masaların istekleri karşılandı. Yeni bir çağrı veya sipariş geldiğinde zil çalacak.'
                : 'Filtreleri değiştirerek diğer çağrıları inceleyebilirsiniz.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredRequests.map((req) => {
              const isPending = req.status === 'pending';
              const isInProgress = req.status === 'in_progress';
              const isCompleted = req.status === 'completed';
              const isOrder = req.type === 'order';
              const isBill = req.type === 'bill';

              const createdTime = new Date(req.createdAt);
              const elapsedMinutes = Math.floor((Date.now() - createdTime.getTime()) / 60000);
              const isUrgent = isPending && elapsedMinutes >= 4;

              return (
                <div
                  key={req.id}
                  className={`rounded-2xl p-4 sm:p-5 border transition-all relative flex flex-col justify-between shadow-xl ${
                    isUrgent
                      ? 'bg-red-950/30 border-red-500/80 shadow-red-900/20 ring-1 ring-red-500/50 animate-pulse'
                      : isPending
                      ? isOrder
                        ? 'bg-gradient-to-br from-meyhane-surface via-[#1D1714] to-meyhane-surface border-amber-500/60 shadow-amber-950/20'
                        : 'bg-meyhane-surface border-gold/40'
                      : isInProgress
                      ? 'bg-[#181B24] border-amber-500/40'
                      : 'bg-meyhane-bg/80 border-meyhane-border/50 opacity-70'
                  }`}
                >
                  
                  {/* Top Bar: Table Name & Timing */}
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3 mb-3">
                      
                      {/* Table Pill */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
                            {req.tableName}
                          </span>
                          {req.sectionName && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                              {req.sectionName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                          <Clock className="w-3.5 h-3.5 text-gold" />
                          <span>
                            {createdTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>•</span>
                          <span className={isUrgent ? 'text-red-400 font-bold' : 'text-gray-300'}>
                            {elapsedMinutes === 0 ? 'Az önce' : `${elapsedMinutes} dk önce`}
                          </span>
                        </div>
                      </div>

                      {/* Request Type Badge */}
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
                            isOrder
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                              : isBill
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                              : 'bg-gold/20 text-gold border border-gold/50'
                          }`}
                        >
                          {isOrder && <Flame className="w-3.5 h-3.5" />}
                          {isBill && <CreditCard className="w-3.5 h-3.5" />}
                          {!isOrder && !isBill && <Bell className="w-3.5 h-3.5" />}
                          <span>{req.title}</span>
                        </span>

                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider ${
                            isPending
                              ? 'text-red-400'
                              : isInProgress
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {isPending ? '● Bekliyor' : isInProgress ? '⏳ İşlemde' : '✓ Servis Edildi'}
                        </span>
                      </div>

                    </div>

                    {/* Middle Section: Items or Special Note */}
                    <div className="space-y-3 pb-3">
                      
                      {/* If Order: List of items */}
                      {isOrder && req.items && req.items.length > 0 && (
                        <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30 space-y-2">
                          <div className="text-[11px] uppercase tracking-wider text-amber-400 font-bold flex items-center justify-between border-b border-white/10 pb-1.5">
                            <span>Sipariş Edilen Ürünler ({req.items.length})</span>
                            {req.totalAmount && (
                              <span className="font-mono text-white text-xs">
                                Toplam: {req.totalAmount.toLocaleString('tr-TR')} ₺
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1.5">
                            {req.items.map((it, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs text-gray-200"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold flex items-center justify-center">
                                    {it.quantity}x
                                  </span>
                                  <span className="font-medium text-white">{it.name}</span>
                                </div>
                                {it.price && (
                                  <span className="text-[11px] font-mono text-gray-400">
                                    {(it.price * it.quantity).toLocaleString('tr-TR')} ₺
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Guest Note */}
                      {req.note && (
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                          <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                            Misafir Notu:
                          </span>
                          <span className="text-amber-200 font-medium">
                            "{req.note}"
                          </span>
                        </div>
                      )}

                      {/* Completed Details */}
                      {isCompleted && (
                        <div className="text-[11px] text-gray-400 pt-1 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            {req.completedBy || 'Garson'} tarafından tamamlandı ({req.completedAt ? new Date(req.completedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''})
                          </span>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          disabled={actionLoadingId === req.id}
                          onClick={() => handleUpdateStatus(req.id, 'in_progress')}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow active:scale-98 disabled:opacity-50"
                        >
                          <span>İşleme Al</span>
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingId === req.id}
                          onClick={() => handleUpdateStatus(req.id, 'completed')}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-98 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>Masaya Gidildi</span>
                        </button>
                      </>
                    )}

                    {isInProgress && (
                      <button
                        type="button"
                        disabled={actionLoadingId === req.id}
                        onClick={() => handleUpdateStatus(req.id, 'completed')}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isOrder ? 'Masaya Servis Edildi (Tamamla)' : 'Tamamlandı'}</span>
                      </button>
                    )}

                    {isCompleted && (
                      <div className="w-full text-center py-1 text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        <span>Hizmet Başarıyla Sunuldu</span>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

    </div>
  );
}
