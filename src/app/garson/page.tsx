'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Utensils, 
  Bell, 
  Clock, 
  CheckCircle, 
  CreditCard, 
  Search, 
  Volume2, 
  VolumeX, 
  LogOut, 
  RefreshCw, 
  Flame, 
  Check, 
  Download, 
  Smartphone, 
  Vibrate, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink, 
  Layers, 
  Settings, 
  X, 
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { ServiceRequest } from '@/lib/serviceRequestsStorage';
import { playNotificationChime } from '@/lib/audioNotification';
import { ALL_TABLES, VENUE_SECTIONS } from '@/data/tablesData';

// Helper for VAPID push manager
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function WaiterPanelPage() {
  const router = useRouter();

  // Authentication & Waiter info
  const [waiterName, setWaiterName] = useState('Garson');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Live Requests Data
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active Bottom Navigation Tab: 'calls' | 'orders' | 'tables' | 'settings'
  const [activeTab, setActiveTab] = useState<'calls' | 'orders' | 'tables' | 'settings'>('calls');

  // Filters within calls
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('pending');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // PWA & Push Notifications State
  const [pushStatus, setPushStatus] = useState<'checking' | 'unsupported' | 'default' | 'granted' | 'denied'>('checking');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushTestMsg, setPushTestMsg] = useState('');
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

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

  // 2. Detect Standalone PWA mode & Install prompt
  useEffect(() => {
    // Check if running as installed standalone app
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Listen for beforeinstallprompt (Android / Chrome)
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // 3. Sync Push Subscription with Server
  const syncPushSubscription = useCallback(async (waiter: string) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub && 'Notification' in window && Notification.permission === 'granted') {
        const keyRes = await fetch('/api/waiter/push-subscribe');
        const keyJson = await keyRes.json();
        if (keyJson.publicKey) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(keyJson.publicKey),
          });
        }
      }

      if (sub) {
        const res = await fetch('/api/waiter/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: sub,
            waiterName: waiter,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setIsSubscribed(true);
          return true;
        }
      }
      setIsSubscribed(false);
      return false;
    } catch (err) {
      console.warn('Push sync error:', err);
      setIsSubscribed(false);
      return false;
    }
  }, []);

  // 4. Register Service Worker and check push notifications
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported');
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then(async (reg) => {
        // Check notification permission
        if ('Notification' in window) {
          const perm = Notification.permission;
          setPushStatus(perm as any);
          if (perm === 'granted') {
            await syncPushSubscription(waiterName);
          }
        }
      })
      .catch((err) => {
        console.error('Service Worker registration error:', err);
        setPushStatus('unsupported');
      });

    // Listen for Service Worker messages (e.g. when app is focused from a notification)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NEW_CALL_ARRIVED' || event.data?.type === 'REFRESH_REQUESTS') {
        fetchRequests(true);
      }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [syncPushSubscription, waiterName]);

  // 5. Request Push Notification Permission & Subscribe
  const handleEnablePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Bu tarayıcı kilit ekranı bildirimlerini desteklemiyor. iOS cihazlarda lütfen Safari "Paylaş > Ana Ekrana Ekle" yaparak açın.');
      return;
    }

    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission as any);

      if (permission === 'granted') {
        const synced = await syncPushSubscription(waiterName);

        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }

        if (synced) {
          setPushTestMsg('✅ Kilit ekranı bildirimleri ve titreşim başarıyla bağlandı!');
        } else {
          setPushTestMsg('⚠️ İzin verildi ancak abonelik kaydedilemedi. Sayfayı yenileyip tekrar deneyin.');
        }
      } else if (permission === 'denied') {
        alert('Bildirim izni reddedildi. Telefon ayarlarından tarayıcı bildirimlerine izin verebilirsiniz.');
      }
    } catch (err: any) {
      console.error('Bildirim abonelik hatası:', err);
      alert('Bildirim aboneliği oluşturulamadı: ' + err.message);
    } finally {
      setPushLoading(false);
      setTimeout(() => setPushTestMsg(''), 5000);
    }
  };

  // 6. Test Push Notification (Sends real notification to phone)
  const handleTestPushNotification = async () => {
    setPushLoading(true);
    setPushTestMsg('⏳ Test bildirimi hazırlanıyor...');
    try {
      // First ensure subscription is 100% active on server
      await syncPushSubscription(waiterName);

      const res = await fetch('/api/waiter/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });
      const json = await res.json();
      if (json.success && json.successCount > 0) {
        setPushTestMsg(`🛎️ Telefonunuza 'MASA 4 GARSON İSTİYOR' bildirimi yollandı! (${json.successCount} cihaza iletildi)`);
        if ('vibrate' in navigator) {
          navigator.vibrate([500, 200, 500, 200, 500, 200, 700]);
        }
      } else if (json.totalSubscribers === 0) {
        setPushTestMsg('⚠️ Kayıtlı telefon bulunamadı. Lütfen "Şimdi Aç" butonuna dokunup onaylayın.');
      } else {
        setPushTestMsg('⚠️ Bildirim iletilemedi. Lütfen izinleri yenileyin.');
      }
    } catch (e) {
      setPushTestMsg('❌ Test gönderiminde hata oluştu.');
    } finally {
      setPushLoading(false);
      setTimeout(() => setPushTestMsg(''), 7000);
    }
  };

  // 6. Trigger Native PWA Install
  const handleInstallClick = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredInstallPrompt(null);
    } else {
      // Show iOS or manual guide
      setShowIosGuide(true);
    }
  };

  // 7. Fetch Requests with Audio & Haptic triggers
  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch('/api/service-requests');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const data: ServiceRequest[] = json.data;
        setRequests(data);

        // Sound & Vibration alert for new pending requests
        const currentPendingIds = new Set(data.filter(r => r.status === 'pending').map(r => r.id));
        if (initialFetchDone.current) {
          const hasNew = Array.from(currentPendingIds).some(id => !prevPendingIds.current.has(id));
          if (hasNew) {
            if (soundEnabled) playNotificationChime();
            if ('vibrate' in navigator) {
              navigator.vibrate([400, 150, 400, 150, 500]);
            }
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

  // Polling every 3.5s
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchRequests(false);
    const interval = setInterval(() => {
      fetchRequests(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchRequests]);

  // Update request status
  const handleUpdateStatus = async (id: string, newStatus: 'in_progress' | 'completed') => {
    setActionLoadingId(id);
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
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

  // Filtered lists
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const inProgressRequests = requests.filter(r => r.status === 'in_progress');
  const orderRequests = requests.filter(r => r.type === 'order' && r.status !== 'completed');

  const filteredRequests = requests.filter(req => {
    if (activeTab === 'orders' && req.type !== 'order') return false;
    if (selectedStatus !== 'all' && req.status !== selectedStatus) return false;
    if (selectedType !== 'all' && req.type !== selectedType) return false;

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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col justify-between selection:bg-gold selection:text-black">
      
      {/* 1. TOP NATIVE APP BAR */}
      <header className="sticky top-0 z-40 bg-[#10141D]/95 backdrop-blur-2xl border-b border-gold/30 shadow-2xl safe-top">
        <div className="max-w-md mx-auto px-3.5 py-2.5 flex items-center justify-between gap-2.5">
          
          {/* App Branding & Avatar */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-gold/50 shadow-md flex-shrink-0 bg-black">
              <Image 
                src="/icons/garson-icon.jpg" 
                alt="HayalMest Garson" 
                fill 
                className="object-cover" 
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-white text-sm tracking-wide truncate">
                  HayalMest Garson
                </span>
                <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Canlı
                </span>
              </div>
              <div className="text-[10px] text-gray-400 truncate flex items-center gap-1.5">
                <span className="text-gold font-medium">{waiterName}</span>
                <span>•</span>
                <span>{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions: Audio & Refresh */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playNotificationChime();
              }}
              className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                soundEnabled
                  ? 'bg-gold/15 text-gold border-gold/40'
                  : 'bg-white/5 text-gray-400 border-white/10'
              }`}
              title={soundEnabled ? 'Ses Açık' : 'Sessiz'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-gold" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
            </button>

            <button
              type="button"
              onClick={() => fetchRequests(false)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-colors"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-gold' : ''}`} />
            </button>
          </div>

        </div>

        {/* Push Notification Bar */}
        {pushStatus !== 'granted' ? (
          <div className="bg-gradient-to-r from-amber-950/70 via-amber-900/50 to-amber-950/70 border-t border-amber-500/40 px-3.5 py-2 flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-semibold truncate">
              <Vibrate className="w-4 h-4 text-amber-400 flex-shrink-0 animate-bounce" />
              <span className="truncate">Ekran Kapalıyken Bildirim &amp; Titreşim</span>
            </div>
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={pushLoading}
              className="px-3 py-1 rounded-xl bg-gold text-black text-[11px] font-bold uppercase tracking-wider shadow whitespace-nowrap active:scale-95 transition-all"
            >
              {pushLoading ? 'Açılıyor...' : 'Şimdi Aç'}
            </button>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border-t border-emerald-500/30 px-3.5 py-1.5 flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-semibold truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="truncate">Kilit Ekranı Hazır ({isSubscribed ? 'Bağlandı' : 'Bağlanıyor...'})</span>
            </div>
            <button
              type="button"
              onClick={handleTestPushNotification}
              disabled={pushLoading}
              className="px-2.5 py-0.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 text-[10px] font-bold border border-emerald-500/40 whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
              title="Telefonu kilitleyip bildirim ve titreşimi test edin"
            >
              <Bell className="w-3 h-3" />
              <span>Test Bildirimi Gönder</span>
            </button>
          </div>
        )}

        {pushTestMsg && (
          <div className="bg-gradient-to-r from-emerald-950/90 to-black border-t border-emerald-500/50 px-3.5 py-2 text-[11px] text-emerald-300 font-bold text-center animate-fadeIn shadow-lg">
            {pushTestMsg}
          </div>
        )}
      </header>

      {/* 2. PWA INSTALL BANNER (If not installed) */}
      {!isStandalone && (showInstallBanner || deferredInstallPrompt) && (
        <div className="max-w-md mx-auto w-full px-3.5 pt-3">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-gold/15 via-[#1A2030] to-gold/15 border border-gold/50 shadow-xl flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-gold/40 flex-shrink-0 relative">
                <Image src="/icons/garson-icon.jpg" alt="Logo" fill className="object-cover" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold font-serif text-white truncate">Uygulama Olarak Yükle</div>
                <div className="text-[10px] text-gray-300 truncate">Ana ekrana ekleyip tam ekran kullanın</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-md active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Yükle</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN APP VIEW CONTAINER */}
      <main className="max-w-md mx-auto w-full px-3.5 py-3 flex-1 space-y-3 pb-24">

        {/* TAB 1: ÇAĞRILAR (CALLS) */}
        {activeTab === 'calls' && (
          <div className="space-y-3 animate-fadeIn">
            
            {/* Status Tabs Segment Control */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#141824] border border-meyhane-border text-xs">
              <button
                type="button"
                onClick={() => setSelectedStatus('pending')}
                className={`py-2 px-1 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
                  selectedStatus === 'pending'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>Bekleyen</span>
                {pendingRequests.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-white text-[10px] font-mono">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('in_progress')}
                className={`py-2 px-1 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
                  selectedStatus === 'in_progress'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>İşlemde</span>
                {inProgressRequests.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-black text-[10px] font-mono">
                    {inProgressRequests.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('completed')}
                className={`py-2 px-1 rounded-xl font-bold transition-all ${
                  selectedStatus === 'completed'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Bitti
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('all')}
                className={`py-2 px-1 rounded-xl font-bold transition-all ${
                  selectedStatus === 'all'
                    ? 'bg-gold text-black shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Tümü ({requests.length})
              </button>
            </div>

            {/* Search & Request Type Filter Row */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Masa no, sipariş veya not ara..."
                  className="w-full bg-[#141824] border border-meyhane-border pl-9 pr-8 py-2 rounded-xl text-white text-xs focus:border-gold focus:outline-none"
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

              {/* Swipeable Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                {[
                  { id: 'all', label: 'Tümü' },
                  { id: 'waiter', label: '🔔 Garson' },
                  { id: 'bill', label: '💳 Hesap' },
                  { id: 'ice_water', label: '🧊 Buz & Su' },
                  { id: 'order', label: '🍲 Sipariş' },
                ].map(typeItem => (
                  <button
                    key={typeItem.id}
                    type="button"
                    onClick={() => setSelectedType(typeItem.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedType === typeItem.id
                        ? 'bg-gold text-black font-bold shadow-md shadow-gold/25'
                        : 'bg-[#141824] text-gray-300 border border-meyhane-border'
                    }`}
                  >
                    {typeItem.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Requests */}
            {loading ? (
              <div className="text-center py-16 space-y-2">
                <RefreshCw className="w-8 h-8 text-gold animate-spin mx-auto" />
                <p className="text-xs text-gray-400">Talepler senkronize ediliyor...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="luxury-card rounded-3xl p-8 text-center border border-meyhane-border/70 space-y-2.5 bg-[#141824]/90">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-serif font-bold text-white">
                  {selectedStatus === 'pending' ? 'Tüm Masalar Memnun' : 'Kayıt Bulunamadı'}
                </h3>
                <p className="text-xs text-meyhane-muted max-w-xs mx-auto">
                  {selectedStatus === 'pending'
                    ? 'Bekleyen aktif masa çağrısı yok. Bir talep iletildiğinde telefonunuz titreyecektir.'
                    : 'Arama veya filtre kriterlerini değiştirip tekrar deneyin.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((req) => {
                  const isPending = req.status === 'pending';
                  const isInProgress = req.status === 'in_progress';
                  const isCompleted = req.status === 'completed';
                  const isOrder = req.type === 'order';
                  const isBill = req.type === 'bill';

                  const createdTime = new Date(req.createdAt);
                  const elapsedMinutes = Math.floor((Date.now() - createdTime.getTime()) / 60000);
                  const isUrgent = isPending && elapsedMinutes >= 3;

                  return (
                    <div
                      key={req.id}
                      className={`rounded-2xl p-4 border transition-all relative flex flex-col justify-between shadow-xl ${
                        isUrgent
                          ? 'bg-gradient-to-r from-red-950/50 via-[#1C1418] to-red-950/40 border-red-500/90 ring-1 ring-red-500 shadow-red-950/50 animate-pulse'
                          : isPending
                          ? isOrder
                            ? 'bg-gradient-to-br from-[#1C1714] via-[#141824] to-[#1C1714] border-amber-500/70 shadow-amber-950/30'
                            : 'bg-gradient-to-br from-[#1C1914] via-[#141824] to-[#141824] border-gold/50 shadow-gold/10'
                          : isInProgress
                          ? 'bg-[#141824] border-amber-500/40'
                          : 'bg-[#10141D]/90 border-meyhane-border/40 opacity-70'
                      }`}
                    >
                      {/* Top Row: Table Name + Time */}
                      <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5 mb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-gold text-black text-xs font-bold font-serif">
                              {req.tableName}
                            </span>
                            {req.sectionName && (
                              <span className="text-[10px] text-meyhane-muted font-medium">
                                {req.sectionName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1">
                            <Clock className="w-3 h-3 text-gold" />
                            <span>{createdTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span className={isUrgent ? 'text-red-400 font-bold' : 'text-gray-300'}>
                              {elapsedMinutes === 0 ? 'Az önce' : `${elapsedMinutes} dk önce`}
                            </span>
                          </div>
                        </div>

                        {/* Category & Status Badge */}
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            isOrder
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : isBill
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-gold/20 text-gold border border-gold/40'
                          }`}>
                            {isOrder && <Flame className="w-3 h-3" />}
                            {isBill && <CreditCard className="w-3 h-3" />}
                            {!isOrder && !isBill && <Bell className="w-3 h-3" />}
                            <span>{req.title}</span>
                          </span>

                          <span className={`text-[9px] font-semibold tracking-wider uppercase ${
                            isPending ? 'text-red-400' : isInProgress ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {isPending ? '● Bekliyor' : isInProgress ? '⏳ İşlemde' : '✓ Tamamlandı'}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Items or Guest Note */}
                      <div className="space-y-2 pb-3">
                        {isOrder && req.items && req.items.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/30 text-xs space-y-1.5">
                            <div className="text-[10px] font-bold uppercase text-amber-300 flex items-center justify-between border-b border-white/10 pb-1">
                              <span>Sipariş Listesi ({req.items.length} Kalem):</span>
                              {req.totalAmount && (
                                <span className="font-mono text-white text-xs">{req.totalAmount.toLocaleString('tr-TR')} ₺</span>
                              )}
                            </div>
                            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                              {req.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[11px] text-gray-200">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] flex items-center justify-center">
                                      {it.quantity}
                                    </span>
                                    <span>{it.name}</span>
                                  </div>
                                  {it.price && (
                                    <span className="font-mono text-gray-400 text-[10px]">
                                      {(it.price * it.quantity).toLocaleString('tr-TR')} ₺
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {req.note && (
                          <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs">
                            <span className="text-[10px] text-amber-400 font-semibold uppercase block">Masa Notu:</span>
                            <span className="text-amber-200 font-medium text-[11px]">&ldquo;{req.note}&rdquo;</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Buttons: Large Touch Targets */}
                      <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              disabled={actionLoadingId === req.id}
                              onClick={() => handleUpdateStatus(req.id, 'in_progress')}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow"
                            >
                              <span>İşleme Al</span>
                            </button>
                            <button
                              type="button"
                              disabled={actionLoadingId === req.id}
                              onClick={() => handleUpdateStatus(req.id, 'completed')}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
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
                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
                          >
                            <Check className="w-4 h-4" />
                            <span>{isOrder ? 'Masaya Servis Edildi (Kapat)' : 'Tamamlandı'}</span>
                          </button>
                        )}

                        {isCompleted && (
                          <div className="w-full text-center py-1 text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Servis Sunuldu ({req.completedBy || 'Garson'})</span>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: SİPARİŞLER (ORDERS CART ONLY) */}
        {activeTab === 'orders' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="p-3.5 rounded-2xl bg-[#141824] border border-amber-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 font-serif flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  Masalardan Canlı Menü Siparişleri
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                  {orderRequests.length} Aktif
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Masadaki müşterilerin QR kod ile doğrudan sepete ekleyip yolladığı yemek &amp; meze siparişleri.
              </p>
            </div>

            {orderRequests.length === 0 ? (
              <div className="luxury-card rounded-3xl p-8 text-center border border-meyhane-border/70 space-y-2 bg-[#141824]/90">
                <Flame className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
                <h4 className="text-sm font-serif font-bold text-white">Bekleyen Sipariş Yok</h4>
                <p className="text-xs text-meyhane-muted">Yeni bir sepet siparişi geldiğinde anında burada listelenir.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderRequests.map(req => (
                  <div key={req.id} className="p-4 rounded-2xl bg-[#141824] border border-amber-500/50 shadow-xl space-y-3">
                    <div className="flex items-start justify-between border-b border-white/10 pb-2.5">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-lg bg-gold text-black text-xs font-bold">
                          {req.tableName}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {new Date(req.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-amber-300">
                          {req.totalAmount ? `${req.totalAmount.toLocaleString('tr-TR')} ₺` : ''}
                        </span>
                        <div className="text-[10px] text-gray-400">{req.items?.length || 0} Çeşit</div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {req.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-gray-200">
                          <span className="font-medium text-white">{it.quantity}x {it.name}</span>
                          {it.price && <span className="font-mono text-gray-400 text-[11px]">{(it.price * it.quantity).toLocaleString('tr-TR')} ₺</span>}
                        </div>
                      ))}
                    </div>

                    {req.note && (
                      <div className="p-2 rounded-lg bg-black/40 text-[11px] text-amber-200">
                        Not: &ldquo;{req.note}&rdquo;
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(req.id, 'completed')}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98"
                    >
                      <Check className="w-4 h-4" />
                      <span>Masaya Servis Edildi (Kapat)</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MASALAR (QUICK TABLE SELECTOR & QR TEST) */}
        {activeTab === 'tables' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="p-3.5 rounded-2xl bg-[#141824] border border-meyhane-border space-y-1">
              <h3 className="text-xs font-bold font-serif text-gold flex items-center gap-1.5">
                <QrCode className="w-4 h-4" />
                Salon Masa Rehberi &amp; Canlı QR Menüler
              </h3>
              <p className="text-[11px] text-gray-400">
                Masaların canlı menü bağlantılarını açın veya masadan gelen çağrı geçmişini denetleyin.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ALL_TABLES.map(tbl => {
                const pendingForThis = requests.filter(r => r.tableId === tbl.id && r.status === 'pending');
                const hasPending = pendingForThis.length > 0;

                return (
                  <div
                    key={tbl.id}
                    className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                      hasPending
                        ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500'
                        : 'bg-[#141824] border-meyhane-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-white text-xs">{tbl.number}</span>
                      <span className="text-[10px] text-gray-400">{tbl.capacity} Kişilik</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-semibold ${hasPending ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
                        {hasPending ? `● ${pendingForThis.length} Çağrı!` : 'Sakin'}
                      </span>
                      <Link
                        href={`/masa/${tbl.id}`}
                        target="_blank"
                        className="p-1 rounded-lg bg-white/5 hover:bg-gold/20 text-gold transition-colors"
                        title="Masaya Özel QR Menüyü Aç"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: AYARLAR & PWA YÖNETİMİ */}
        {activeTab === 'settings' && (
          <div className="space-y-3 animate-fadeIn">
            {/* App Profile Card */}
            <div className="p-4 rounded-3xl bg-[#141824] border border-gold/40 shadow-xl space-y-3 text-center">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gold mx-auto relative shadow-lg">
                <Image src="/icons/garson-icon.jpg" alt="Icon" fill className="object-cover" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-white text-base">HayalMest Garson Paneli</h3>
                <p className="text-xs text-gold font-medium">Aktif Personel: {waiterName}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Versiyon: 1.0 (PWA Native)</p>
              </div>
            </div>

            {/* Notification & Vibration Controls */}
            <div className="p-4 rounded-2xl bg-[#141824] border border-meyhane-border space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <Vibrate className="w-4 h-4 text-gold" />
                  <span className="font-semibold text-white">Kilit Ekranı &amp; Titreşim</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  pushStatus === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {pushStatus === 'granted' ? 'Aktif' : 'Kapalı'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={pushLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider active:scale-98 transition-all"
                >
                  {pushStatus === 'granted' ? 'Yeniden Abone Ol' : 'Bildirimleri Aç'}
                </button>

                <button
                  type="button"
                  onClick={handleTestPushNotification}
                  disabled={pushLoading}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                  title="Telefon titreşimini ve bildirimini test et"
                >
                  <Bell className="w-3.5 h-3.5 text-gold" />
                  <span>Test Et</span>
                </button>
              </div>

              {pushTestMsg && (
                <p className="text-[11px] text-emerald-400 font-medium">{pushTestMsg}</p>
              )}
            </div>

            {/* Install to Home Screen Prompt */}
            <div className="p-4 rounded-2xl bg-[#141824] border border-meyhane-border space-y-2.5 text-xs">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Smartphone className="w-4 h-4 text-gold" />
                <span>Telefona Yükleme Durumu</span>
              </div>
              <p className="text-[11px] text-gray-300">
                {isStandalone
                  ? '✅ Uygulama ana ekranda tam ekran çalışıyor.'
                  : 'Uygulamayı telefonun ana ekranına ekleyerek adres çubuğu olmadan tam ekran kullanabilirsiniz.'}
              </p>
              {!isStandalone && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-gold" />
                  <span>Ana Ekrana Ekleme Rehberini Aç</span>
                </button>
              )}
            </div>

            {/* Logout */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 rounded-2xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Garson Oturumunu Kapat</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* 4. BOTTOM NATIVE APP DOCK (FIXED NAVIGATION) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0E121A]/95 backdrop-blur-2xl border-t border-gold/40 shadow-[0_-8px_30px_rgba(0,0,0,0.85)] safe-bottom">
        <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5 text-center">
          
          {/* Tab 1: Çağrılar */}
          <button
            type="button"
            onClick={() => setActiveTab('calls')}
            className={`py-1.5 rounded-2xl transition-all flex flex-col items-center justify-center relative ${
              activeTab === 'calls' ? 'text-gold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'calls' ? 'bg-gold/15 scale-110' : ''}`}>
              <Bell className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Çağrılar</span>
            {pendingRequests.length > 0 && (
              <span className="absolute top-0 right-4 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-bold font-mono animate-bounce">
                {pendingRequests.length}
              </span>
            )}
          </button>

          {/* Tab 2: Siparişler */}
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`py-1.5 rounded-2xl transition-all flex flex-col items-center justify-center relative ${
              activeTab === 'orders' ? 'text-gold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-gold/15 scale-110' : ''}`}>
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Siparişler</span>
            {orderRequests.length > 0 && (
              <span className="absolute top-0 right-4 px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[9px] font-bold font-mono">
                {orderRequests.length}
              </span>
            )}
          </button>

          {/* Tab 3: Masalar */}
          <button
            type="button"
            onClick={() => setActiveTab('tables')}
            className={`py-1.5 rounded-2xl transition-all flex flex-col items-center justify-center ${
              activeTab === 'tables' ? 'text-gold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'tables' ? 'bg-gold/15 scale-110' : ''}`}>
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Masalar</span>
          </button>

          {/* Tab 4: Ayarlar */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-1.5 rounded-2xl transition-all flex flex-col items-center justify-center ${
              activeTab === 'settings' ? 'text-gold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-gold/15 scale-110' : ''}`}>
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Ayarlar</span>
          </button>

        </div>
      </nav>

      {/* 5. IOS INSTALL GUIDE MODAL */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 flex items-end sm:items-center justify-center animate-fadeIn">
          <div className="luxury-card max-w-sm w-full rounded-3xl p-5 border border-gold/50 shadow-2xl space-y-4 bg-[#141824]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold font-serif text-white">iPhone &amp; Telefona Yükle</span>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-200">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="w-6 h-6 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </span>
                <div>
                  <strong className="text-white block">Paylaş Butonuna Basın</strong>
                  <span className="text-gray-400 text-[11px]">Safari tarayıcısının altındaki Paylaş (📤) simgesine dokunun.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="w-6 h-6 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </span>
                <div>
                  <strong className="text-white block">&ldquo;Ana Ekrana Ekle&rdquo;yi Seçin</strong>
                  <span className="text-gray-400 text-[11px]">Açılan menüden &ldquo;Ana Ekrana Ekle&rdquo; seçeneğine dokunup &ldquo;Ekle&rdquo; deyin.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="w-6 h-6 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  3
                </span>
                <div>
                  <strong className="text-white block">Bildirimleri Onaylayın</strong>
                  <span className="text-gray-400 text-[11px]">Ana ekrandaki HayalMest Garson simgesine tıklayın ve bildirim iznine izin verin.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider shadow"
            >
              Anladım
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
