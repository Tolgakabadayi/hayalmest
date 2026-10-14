'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  CreditCard, 
  Volume2, 
  VolumeX, 
  LogOut, 
  RefreshCw, 
  Flame, 
  Check, 
  Vibrate, 
  Settings, 
  X,
  Smartphone,
  Droplets,
  MapPin,
  History
} from 'lucide-react';
import { ServiceRequest } from '@/lib/serviceRequestsStorage';
import { playNotificationChime } from '@/lib/audioNotification';

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

  // View state: 'pending' (default) | 'completed' | 'settings'
  const [viewTab, setViewTab] = useState<'pending' | 'completed' | 'settings'>('pending');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Push Notifications State
  const [pushStatus, setPushStatus] = useState<'checking' | 'unsupported' | 'default' | 'granted' | 'denied'>('checking');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushMsg, setPushMsg] = useState('');
  const [showIosGuide, setShowIosGuide] = useState(false);

  const prevPendingIds = useRef<Set<string>>(new Set());
  const initialFetchDone = useRef(false);

  // 1. Auth check & Hydrate cached requests from localStorage
  useEffect(() => {
    const token = localStorage.getItem('hayalmest_waiter_token');
    const name = localStorage.getItem('hayalmest_waiter_name');
    if (!token) {
      router.push('/garson/login');
      return;
    }
    if (name) setWaiterName(name);
    setIsAuthenticated(true);

    // Instant local cache hydration so screen is never blank or empty
    try {
      const cached = localStorage.getItem('hayalmest_garson_requests');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRequests(parsed);
          setLoading(false);
        }
      }
    } catch (e) {
      // Ignore cache parse error
    }
  }, [router]);

  // 2. Sync Push Subscription with Server
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

  // 3. Register Service Worker on mount & Listen to instant Push payload
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported');
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then(async (reg) => {
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

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NEW_CALL_ARRIVED') {
        const payload = event.data?.payload;
        if (payload && payload.id) {
          setRequests(prev => {
            if (prev.some(r => r.id === payload.id)) return prev;
            const updated = [payload, ...prev];
            try {
              localStorage.setItem('hayalmest_garson_requests', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
        fetchRequests(true);
      } else if (event.data?.type === 'REFRESH_REQUESTS') {
        fetchRequests(true);
      }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [syncPushSubscription, waiterName]);

  // 4. Request Push Notification Permission
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
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        if (synced) {
          setPushMsg('✅ Bildirim ve titreşim açıldı!');
        } else {
          setPushMsg('⚠️ İzin verildi ancak abonelik yenilenemedi.');
        }
      } else if (permission === 'denied') {
        alert('Bildirim izni reddedildi. Telefon ayarlarından tarayıcı bildirimlerine izin verebilirsiniz.');
      }
    } catch (err: any) {
      console.error('Bildirim hatası:', err);
      alert('Hata: ' + err.message);
    } finally {
      setPushLoading(false);
      setTimeout(() => setPushMsg(''), 4000);
    }
  };

  // 5. Test Push Notification
  const handleTestPushNotification = async () => {
    setPushLoading(true);
    setPushMsg('⏳ Test bildirimi hazırlanıyor...');
    try {
      await syncPushSubscription(waiterName);

      const res = await fetch('/api/waiter/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });
      const json = await res.json();
      if (json.success && json.successCount > 0) {
        setPushMsg(`🛎️ Telefonunuza 'MASA 4 GARSON İSTİYOR' bildirimi yollandı!`);
        if ('vibrate' in navigator) {
          navigator.vibrate([500, 200, 500, 200, 500, 200, 700]);
        }
      } else {
        setPushMsg('⚠️ Bildirim gönderilemedi. Lütfen "İzin Ver" butonuna dokunun.');
      }
    } catch (e) {
      setPushMsg('❌ Test gönderiminde hata oluştu.');
    } finally {
      setPushLoading(false);
      setTimeout(() => setPushMsg(''), 6000);
    }
  };

  // 6. Fetch Requests with Cache-Busting & Resilient Merge
  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/service-requests?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (!res.ok) {
        return; // Don't wipe requests on server glitch!
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const data: ServiceRequest[] = json.data;

        setRequests(prev => {
          const serverMap = new Map<string, ServiceRequest>();
          for (const s of data) {
            serverMap.set(s.id, s);
          }

          const combined = [...data];
          // Preserve any local calls that haven't reached this serverless instance yet
          for (const localReq of prev) {
            if (!serverMap.has(localReq.id)) {
              combined.push(localReq);
            }
          }

          combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          try {
            localStorage.setItem('hayalmest_garson_requests', JSON.stringify(combined));
          } catch (e) {}

          return combined;
        });

        // Sound & Vibration alert for new pending requests
        const currentPendingIds = new Set(data.filter(r => r.status === 'pending').map(r => r.id));
        if (initialFetchDone.current) {
          const hasNew = Array.from(currentPendingIds).some(id => !prevPendingIds.current.has(id));
          if (hasNew) {
            if (soundEnabled) playNotificationChime();
            if ('vibrate' in navigator) {
              navigator.vibrate([500, 200, 500, 200, 500, 200, 700]);
            }
          }
        }
        prevPendingIds.current = currentPendingIds;
        initialFetchDone.current = true;
      }
    } catch (err) {
      console.error('Talepler alınamadı:', err);
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

  // Update request status (Complete call with optimistic UI)
  const handleCompleteRequest = async (id: string) => {
    setActionLoadingId(id);
    if ('vibrate' in navigator) {
      navigator.vibrate(80);
    }

    const nowIso = new Date().toISOString();
    setRequests(prev => {
      const updated = prev.map(r => r.id === id ? { 
        ...r, 
        status: 'completed' as const,
        completedBy: waiterName,
        completedAt: nowIso
      } : r);
      try {
        localStorage.setItem('hayalmest_garson_requests', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await fetch(`/api/service-requests/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          status: 'completed',
          completedBy: waiterName,
        }),
      });
    } catch (err) {
      console.error('Sunucu güncelleme hatası:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLogout = () => {
    if (confirm('Garson oturumunu kapatmak istiyor musunuz?')) {
      localStorage.removeItem('hayalmest_waiter_token');
      localStorage.removeItem('hayalmest_waiter_name');
      router.push('/garson/login');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const completedRequests = requests.filter(r => r.status === 'completed');

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col selection:bg-gold selection:text-black overflow-x-hidden">
      
      {/* 1. TOP NATIVE APP BAR (KOMPAKT, ASLA TAŞMAZ VEYA BÖLÜNMEZ) */}
      <header className="sticky top-0 z-40 bg-[#121620] border-b border-gold/30 shadow-md">
        <div className="w-full max-w-md mx-auto px-3.5 py-2.5 flex items-center justify-between gap-2">
          
          {/* Left: App Branding & Waiter Name in a tight row */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-gold/60 shadow-sm flex-shrink-0 relative bg-black">
              <Image src="/icons/garson-icon.jpg" alt="Icon" fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="font-serif font-bold text-white text-sm whitespace-nowrap">
                  HayalMest Garson
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              </div>
              <div className="text-[11px] text-gold font-medium truncate leading-tight mt-0.5">
                {waiterName}
              </div>
            </div>
          </div>

          {/* Right: Quick Action Buttons (32px compact targets) */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playNotificationChime();
              }}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                soundEnabled
                  ? 'bg-gold/15 text-gold border-gold/40'
                  : 'bg-white/5 text-gray-500 border-white/10'
              }`}
              title={soundEnabled ? 'Ses Açık' : 'Ses Kapalı'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-gold" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => fetchRequests(false)}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 flex items-center justify-center transition-colors"
              title="Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-gold' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 flex items-center justify-center transition-colors"
              title="Çıkış"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Lockscreen Push Permission Banner */}
        {pushStatus !== 'granted' && (
          <div className="bg-gradient-to-r from-amber-950/95 via-[#231A12] to-amber-950/95 border-t border-amber-500/50 px-3.5 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-200 font-semibold text-xs truncate">
              <Vibrate className="w-4 h-4 text-amber-400 flex-shrink-0 animate-bounce" />
              <span className="truncate">Ekran kapalıyken bildirim al:</span>
            </div>
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={pushLoading}
              className="flex-shrink-0 px-3 py-1 rounded-lg bg-gold text-black font-bold text-xs uppercase shadow hover:brightness-110 active:scale-95"
            >
              {pushLoading ? '...' : 'İzin Ver'}
            </button>
          </div>
        )}

        {pushMsg && (
          <div className="bg-emerald-950 border-t border-emerald-500/60 px-3 py-1.5 text-xs text-emerald-300 font-bold text-center">
            {pushMsg}
          </div>
        )}

        {/* 2. MODERN SEGMENTED TAB BAR */}
        <div className="w-full max-w-md mx-auto px-3.5 py-2 bg-[#0E121B] border-t border-white/5">
          <div className="grid grid-cols-3 gap-1 bg-[#161B26] p-1 rounded-xl border border-white/10 text-xs">
            
            {/* Tab 1: Bekleyen */}
            <button
              type="button"
              onClick={() => setViewTab('pending')}
              className={`py-2 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                viewTab === 'pending'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Bekleyen</span>
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white text-red-600 text-[10px] font-mono font-black">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            {/* Tab 2: Geçmiş */}
            <button
              type="button"
              onClick={() => setViewTab('completed')}
              className={`py-2 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                viewTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Geçmiş</span>
              <span className="text-[10px] opacity-80 font-mono">
                ({completedRequests.length})
              </span>
            </button>

            {/* Tab 3: Ayarlar */}
            <button
              type="button"
              onClick={() => setViewTab('settings')}
              className={`py-2 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                viewTab === 'settings'
                  ? 'bg-gold text-black shadow font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Ayarlar</span>
            </button>

          </div>
        </div>
      </header>

      {/* 3. MAIN CONTENT AREA */}
      <main className="w-full max-w-md mx-auto px-3.5 py-3.5 flex-1 space-y-3 pb-12">
        
        {/* VIEW TAB 1: BEKLEYEN MASA ÇAĞRILARI */}
        {viewTab === 'pending' && (
          <div className="space-y-3 animate-fadeIn">
            
            {loading ? (
              <div className="text-center py-16 space-y-2">
                <RefreshCw className="w-8 h-8 text-gold animate-spin mx-auto" />
                <p className="text-xs text-gray-400 font-medium">Masa çağrıları kontrol ediliyor...</p>
              </div>
            ) : pendingRequests.length === 0 ? (
              
              /* ALL TABLES SERVED - CLEAN EMPTY STATE */
              <div className="rounded-2xl p-6 text-center border border-gold/30 space-y-3 bg-gradient-to-b from-[#141926] to-[#0E121B] shadow-xl my-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-serif font-bold text-white tracking-wide">
                    Tüm Masalar Servis Aldı
                  </h3>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                    Şu anda bekleyen aktif bir masa çağrısı bulunmuyor.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-300 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
                  <span>Canlı Dinleniyor: Masadan çağrı gelince telefonunuz titreyecektir.</span>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleTestPushNotification}
                    disabled={pushLoading}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/40 text-gold text-xs font-bold transition-all"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Titreşim &amp; Bildirimi Test Et</span>
                  </button>
                </div>
              </div>

            ) : (

              /* ACTIVE CALL CARDS (OVERFLOW-PROOF, CLEAN RESPONSIVE DESIGN) */
              <div className="space-y-3">
                {pendingRequests.map((req) => {
                  const isOrder = req.type === 'order';
                  const isBill = req.type === 'bill';
                  const isWater = req.type === 'ice_water';

                  const createdTime = new Date(req.createdAt);
                  const elapsedMinutes = Math.floor((Date.now() - createdTime.getTime()) / 60000);
                  const isUrgent = elapsedMinutes >= 3;

                  // Clean section name (strip parenthetical text like '(Keyif & Muhabbet)')
                  const cleanSection = req.sectionName ? req.sectionName.split('(')[0].trim() : '';

                  return (
                    <div
                      key={req.id}
                      className={`rounded-2xl p-4 border transition-all relative flex flex-col justify-between shadow-xl space-y-3 ${
                        isUrgent
                          ? 'bg-gradient-to-b from-red-950/70 via-[#1F1318] to-[#121620] border-red-500 ring-2 ring-red-500/70 shadow-red-950/50'
                          : isOrder
                          ? 'bg-gradient-to-b from-[#251A15] via-[#1A1520] to-[#121620] border-amber-500/70 shadow-amber-950/30'
                          : isBill
                          ? 'bg-gradient-to-b from-[#13251C] via-[#121820] to-[#121620] border-emerald-500/70 shadow-emerald-950/30'
                          : 'bg-gradient-to-b from-[#241F14] via-[#161924] to-[#121620] border-gold/60 shadow-gold/10'
                      }`}
                    >
                      {/* ROW 1: TABLE NAME ON LEFT, COMPACT BADGE ON RIGHT */}
                      <div className="flex items-center justify-between gap-2">
                        
                        {/* Table Name (Single line, bold, never breaks onto multiple lines) */}
                        <div className="min-w-0 flex-1">
                          <span className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide truncate block">
                            {req.tableName}
                          </span>
                        </div>

                        {/* Request Type Badge (Compact, fits perfectly) */}
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow ${
                            isOrder
                              ? 'bg-amber-500 text-black'
                              : isBill
                              ? 'bg-emerald-500 text-black'
                              : isWater
                              ? 'bg-cyan-400 text-black'
                              : 'bg-gold text-black'
                          }`}>
                            {isOrder && <Flame className="w-3.5 h-3.5 flex-shrink-0" />}
                            {isBill && <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />}
                            {isWater && <Droplets className="w-3.5 h-3.5 flex-shrink-0" />}
                            {!isOrder && !isBill && !isWater && <Bell className="w-3.5 h-3.5 flex-shrink-0" />}
                            <span className="whitespace-nowrap font-sans font-bold">
                              {isOrder 
                                ? `Sipariş (${req.items?.length || 0})` 
                                : isBill 
                                ? 'Hesap' 
                                : isWater 
                                ? 'Buz & Su' 
                                : 'Garson'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* ROW 2: SECTION BADGE + TIME + URGENCY */}
                      <div className="flex items-center gap-2 flex-wrap text-xs text-gray-400 pb-2 border-b border-white/10">
                        {cleanSection && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold/90 bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                            <MapPin className="w-3 h-3 text-gold flex-shrink-0" />
                            <span className="truncate">{cleanSection}</span>
                          </span>
                        )}
                        
                        <div className="flex items-center gap-1 text-[11px] font-mono">
                          <Clock className="w-3 h-3 text-gold flex-shrink-0" />
                          <span>
                            {createdTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>•</span>
                          <span className={isUrgent ? 'text-red-400 font-bold animate-pulse' : 'text-gray-300'}>
                            {elapsedMinutes === 0 ? 'Az önce' : `${elapsedMinutes} dk önce`}
                          </span>
                        </div>

                        {isUrgent && (
                          <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-bold text-[9px] animate-pulse">
                            ACİL!
                          </span>
                        )}
                      </div>

                      {/* ROW 3: ORDER ITEMS (IF ORDER TYPE) */}
                      {isOrder && req.items && req.items.length > 0 && (
                        <div className="p-3 rounded-xl bg-black/50 border border-amber-500/40 text-xs space-y-2">
                          <div className="text-[11px] font-bold uppercase text-amber-300 flex items-center justify-between border-b border-white/10 pb-1.5">
                            <span>Sipariş Listesi ({req.items.length} Çeşit):</span>
                            {req.totalAmount && (
                              <span className="font-mono text-white font-bold">
                                {req.totalAmount.toLocaleString('tr-TR')} ₺
                              </span>
                            )}
                          </div>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {req.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs text-gray-200">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-5 h-5 rounded-md bg-amber-500/25 text-amber-300 font-mono font-bold text-[11px] flex items-center justify-center border border-amber-500/40 flex-shrink-0">
                                    {it.quantity}x
                                  </span>
                                  <span className="font-semibold text-white truncate">{it.name}</span>
                                </div>
                                {it.price && (
                                  <span className="font-mono text-gray-400 text-xs flex-shrink-0">
                                    {(it.price * it.quantity).toLocaleString('tr-TR')} ₺
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ROW 4: CUSTOMER NOTE (IF PRESENT) */}
                      {req.note && (
                        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs">
                          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-0.5">
                            💬 MİSAFİR NOTU:
                          </span>
                          <span className="text-amber-100 font-medium text-xs leading-relaxed">
                            &ldquo;{req.note}&rdquo;
                          </span>
                        </div>
                      )}

                      {/* ROW 5: GIANT THUMB ACTION BUTTON */}
                      <button
                        type="button"
                        disabled={actionLoadingId === req.id}
                        onClick={() => handleCompleteRequest(req.id)}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:brightness-110 active:scale-[0.98] text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all border border-emerald-400/40"
                      >
                        <Check className="w-5 h-5 stroke-[3]" />
                        <span>MASAYA GİDİLDİ (KAPAT)</span>
                      </button>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* VIEW TAB 2: GEÇMİŞ (TAMAMLANAN ÇAĞRILAR) */}
        {viewTab === 'completed' && (
          <div className="space-y-3 animate-fadeIn">
            
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Bugün Tamamlananlar
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Toplam: {completedRequests.length}
              </span>
            </div>

            {completedRequests.length === 0 ? (
              <div className="rounded-2xl p-8 text-center border border-white/10 text-gray-400 text-xs bg-[#121620]">
                Henüz tamamlanmış bir masa çağrısı bulunmuyor.
              </div>
            ) : (
              <div className="space-y-2">
                {completedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-[#121620] border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-white font-serif text-sm truncate">
                          {req.tableName}
                        </span>
                        <span className="text-gray-400 text-xs truncate">
                          • {req.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1.5 font-mono">
                        <Clock className="w-3 h-3 text-gold flex-shrink-0" />
                        <span>
                          {req.completedAt ? new Date(req.completedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {req.completedBy && (
                          <span className="text-gold font-sans font-semibold truncate">
                            ({req.completedBy})
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] flex items-center gap-1 flex-shrink-0 ml-2">
                      <Check className="w-3 h-3" />
                      Tamamlandı
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW TAB 3: AYARLAR & TEST */}
        {viewTab === 'settings' && (
          <div className="space-y-3 animate-fadeIn">
            
            <div className="p-4 rounded-2xl bg-[#121620] border border-gold/40 shadow-lg space-y-2.5 text-center">
              <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-gold mx-auto relative shadow-md bg-black">
                <Image src="/icons/garson-icon.jpg" alt="Icon" fill className="object-cover" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-white text-base">HayalMest Garson Paneli</h3>
                <p className="text-xs text-gold font-medium">Personel: {waiterName}</p>
              </div>
            </div>

            {/* Notification & Vibration Test Card */}
            <div className="p-4 rounded-xl bg-[#121620] border border-white/10 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Vibrate className="w-4 h-4 text-gold" />
                  <span className="font-semibold text-white">Kilit Ekranı &amp; Titreşim</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  pushStatus === 'granted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {pushStatus === 'granted' ? 'Açık' : 'Kapalı'}
                </span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleTestPushNotification}
                  disabled={pushLoading}
                  className="w-full py-3 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <Bell className="w-4 h-4" />
                  <span>Kilit Ekranı Bildirimini Test Et</span>
                </button>
                <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                  Butona bastıktan sonra telefonunuzu kilitleyin; telefonunuz titreyip &ldquo;MASA 4 GARSON İSTİYOR&rdquo; bildirimi gösterecektir.
                </p>
              </div>

              {pushMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-center text-xs font-bold">
                  {pushMsg}
                </div>
              )}
            </div>

            {/* iPhone / PWA Install Guide */}
            <div className="p-4 rounded-xl bg-[#121620] border border-white/10 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Smartphone className="w-4 h-4 text-gold" />
                <span>iPhone / Telefona Yükleme Rehberi</span>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(true)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Nasıl Uygulama Olarak Eklenir? (Rehberi Gör)</span>
              </button>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Garson Oturumunu Kapat</span>
            </button>
          </div>
        )}

      </main>

      {/* 4. IOS INSTALL GUIDE MODAL */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 flex items-end sm:items-center justify-center animate-fadeIn">
          <div className="luxury-card max-w-sm w-full rounded-2xl p-5 border border-gold/50 shadow-2xl space-y-4 bg-[#141824]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold font-serif text-white">iPhone &amp; Telefona Yükle</span>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-gray-300 space-y-3">
              <p className="leading-relaxed">
                Garson panelini gerçek bir mobil uygulama gibi kullanmak ve ekran kilitliyken titreşim almak için:
              </p>
              <div className="space-y-2 p-3 rounded-xl bg-black/40 border border-white/10 text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center flex-shrink-0">1</span>
                  <span>Safari tarayıcısında alt kısımdaki <strong>Paylaş (Yukarı Ok)</strong> butonuna dokunun.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center flex-shrink-0">2</span>
                  <span>Açılan menüde aşağı kaydırıp <strong>&ldquo;Ana Ekrana Ekle&rdquo;</strong> seçeneğini seçin.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center flex-shrink-0">3</span>
                  <span>Ana ekranınıza gelen <strong>HayalMest Garson</strong> logosuna dokunarak açın.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider"
            >
              Anladım
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
