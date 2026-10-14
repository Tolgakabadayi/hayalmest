'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Check, 
  X, 
  Clock, 
  CreditCard, 
  AlertCircle, 
  Sparkles,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { playNotificationChime } from '@/lib/audioNotification';

export interface ServiceRequestItem {
  id: string;
  tableId: string;
  tableName: string;
  sectionId?: string;
  sectionName?: string;
  type: 'waiter' | 'ice_water' | 'bill' | 'cutlery' | 'custom';
  title: string;
  note?: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export default function ServiceRequestsLiveFeed() {
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Keep track of previously seen request IDs to only chime on new ones
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/service-requests');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const fetched: ServiceRequestItem[] = json.data;
        setRequests(fetched);

        // Check for new pending requests
        const pendingOnes = fetched.filter(r => r.status === 'pending');
        let hasNewPending = false;

        for (const req of pendingOnes) {
          if (!seenIdsRef.current.has(req.id)) {
            seenIdsRef.current.add(req.id);
            if (!initialLoadRef.current) {
              hasNewPending = true;
            }
          }
        }

        if (initialLoadRef.current) {
          initialLoadRef.current = false;
        } else if (hasNewPending && soundEnabled) {
          playNotificationChime();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      }
    } catch (err) {
      console.error('Service requests poll error:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const handleComplete = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/service-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      const json = await res.json();
      if (json.success) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r));
      }
    } catch (err) {
      console.error('Complete error:', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const recentCompleted = requests.filter(r => r.status === 'completed').slice(0, 5);

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Az önce';
    if (mins < 60) return `${mins} dk önce`;
    return `${Math.floor(mins / 60)} saat önce`;
  };

  return (
    <div className="relative">
      {/* Trigger Button in Header Bar */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border shadow-sm ${
            pendingRequests.length > 0
              ? 'bg-gradient-to-r from-amber-500/25 to-red-500/25 border-amber-500/60 text-amber-200 animate-pulse'
              : 'bg-white/5 hover:bg-white/10 border-meyhane-border text-gray-300'
          }`}
          title="Masa Servis & Çağrı Paneli"
        >
          <div className="relative">
            <Bell className={`w-3.5 h-3.5 ${pendingRequests.length > 0 ? 'text-amber-400' : 'text-gold'}`} />
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </div>
          <span className="hidden sm:inline">Masa Çağrıları</span>
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {pendingRequests.length}
            </span>
          )}
        </button>

        {/* Sound toggle button */}
        <button
          type="button"
          onClick={() => {
            setSoundEnabled(!soundEnabled);
            if (!soundEnabled) playNotificationChime();
          }}
          className={`p-1.5 rounded-xl border text-xs transition-colors ${
            soundEnabled
              ? 'bg-gold/15 border-gold/40 text-gold hover:bg-gold/25'
              : 'bg-white/5 border-meyhane-border text-gray-500 hover:text-gray-300'
          }`}
          title={soundEnabled ? 'Sesli Uyarı Açık (Tıkla ve Kapat)' : 'Sesli Uyarı Kapalı (Tıkla ve Aç)'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Dropdown / Slide-down Modal */}
      {isOpen && (
        <>
          <div 
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" 
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 luxury-card rounded-2xl p-4 border border-gold/40 shadow-2xl bg-[#141824]/98 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-meyhane-border/70 pb-2.5">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold font-serif text-white uppercase tracking-wider">
                  Masa Çağrıları &amp; Talepler
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pending Requests List */}
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-none">
              {pendingRequests.length > 0 ? (
                pendingRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-[#1A2030] to-[#141824] border border-amber-500/50 shadow-md space-y-2 animate-fadeIn"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-gold text-black text-xs font-bold">
                            {req.tableName}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {req.title}
                          </span>
                        </div>
                        {req.sectionName && (
                          <div className="text-[10px] text-meyhane-muted mt-0.5">
                            {req.sectionName}
                          </div>
                        )}
                        {req.note && (
                          <div className="text-[11px] text-amber-300 font-medium mt-1">
                            Not: {req.note}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-amber-400/90 whitespace-nowrap font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(req.createdAt)}
                      </span>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleComplete(req.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Masaya Gidildi (Kapat)</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-gray-400 space-y-1">
                  <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                  <div className="text-white font-semibold">Aktif Masa Çağrısı Yok</div>
                  <div className="text-[11px] text-meyhane-muted">Masalardan garson veya hesap çağrıldığında burada sesli görünecektir.</div>
                </div>
              )}
            </div>

            {/* Recently Completed */}
            {recentCompleted.length > 0 && (
              <div className="pt-2 border-t border-meyhane-border/70">
                <span className="text-[10px] uppercase tracking-wider text-meyhane-muted font-bold block mb-1.5">
                  Son Tamamlananlar
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-none">
                  {recentCompleted.map(c => (
                    <div
                      key={c.id}
                      className="p-1.5 rounded-lg bg-white/5 text-[11px] text-gray-400 flex items-center justify-between"
                    >
                      <span>{c.tableName} - {c.title}</span>
                      <span className="text-[10px] text-emerald-400 font-medium">Tamamlandı</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
