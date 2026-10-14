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
  Download,
  Smartphone,
  Layers
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

  // View state: 'pending' (default) or 'completed' or 'settings'
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

  // 3. Register Service Worker on mount
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
      if (event.data?.type === 'NEW_CALL_ARRIVED' || event.data?.type === 'REFRESH_REQUESTS') {
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
          setPushMsg('✅ Titreşim ve bildirim açıldı!');
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
        setPushMsg('⚠️ Bildirim gönderilemedi. Lütfen "Bildirimleri Aç" butonuna dokunun.');
      }
    } catch (e) {
      setPushMsg('❌ Test gönderiminde hata oluştu.');
    } finally {
      setPushLoading(false);
      setTimeout(() => setPushMsg(''), 6000);
    }
  };

  // 6. Fetch Requests
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

  // Update request status (Complete call)
  const handleCompleteRequest = async (id: string) => {
    setActionLoadingId(id);
    if ('vibrate' in navigator) {
      navigator.vibrate(60);
    }
    try {
      const res = await fetch(`/api/service-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          completedBy: waiterName,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRequests(prev => prev.map(r => r.id === id ? { 
          ...r, 
          status: 'completed',
          completedBy: waiterName,
          completedAt: new Date().toISOString()
        } : r));
      }
    } catch (err) {
      alert('İşlem güncellenemedi');
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
    <div className="min-h-screen bg-[#090C10] text-white flex flex-col justify-between selection:bg-gold selection:text-black">
      
      {/* 1. ULTRA-CLEAN NATIVE APP HEADER (SADECE BİR TEK HEADER) */}
      <header className="sticky top-0 z-40 bg-[#121620] border-b border-gold/30 shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Waiter Brand & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-gold/60 shadow flex-shrink-0 relative bg-black">
              <Image src="/icons/garson-icon.jpg" alt="Icon" fill className="object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-white text-sm">
                  HayalMest Garson
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[11px] text-gold font-medium">
                {waiterName}
              </div>
            </div>
          </div>

          {/* Minimal Controls: Sound, Refresh, Logout */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playNotificationChime();
              }}
              className={`p-2 rounded-xl border text-xs transition-all ${
                soundEnabled
                  ? 'bg-gold/15 text-gold border-gold/40'
                  : 'bg-white/5 text-gray-500 border-white/10'
              }`}
              title={soundEnabled ? 'Sesli Uyarı Açık' : 'Ses Kapalı'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-gold" /> : <VolumeX className="w-4 h-4" />}
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
              className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Push Notification Bar: Only shown if notification permission is NOT granted */}
        {pushStatus !== 'granted' && (
          <div className="bg-gradient-to-r from-amber-950/90 via-[#231A12] to-amber-950/90 border-t border-amber-500/50 px-4 py-2 flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
              <Vibrate className="w-4 h-4 text-amber-400 flex-shrink-0 animate-bounce" />
              <span>Ekran kapalıyken titreşim al:</span>
            </div>
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={pushLoading}
              className="px-3 py-1.5 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider shadow active:scale-95 transition-all"
            >
              {pushLoading ? 'Açılıyor...' : 'İzin Ver'}
            </button>
          </div>
        )}

        {pushMsg && (
          <div className="bg-emerald-950 border-t border-emerald-500/60 px-4 py-2 text-xs text-emerald-300 font-bold text-center animate-fadeIn">
            {pushMsg}
          </div>
        )}
      </header>

      {/* 2. MAIN APP CONTENT (SADE, FERAH VE ANLAŞILIR) */}
      <main className="max-w-md mx-auto w-full px-3.5 py-3.5 flex-1 space-y-3 pb-24">
        
        {/* VIEW TAB 1: ÇAĞRILAR (PENDING CALLS) */}
        {viewTab === 'pending' && (
          <div className="space-y-3 animate-fadeIn">
            
            {/* Simple Segment Switcher */}
            <div className="flex items-center justify-between bg-[#121620] p-1 rounded-2xl border border-meyhane-border text-xs">
              <button
                type="button"
                onClick={() => setViewTab('pending')}
                className="flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 bg-red-600 text-white shadow-md shadow-red-600/30"
              >
                <span>Bekleyen Masalar</span>
                {pendingRequests.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-black/40 text-white text-xs font-mono font-bold">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setViewTab('completed')}
                className="flex-1 py-2.5 rounded-xl font-semibold transition-all text-gray-400 hover:text-white"
              >
                <span>Geçmiş ({completedRequests.length})</span>
              </button>
            </div>

            {/* List of Pending Calls */}
            {loading ? (
              <div className="text-center py-16 space-y-2">
                <RefreshCw className="w-8 h-8 text-gold animate-spin mx-auto" />
                <p className="text-xs text-gray-400">Çağrılar kontrol ediliyor...</p>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="rounded-3xl p-10 text-center border border-meyhane-border/70 space-y-3 bg-[#121620]/90 shadow-xl my-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-serif font-bold text-white">
                  Tüm Masalar Memnun
                </h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                  Şu an bekleyen aktif bir masa çağrısı yok. Masadan garson veya hesap istendiğinde telefonunuz titreyecektir.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => {
                  const isOrder = req.type === 'order';
                  const isBill = req.type === 'bill';
                  const isWater = req.type === 'ice_water';

                  const createdTime = new Date(req.createdAt);
                  const elapsedMinutes = Math.floor((Date.now() - createdTime.getTime()) / 60000);
                  const isUrgent = elapsedMinutes >= 3;

                  return (
                    <div
                      key={req.id}
                      className={`rounded-3xl p-4 sm:p-5 border transition-all relative flex flex-col justify-between shadow-2xl ${
                        isUrgent
                          ? 'bg-gradient-to-b from-red-950/60 via-[#1C1215] to-[#121620] border-red-500 ring-2 ring-red-500/70 shadow-red-950/50'
                          : isOrder
                          ? 'bg-gradient-to-b from-[#241A12] via-[#1A151D] to-[#121620] border-amber-500/80 shadow-amber-950/30'
                          : isBill
                          ? 'bg-gradient-to-b from-[#12241A] via-[#121620] to-[#121620] border-emerald-500/80'
                          : 'bg-gradient-to-b from-[#262012] via-[#161A24] to-[#121620] border-gold/70'
                      }`}
                    >
                      {/* Top Header: Giant Table Name & Type */}
                      <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-3.5 py-1 rounded-xl bg-gold text-black text-base sm:text-lg font-bold font-serif tracking-wide shadow">
                              {req.tableName}
                            </span>
                            {req.sectionName && (
                              <span className="text-xs text-gray-300 font-medium">
                                {req.sectionName}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1.5">
                            <Clock className="w-3.5 h-3.5 text-gold" />
                            <span>{createdTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span className={isUrgent ? 'text-red-400 font-bold animate-pulse' : 'text-gray-300'}>
                              {elapsedMinutes === 0 ? 'Az önce' : `${elapsedMinutes} dk önce`}
                            </span>
                            {isUrgent && (
                              <span className="px-2 py-0.2 rounded bg-red-600 text-white font-bold text-[10px]">
                                ACİL BEKLİYOR!
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Request Title Badge */}
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow ${
                            isOrder
                              ? 'bg-amber-500 text-black'
                              : isBill
                              ? 'bg-emerald-500 text-black'
                              : isWater
                              ? 'bg-cyan-500 text-black'
                              : 'bg-gold text-black'
                          }`}>
                            {isOrder && <Flame className="w-4 h-4" />}
                            {isBill && <CreditCard className="w-4 h-4" />}
                            {!isOrder && !isBill && <Bell className="w-4 h-4" />}
                            <span>{req.title}</span>
                          </span>
                        </div>
                      </div>

                      {/* Middle Body: Orders or Notes */}
                      <div className="space-y-2.5 pb-3">
                        {isOrder && req.items && req.items.length > 0 && (
                          <div className="p-3 rounded-2xl bg-black/50 border border-amber-500/40 text-xs space-y-2">
                            <div className="text-xs font-bold uppercase text-amber-300 flex items-center justify-between border-b border-white/10 pb-1.5">
                              <span>Sipariş Listesi ({req.items.length} Çeşit):</span>
                              {req.totalAmount && (
                                <span className="font-mono text-white text-sm font-bold">
                                  {req.totalAmount.toLocaleString('tr-TR')} ₺
                                </span>
                              )}
                            </div>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {req.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs text-gray-200">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold text-xs flex items-center justify-center">
                                      {it.quantity}
                                    </span>
                                    <span className="font-semibold text-white">{it.name}</span>
                                  </div>
                                  {it.price && (
                                    <span className="font-mono text-gray-400 text-xs">
                                      {(it.price * it.quantity).toLocaleString('tr-TR')} ₺
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {req.note && (
                          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs">
                            <span className="text-[11px] text-amber-400 font-bold uppercase block">Masa Notu:</span>
                            <span className="text-amber-200 font-medium text-xs">&ldquo;{req.note}&rdquo;</span>
                          </div>
                        )}
                      </div>

                      {/* Giant, Fool-proof Action Button */}
                      <button
                        type="button"
                        disabled={actionLoadingId === req.id}
                        onClick={() => handleCompleteRequest(req.id)}
                        className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
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

        {/* VIEW TAB 2: GEÇMİŞ (COMPLETED CALLS) */}
        {viewTab === 'completed' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between bg-[#121620] p-1 rounded-2xl border border-meyhane-border text-xs">
              <button
                type="button"
                onClick={() => setViewTab('pending')}
                className="flex-1 py-2.5 rounded-xl font-semibold transition-all text-gray-400 hover:text-white"
              >
                <span>Bekleyen ({pendingRequests.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setViewTab('completed')}
                className="flex-1 py-2.5 rounded-xl font-bold transition-all bg-emerald-600 text-white shadow"
              >
                <span>Tamamlananlar ({completedRequests.length})</span>
              </button>
            </div>

            {completedRequests.length === 0 ? (
              <div className="rounded-3xl p-10 text-center border border-meyhane-border/70 text-gray-400 text-xs bg-[#121620]">
                Henüz tamamlanmış bir masa çağrısı bulunmuyor.
              </div>
            ) : (
              <div className="space-y-2">
                {completedRequests.slice(0, 20).map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-2xl bg-[#121620] border border-meyhane-border/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-serif">{req.tableName}</span>
                        <span className="text-gray-400 text-[11px]">• {req.title}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {req.completedAt ? new Date(req.completedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''} tarihinde tamamlandı
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
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
            <div className="p-4 rounded-3xl bg-[#121620] border border-gold/40 shadow-xl space-y-3 text-center">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gold mx-auto relative shadow-lg bg-black">
                <Image src="/icons/garson-icon.jpg" alt="Icon" fill className="object-cover" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-white text-base">HayalMest Garson Paneli</h3>
                <p className="text-xs text-gold font-medium">Giriş Yapan: {waiterName}</p>
              </div>
            </div>

            {/* Notification & Vibration Test Card */}
            <div className="p-4 rounded-2xl bg-[#121620] border border-meyhane-border space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <Vibrate className="w-4 h-4 text-gold" />
                  <span className="font-semibold text-white">Kilit Ekranı &amp; Titreşim</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  pushStatus === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {pushStatus === 'granted' ? 'Açık' : 'Kapalı'}
                </span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleTestPushNotification}
                  disabled={pushLoading}
                  className="w-full py-3 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95"
                >
                  <Bell className="w-4 h-4" />
                  <span>Kilit Ekranı Bildirimini Test Et</span>
                </button>
                <p className="text-[11px] text-gray-400 text-center">
                  Butona bastıktan sonra telefonunuzu kilitleyin; telefon titreyip &ldquo;MASA 4 GARSON İSTİYOR&rdquo; bildirimi gösterecektir.
                </p>
              </div>

              {pushMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-300 text-center text-xs font-bold">
                  {pushMsg}
                </div>
              )}
            </div>

            {/* iPhone / PWA Install Guide */}
            <div className="p-4 rounded-2xl bg-[#121620] border border-meyhane-border space-y-2.5 text-xs">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Smartphone className="w-4 h-4 text-gold" />
                <span>iPhone / Telefona Yükleme Rehberi</span>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(true)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <span>Nasıl Uygulama Yapılır? (Rehberi Gör)</span>
              </button>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 rounded-2xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Garson Oturumunu Kapat</span>
            </button>
          </div>
        )}

      </main>

      {/* 3. MINIMAL 2-TAB BOTTOM DOCK (HERKESİN KULLANABİLECEĞİ KADAR BASİT) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#121620]/95 backdrop-blur-2xl border-t border-gold/40 shadow-[0_-8px_25px_rgba(0,0,0,0.85)]">
        <div className="max-w-md mx-auto grid grid-cols-2 px-4 py-2 text-center">
          
          {/* Tab 1: Çağrılar */}
          <button
            type="button"
            onClick={() => setViewTab('pending')}
            className={`py-2 rounded-2xl transition-all flex flex-col items-center justify-center relative ${
              viewTab === 'pending' || viewTab === 'completed' ? 'text-gold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${viewTab === 'pending' ? 'bg-gold/15 scale-110' : ''}`}>
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold mt-0.5">Masa Çağrıları</span>
            {pendingRequests.length > 0 && (
              <span className="absolute top-0.5 right-10 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold font-mono animate-bounce">
                {pendingRequests.length}
              </span>
            )}
          </button>

          {/* Tab 2: Ayarlar & Test */}
          <button
            type="button"
            onClick={() => setViewTab('settings')}
            className={`py-2 rounded-2xl transition-all flex flex-col items-center justify-center ${
              viewTab === 'settings' ? 'text-gold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${viewTab === 'settings' ? 'bg-gold/15 scale-110' : ''}`}>
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold mt-0.5">Ayarlar &amp; Test</span>
          </button>

        </div>
      </nav>

      {/* 4. IOS INSTALL GUIDE MODAL */}
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
