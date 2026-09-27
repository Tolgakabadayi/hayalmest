'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  Phone, 
  MessageCircle, 
  Trash2, 
  RefreshCw,
  Plus,
  Utensils,
  Wine,
  Music,
  Camera,
  Settings,
  LogOut,
  Edit2,
  Lock,
  Layers,
  Save,
  X,
  Eye,
  Palette,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Crown,
  UserCheck
} from 'lucide-react';
import { Reservation } from '@/lib/storage';
import { ALL_TABLES, VENUE_SECTIONS, TableItem } from '@/data/tablesData';
import { StageEvent } from '@/data/eventsData';
import { MenuItem, MENU_CATEGORIES } from '@/data/menuData';
import { formatTableDisplay } from '@/lib/formatters';
import ReservationDetailModal from '@/components/ReservationDetailModal';
import FloorPlanDesigner from '@/components/FloorPlanDesigner';
import { VenueElement } from '@/lib/tablesStorage';

export default function AdminPage() {
  const router = useRouter();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'reservations' | 'floor' | 'designer' | 'events' | 'menu' | 'content' | 'settings'>('reservations');

  // Reservations state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Modals & Floor inspection state
  const [selectedReservationModal, setSelectedReservationModal] = useState<Reservation | null>(null);
  const [selectedFloorTable, setSelectedFloorTable] = useState<TableItem | null>(null);
  const [floorDate, setFloorDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Dynamic tables & elements
  const [tablesList, setTablesList] = useState<TableItem[]>(ALL_TABLES);
  const [venueElements, setVenueElements] = useState<VenueElement[]>([]);

  // Events state
  const [events, setEvents] = useState<StageEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<StageEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Menu state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);

  // Content state
  const [siteContent, setSiteContent] = useState<any>(null);
  const [contentSaving, setContentSaving] = useState(false);

  // Password change state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMessage, setPwMessage] = useState('');

  // Manual Reservation Modal
  const [showAddResModal, setShowAddResModal] = useState(false);
  const [newRes, setNewRes] = useState({
    fullName: '',
    phone: '',
    email: '',
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    serviceType: 'Canlı Fasıl Akşamı',
    guestCount: 4,
    occasion: 'Arkadaş Buluşması',
    sectionId: 'salon' as 'vip_sahne' | 'salon' | 'bahce' | 'loca',
    tableId: 's-1',
    packageId: 'premium_fix' as const,
    specialRequests: '',
  });

  // Auth Verification
  useEffect(() => {
    const token = localStorage.getItem('hayalmest_admin_token');
    if (!token) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Initial Data Fetching
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [resRes, eventsRes, menuRes, contentRes, tablesRes] = await Promise.all([
        fetch('/api/reservations').then(r => r.json()).catch(() => ({})),
        fetch('/api/events').then(r => r.json()).catch(() => ({})),
        fetch('/api/menu').then(r => r.json()).catch(() => ({})),
        fetch('/api/content').then(r => r.json()).catch(() => ({})),
        fetch('/api/tables').then(r => r.json()).catch(() => ({})),
      ]);

      if (resRes?.success) setReservations(resRes.data);
      if (eventsRes?.success) setEvents(eventsRes.data);
      if (menuRes?.success) setMenuItems(menuRes.items);
      if (contentRes?.success) setSiteContent(contentRes.data);
      if (tablesRes?.success) {
        if (tablesRes.tables?.length) setTablesList(tablesRes.tables);
        if (tablesRes.elements?.length) setVenueElements(tablesRes.elements);
      }
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Table Change handler for ReservationDetailModal
  const handleTableChange = async (id: string, newTableId: string, newSectionId?: any) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: newTableId, sectionId: newSectionId }),
      });
      const json = await res.json();
      if (json.success) {
        setReservations(prev => prev.map(r => r.id === id ? { ...r, tableId: newTableId, sectionId: newSectionId || r.sectionId } : r));
        if (selectedReservationModal && selectedReservationModal.id === id) {
          setSelectedReservationModal(prev => prev ? { ...prev, tableId: newTableId, sectionId: newSectionId || prev.sectionId } : null);
        }
      }
    } catch (err) {
      alert('Masa güncellenirken hata oluştu');
    }
  };

  // Save venue layout from FloorPlanDesigner
  const handleSaveVenueLayout = async (newTables: TableItem[], newElements: VenueElement[]) => {
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_layout', tables: newTables, elements: newElements }),
      });
      const json = await res.json();
      if (json.success) {
        setTablesList(newTables);
        setVenueElements(newElements);
        alert('Salon yerleşimi ve masa planı başarıyla kaydedildi!');
      } else {
        alert(json.error || 'Kaydetme hatası');
      }
    } catch (err) {
      alert('Kaydetme sırasında bir hata meydana geldi');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('hayalmest_admin_token');
    router.push('/admin/login');
  };

  // Status changes for reservations
  const handleStatusChange = async (id: string, newStatus: Reservation['status']) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      alert('Durum güncellenirken hata oluştu');
    }
  };

  const handleDeleteReservation = async (id: string) => {
    if (!confirm('Bu rezervasyonu silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setReservations(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      alert('Silme işlemi başarısız');
    }
  };

  // Event handlers
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      const isNew = !editingEvent.id || editingEvent.id.startsWith('new-');
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch('/api/events', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEvent),
      });
      const json = await res.json();
      if (json.success) {
        if (isNew) {
          setEvents(prev => [...prev, json.data]);
        } else {
          setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? json.data : ev));
        }
        setShowEventModal(false);
        setEditingEvent(null);
      } else {
        alert(json.error || 'Etkinlik kaydedilemedi');
      }
    } catch (err) {
      alert('Hata oluştu');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/events?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setEvents(prev => prev.filter(ev => ev.id !== id));
      }
    } catch (err) {
      alert('Silme başarısız');
    }
  };

  // Menu handlers
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenuItem) return;

    try {
      const isNew = !editingMenuItem.id || editingMenuItem.id.startsWith('new-');
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch('/api/menu', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMenuItem),
      });
      const json = await res.json();
      if (json.success) {
        if (isNew) {
          setMenuItems(prev => [...prev, json.data]);
        } else {
          setMenuItems(prev => prev.map(m => m.id === editingMenuItem.id ? json.data : m));
        }
        setShowMenuModal(false);
        setEditingMenuItem(null);
      } else {
        alert(json.error || 'Ürün kaydedilemedi');
      }
    } catch (err) {
      alert('Hata oluştu');
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Bu menü ürününü silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/menu?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setMenuItems(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      alert('Silme başarısız');
    }
  };

  // Site content save
  const handleSaveContent = async () => {
    setContentSaving(true);
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteContent),
      });
      const json = await res.json();
      if (json.success) {
        alert('Site içerikleri ve fotoğraflar başarıyla kaydedildi!');
      }
    } catch (err) {
      alert('Kaydetme hatası');
    } finally {
      setContentSaving(false);
    }
  };

  // Password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const json = await res.json();
      if (json.success) {
        setPwMessage('Parola başarıyla değiştirildi!');
        setCurrentPw('');
        setNewPw('');
      } else {
        setPwMessage(`Hata: ${json.error}`);
      }
    } catch (err) {
      setPwMessage('Parola değiştirilemedi');
    }
  };

  if (!isAuthenticated) {
    return <div className="p-12 text-center text-gold">Yükleniyor...</div>;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Stats
  const totalCount = reservations.length;
  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;
  const todayGuests = reservations
    .filter(r => r.date === todayStr && r.status !== 'cancelled')
    .reduce((acc, curr) => acc + curr.guestCount, 0);

  // Helper to generate 7 days of the week with reservation counts
  const getWeekDays = () => {
    const days = [];
    const curr = new Date();
    const dayOfWeek = curr.getDay(); // 0 is Sunday, 1 is Monday...
    const mondayDiff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + mondayDiff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('tr-TR', { weekday: 'short' });
      const dayDisplay = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
      const resCount = reservations.filter(r => r.date === dateStr && r.status !== 'cancelled').length;
      const guestTotal = reservations
        .filter(r => r.date === dateStr && r.status !== 'cancelled')
        .reduce((acc, curr) => acc + curr.guestCount, 0);
      days.push({ dateStr, dayName, dayDisplay, resCount, guestTotal, isToday: dateStr === todayStr });
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Filtered reservations
  const filtered = reservations.filter(r => {
    const matchesSearch = 
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone.includes(searchTerm) ||
      r.pnr.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesDate = 
      dateFilter === 'all' ||
      (dateFilter === 'today' && r.date === todayStr) ||
      (dateFilter === 'upcoming' && r.date >= todayStr) ||
      (dateFilter === 'specific' && r.date === selectedDate);

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-meyhane-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-gold font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" />
            HayalMest Yönetim &amp; CMS Paneli
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white">
            Kontrol &amp; Karşılama Masası
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchAllData}
            className="p-2.5 rounded-xl bg-meyhane-surface border border-meyhane-border text-gray-300 hover:text-white transition-colors"
            title="Tüm Verileri Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-gold' : ''}`} />
          </button>

          <Link
            href="/host"
            className="px-3.5 py-2.5 rounded-xl bg-meyhane-surface hover:bg-gold/15 border border-gold/40 text-gold text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
            title="Host & Karşılama Masası (Kapı Masa Bulucu)"
          >
            <UserCheck className="w-4 h-4" />
            <span>Host Masası</span>
          </Link>

          <button
            onClick={() => setShowAddResModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 flex items-center gap-1.5 shadow-lg shadow-gold/20"
          >
            <Plus className="w-4 h-4" />
            <span>Telefonla Rezervasyon</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 hover:bg-red-900/50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Çıkış</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-meyhane-surface border border-meyhane-border space-y-1">
          <div className="text-xs text-meyhane-muted uppercase tracking-wider">Bugün Beklenen Misafir</div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-gold">{todayGuests} Kişi</div>
          <div className="text-[11px] text-gray-400">Aktif masalar toplamı</div>
        </div>

        <div className="p-5 rounded-2xl bg-meyhane-surface border border-meyhane-border space-y-1">
          <div className="text-xs text-meyhane-muted uppercase tracking-wider">Onay Bekleyenler</div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-amber-400">{pendingCount}</div>
          <div className="text-[11px] text-gray-400">Teyit bekleyen misafir</div>
        </div>

        <div className="p-5 rounded-2xl bg-meyhane-surface border border-meyhane-border space-y-1">
          <div className="text-xs text-meyhane-muted uppercase tracking-wider">Aktif Canlı Etkinlikler</div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-emerald-400">{events.length}</div>
          <div className="text-[11px] text-gray-400">Haftalık sahne programı</div>
        </div>

        <div className="p-5 rounded-2xl bg-meyhane-surface border border-meyhane-border space-y-1">
          <div className="text-xs text-meyhane-muted uppercase tracking-wider">Kayıtlı Menü Ürünü</div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-white">{menuItems.length}</div>
          <div className="text-[11px] text-gray-400">Meze, kebap ve içkiler</div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-meyhane-surface border border-meyhane-border">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'reservations' ? 'bg-gold text-black shadow-md' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Rezervasyonlar ({reservations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('floor')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'floor' ? 'bg-gold text-black shadow-md' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Kuşbakışı Masa Durumu</span>
        </button>

        <button
          onClick={() => setActiveTab('designer')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'designer' ? 'bg-gold text-black shadow-md' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>🎨 Salon Tasarımcısı</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'events' ? 'bg-gold text-black shadow-md' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Sahne &amp; Etkinlik Yönetimi ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'menu' ? 'bg-gold text-black shadow-md' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Menü &amp; Fiyat Yönetimi</span>
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'content' ? 'bg-gold text-black shadow-md' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Fotoğraf &amp; Hero Yönetimi</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'settings' ? 'bg-gold text-black shadow-md' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Site Ayarları &amp; Şifre</span>
        </button>
      </div>

      {/* TAB 1: REZERVASYONLAR */}
      {activeTab === 'reservations' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Weekly Date Navigation Strip */}
          <div className="p-4 rounded-2xl bg-meyhane-surface border border-meyhane-border space-y-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-white font-semibold">
                <CalendarDays className="w-4 h-4 text-gold" />
                <span>Haftalık &amp; Günlük Rezervasyon Takvimi</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDateFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    dateFilter === 'all'
                      ? 'bg-gold text-black shadow-md'
                      : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Tüm Tarihler ({reservations.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateFilter('today');
                    setSelectedDate(todayStr);
                    setFloorDate(todayStr);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    dateFilter === 'today'
                      ? 'bg-amber-500 text-black shadow-md font-bold'
                      : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Bugün
                </button>
                <div className="flex items-center gap-1.5 bg-meyhane-bg px-2.5 py-1 rounded-xl border border-meyhane-border">
                  <span className="text-[11px] text-meyhane-muted">Tarihe Git:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setFloorDate(e.target.value);
                      setDateFilter('specific');
                    }}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 7-day strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
              {weekDays.map((day) => {
                const isSelected = dateFilter === 'specific' && selectedDate === day.dateStr;
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(day.dateStr);
                      setFloorDate(day.dateStr);
                      setDateFilter('specific');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-gold text-black border-gold shadow-lg ring-2 ring-gold/40'
                        : day.isToday
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 hover:bg-amber-500/25'
                        : 'bg-meyhane-bg/60 border-meyhane-border text-gray-300 hover:border-gold/40 hover:bg-white/5'
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider">{day.dayName}</div>
                    <div className="text-xs font-semibold">{day.dayDisplay}</div>
                    <div className="mt-1 flex items-center justify-center gap-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? 'bg-black text-gold'
                          : day.resCount > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/5 text-gray-400'
                      }`}>
                        {day.resCount} Rez ({day.guestTotal}p)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="İsim, telefon veya PNR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-meyhane-surface border border-meyhane-border pl-9 pr-3 py-2 rounded-xl text-xs text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-meyhane-surface border border-meyhane-border px-3 py-2 rounded-xl text-xs text-white focus:border-gold focus:outline-none cursor-pointer"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="pending">Onay Bekleyen</option>
                <option value="confirmed">Onaylandı</option>
                <option value="seated">Masada</option>
                <option value="cancelled">İptal Edildi</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-meyhane-surface border border-meyhane-border px-3 py-2 rounded-xl text-xs text-white focus:border-gold focus:outline-none cursor-pointer"
              >
                <option value="all">Tüm Tarihler</option>
                <option value="today">Sadece Bugün</option>
                <option value="upcoming">Bugün ve Gelecek</option>
                {dateFilter === 'specific' && (
                  <option value="specific">Seçili Tarih: {selectedDate}</option>
                )}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="luxury-card rounded-2xl border border-meyhane-border overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-meyhane-surface/90 text-gray-400 uppercase tracking-wider border-b border-meyhane-border font-medium">
                  <tr>
                    <th className="py-3.5 px-4">PNR &amp; Misafir</th>
                    <th className="py-3.5 px-4">Tarih / Saat</th>
                    <th className="py-3.5 px-4">Kişi &amp; Masa</th>
                    <th className="py-3.5 px-4">Menü &amp; Not</th>
                    <th className="py-3.5 px-4">Durum</th>
                    <th className="py-3.5 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-meyhane-border/50 text-gray-300">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        Bu filtreye uygun rezervasyon bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((res) => {
                      const isToday = res.date === todayStr;

                      return (
                        <tr 
                          key={res.id} 
                          onClick={() => setSelectedReservationModal(res)}
                          className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                          title="Detaylı bilgi ve masa değişikliği için tıklayın"
                        >
                          <td className="py-4 px-4 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-gold group-hover:underline">
                                {res.pnr}
                              </span>
                              {isToday && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                  BUGÜN
                                </span>
                              )}
                            </div>
                            <div className="font-semibold text-white text-sm">{res.fullName}</div>
                            <div className="flex items-center gap-2">
                              <a 
                                href={`tel:${res.phone}`} 
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-gold flex items-center gap-1 text-[11px] text-meyhane-muted"
                              >
                                <Phone className="w-3 h-3 text-gold" />
                                {res.phone}
                              </a>
                            </div>
                          </td>

                          <td className="py-4 px-4 space-y-1">
                            <div className="font-semibold text-white">{res.date}</div>
                            <div className="text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gold" />
                              <span>{res.time}</span>
                            </div>
                            <div className="text-[10px] text-meyhane-muted">{res.serviceType}</div>
                          </td>

                          <td className="py-4 px-4 space-y-1">
                            <div className="font-bold text-white text-sm">{res.guestCount} Kişi</div>
                            <div className="text-gold text-[11px] font-semibold">
                              {formatTableDisplay(res.tableId, res.sectionId)}
                            </div>
                            <div className="text-[10px] text-gray-400">{res.occasion}</div>
                          </td>

                          <td className="py-4 px-4 max-w-xs space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded bg-white/5 border border-meyhane-border text-[10px] font-medium text-gray-300">
                              {res.packageId === 'premium_fix' ? 'Premium Rakı Menü' : res.packageId === 'standart_fix' ? 'Klasik Fiks' : 'A La Carte'}
                            </span>
                            {res.specialRequests && (
                              <p className="text-[11px] text-amber-200/90 italic line-clamp-2">
                                &ldquo;{res.specialRequests}&rdquo;
                              </p>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              res.status === 'confirmed'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : res.status === 'pending'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : res.status === 'seated'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : 'bg-red-500/15 text-red-400 border border-red-500/30'
                            }`}>
                              {res.status === 'confirmed' && 'Onaylandı'}
                              {res.status === 'pending' && 'Onay Bekliyor'}
                              {res.status === 'seated' && 'Masada'}
                              {res.status === 'cancelled' && 'İptal'}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-right space-x-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReservationModal(res);
                              }}
                              className="inline-flex p-1.5 rounded-lg bg-gold/15 text-gold hover:bg-gold hover:text-black transition-colors"
                              title="Tüm Detayları Gör & Düzenle"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <a
                              href={`https://wa.me/90${res.phone.replace(/[^0-9]/g, '').replace(/^0/, '')}?text=Merhaba%20Say%C4%B1n%20${encodeURIComponent(res.fullName)},%20HayalMest%20Anadolu%20Meyhanesi%20${res.date}%20tarihli%20saat%20${res.time}%20i%C3%A7in%20%23${res.pnr}%20kodlu%20${res.guestCount}%20ki%C5%9Filik%20rezervasyonunuz%20onaylanm%C4%B1%C5%9Ft%C4%B1r.%20Sizi%20a%C4%9F%C4%B1rlamaktan%20mutluluk%20duyaca%C4%9F%C4%B1z!`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors"
                              title="WhatsApp Onay Mesajı Gönder"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>

                            {res.status !== 'confirmed' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(res.id, 'confirmed');
                                }}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-400 transition-colors"
                                title="Onayla"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {res.status !== 'seated' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(res.id, 'seated');
                                }}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-gray-300 hover:text-blue-400 transition-colors"
                                title="Masaya Oturdu"
                              >
                                <Utensils className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {res.status !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(res.id, 'cancelled');
                                }}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-300 hover:text-amber-400 transition-colors"
                                title="İptal Et"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteReservation(res.id);
                              }}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                              title="Kaydı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KUŞBAKIŞI SALON DURUMU */}
      {activeTab === 'floor' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Floor Date & Controls Header */}
          <div className="p-4 rounded-2xl bg-meyhane-surface border border-gold/30 flex flex-wrap items-center justify-between gap-4 text-xs shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gold font-semibold flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                İncelenen Tarih:
              </span>
              <input
                type="date"
                value={floorDate}
                onChange={(e) => setFloorDate(e.target.value)}
                className="bg-meyhane-bg border border-meyhane-border px-3 py-1.5 rounded-xl text-white font-medium focus:border-gold focus:outline-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setFloorDate(todayStr)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  floorDate === todayStr ? 'bg-gold text-black shadow-md' : 'bg-white/5 text-gray-300 hover:text-white'
                }`}
              >
                Bugün
              </button>
              
              {/* Quick day counters */}
              {(() => {
                const dayReservations = reservations.filter(r => r.date === floorDate && r.status !== 'cancelled');
                const dayGuests = dayReservations.reduce((acc, curr) => acc + curr.guestCount, 0);
                const occupiedCount = dayReservations.length;
                const totalTblCount = tablesList.length;
                const availableCount = Math.max(0, totalTblCount - occupiedCount);

                return (
                  <span className="text-gray-300 bg-white/5 px-3 py-1.5 rounded-xl border border-meyhane-border/70 flex items-center gap-2">
                    <span><strong className="text-gold">{occupiedCount}</strong> Dolu</span>
                    <span>•</span>
                    <span><strong className="text-emerald-400">{availableCount}</strong> Müsait</span>
                    <span>•</span>
                    <span><strong className="text-white">{dayGuests}</strong> Misafir</span>
                  </span>
                );
              })()}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span> Müsait
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span> Rezerve
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span> Masada
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('designer')}
                className="px-3.5 py-2 rounded-xl bg-gold/15 border border-gold/40 text-gold hover:bg-gold hover:text-black font-semibold flex items-center gap-1.5 transition-all shadow-md"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Salon Tasarımcısı</span>
              </button>
            </div>
          </div>

          {/* Floor Plan Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {VENUE_SECTIONS.map((sec) => {
              const secTables = tablesList.filter(t => t.sectionId === sec.id);
              const displayTables = secTables.length > 0 ? secTables : sec.tables;

              return (
                <div
                  key={sec.id}
                  className="luxury-card p-6 rounded-3xl border border-meyhane-border space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-meyhane-border/70 pb-3">
                    <div>
                      <h2 className="text-base font-bold font-serif text-white">{sec.name}</h2>
                      <span className="text-[11px] text-meyhane-muted">{sec.shortDesc}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-gold/15 text-gold text-xs font-semibold">
                      {sec.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {displayTables.map((tbl) => {
                      const matchedRes = reservations.find(
                        r => r.date === floorDate && 
                             r.status !== 'cancelled' && 
                             (r.tableId === tbl.id || (r.tableId && r.tableId.includes(tbl.id)))
                      );

                      const isOccupied = !!matchedRes;
                      const isSeated = matchedRes?.status === 'seated';

                      return (
                        <button
                          type="button"
                          key={tbl.id}
                          onClick={() => setSelectedFloorTable(tbl)}
                          className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all w-full cursor-pointer hover:scale-[1.03] active:scale-95 group ${
                            isSeated
                              ? 'bg-blue-950/40 border-blue-500/60 text-blue-200 shadow-md ring-1 ring-blue-500/40'
                              : isOccupied
                              ? 'bg-amber-950/30 border-amber-500/60 text-amber-200 shadow-md ring-1 ring-amber-500/40'
                              : 'bg-meyhane-bg/70 border-emerald-500/30 text-gray-300 hover:border-emerald-500/70 hover:bg-emerald-950/20'
                          }`}
                          title="Masa ve misafir detayları için tıklayın"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs group-hover:text-gold transition-colors">
                              {tbl.number}
                            </span>
                            <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                              isSeated
                                ? 'bg-blue-500/30 text-blue-200'
                                : isOccupied
                                ? 'bg-amber-500/30 text-amber-200'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {isSeated ? 'Masada' : isOccupied ? 'Dolu' : 'Boş'}
                            </span>
                          </div>
                          <div className="text-[10px] text-meyhane-muted">
                            Kapasite: {tbl.capacity} Kişi
                          </div>
                          {matchedRes ? (
                            <div className="text-[11px] font-semibold text-white pt-1 border-t border-white/10 truncate flex items-center justify-between">
                              <span className="truncate">{matchedRes.fullName}</span>
                              <span className="text-[10px] text-gold font-mono ml-1">{matchedRes.time}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-400 pt-1 border-t border-emerald-500/20 flex items-center justify-between">
                              <span>✓ Boş / Müsait</span>
                              <span className="text-[9px] text-gray-500 group-hover:text-gold">İncele &gt;</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: SALON TASARIMCISI (DRAG & DROP WORKSPACE) */}
      {activeTab === 'designer' && (
        <div className="space-y-6 animate-fadeIn">
          <FloorPlanDesigner
            initialTables={tablesList}
            initialElements={venueElements}
            onSave={handleSaveVenueLayout}
          />
        </div>
      )}

      {/* TAB 3: SAHNE & ETKİNLİK YÖNETİMİ (USER REQUESTED: ADD ARTISTS, BIOS, POSTERS, DATES) */}
      {activeTab === 'events' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-serif text-white">Canlı Sahne &amp; Etkinlik Takvimi</h2>
              <p className="text-xs text-gray-400">Yeni konser, fasıl gecesi veya sanatçı ekleyin; sitede anında canlıya geçsin.</p>
            </div>
            <button
              onClick={() => {
                setEditingEvent({
                  id: `new-${Date.now()}`,
                  title: '',
                  performer: '',
                  genre: 'fasıl',
                  genreLabel: 'Canlı Fasıl',
                  day: 'Her Cuma',
                  time: '20:30 - 00:30',
                  dateStr: 'Haftalık Düzenli',
                  badge: 'Yeni Program',
                  description: '',
                  image: '/assets/Hayalmest-sahne.jpg'
                });
                setShowEventModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Etkinlik / Sanatçı Ekle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="luxury-card rounded-2xl overflow-hidden border border-meyhane-border flex flex-col justify-between"
              >
                <div className="relative h-44 w-full">
                  <Image src={ev.image} alt={ev.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-gold text-black text-[10px] font-bold">
                    {ev.genreLabel}
                  </span>
                  <span className="absolute bottom-3 left-3 text-xs text-gold-300 font-medium bg-black/60 px-2 py-0.5 rounded">
                    {ev.day}
                  </span>
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold font-serif text-white">{ev.title}</h3>
                    <div className="text-xs font-semibold text-gold">{ev.performer}</div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{ev.description}</p>
                    <div className="text-[11px] text-meyhane-muted flex items-center gap-1 pt-1">
                      <Clock className="w-3.5 h-3.5 text-gold" />
                      <span>{ev.time}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-meyhane-border/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setEditingEvent(ev);
                        setShowEventModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-gold hover:text-black text-gray-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Düzenle</span>
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors"
                      title="Etkinliği Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MENÜ & FİYAT YÖNETİMİ */}
      {activeTab === 'menu' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-serif text-white">Lezzet Menüsü &amp; Fiyat Düzenleme</h2>
              <p className="text-xs text-gray-400">Ürün fiyatlarını anında güncelleyin, yeni meze veya içki ekleyin.</p>
            </div>
            <button
              onClick={() => {
                setEditingMenuItem({
                  id: `new-${Date.now()}`,
                  name: '',
                  category: 'mezeler',
                  price: 300,
                  description: '',
                  badge: '',
                  image: '/assets/Hayamest-Mezeler.jpg'
                });
                setShowMenuModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Ürün Ekle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="luxury-card p-4 rounded-2xl border border-meyhane-border flex items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm font-serif">{item.name}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold/15 text-gold font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gold font-bold">{item.price.toLocaleString('tr-TR')} TL</div>
                  <div className="text-[10px] text-meyhane-muted capitalize">
                    {MENU_CATEGORIES.find(c => c.id === item.category)?.label || item.category}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingMenuItem(item);
                      setShowMenuModal(true);
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-gold hover:text-black text-gray-300 transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMenuItem(item.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: FOTOĞRAF & HERO YÖNETİMİ */}
      {activeTab === 'content' && siteContent && (
        <div className="luxury-card p-6 sm:p-8 rounded-3xl border border-meyhane-border space-y-8 animate-fadeIn">
          <div>
            <h2 className="text-lg font-bold font-serif text-white">Ana Sayfa &amp; Fotoğraf Yönetimi</h2>
            <p className="text-xs text-gray-400">Hero banner metinlerini ve ana görseli doğrudan buradan güncelleyebilirsiniz.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-gray-300 font-semibold uppercase tracking-wider">Hero Başlığı</label>
              <input
                type="text"
                value={siteContent.hero?.title || ''}
                onChange={(e) => setSiteContent({
                  ...siteContent,
                  hero: { ...siteContent.hero, title: e.target.value }
                })}
                className="w-full bg-meyhane-bg border border-meyhane-border p-3 rounded-xl text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold uppercase tracking-wider">Hero Alt Başlığı</label>
              <input
                type="text"
                value={siteContent.hero?.subtitle || ''}
                onChange={(e) => setSiteContent({
                  ...siteContent,
                  hero: { ...siteContent.hero, subtitle: e.target.value }
                })}
                className="w-full bg-meyhane-bg border border-meyhane-border p-3 rounded-xl text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold uppercase tracking-wider">Hero Arka Plan Görseli</label>
              <input
                type="text"
                value={siteContent.hero?.backgroundImage || ''}
                onChange={(e) => setSiteContent({
                  ...siteContent,
                  hero: { ...siteContent.hero, backgroundImage: e.target.value }
                })}
                placeholder="/assets/HayalMest-Meyhanesi-Bostanci-1.jpg"
                className="w-full bg-meyhane-bg border border-meyhane-border p-3 rounded-xl text-white focus:border-gold focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-gray-300 font-semibold uppercase tracking-wider">Hero Açıklama Metni</label>
              <textarea
                rows={3}
                value={siteContent.hero?.description || ''}
                onChange={(e) => setSiteContent({
                  ...siteContent,
                  hero: { ...siteContent.hero, description: e.target.value }
                })}
                className="w-full bg-meyhane-bg border border-meyhane-border p-3 rounded-xl text-white focus:border-gold focus:outline-none resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleSaveContent}
            disabled={contentSaving}
            className="px-6 py-3 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{contentSaving ? 'Kaydediliyor...' : 'Değişiklikleri Canlıya Al'}</span>
          </button>
        </div>
      )}

      {/* TAB 6: SİTE AYARLARI & ŞİFRE DEĞİŞTİRME */}
      {activeTab === 'settings' && siteContent && (
        <div className="luxury-card p-6 sm:p-8 rounded-3xl border border-meyhane-border space-y-8 animate-fadeIn">
          <div>
            <h2 className="text-lg font-bold font-serif text-white">İletişim Bilgileri &amp; Şifre Değiştirme</h2>
            <p className="text-xs text-gray-400">Yönetici giriş parolanızı ve mekan iletişim kanallarını güncelleyin.</p>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pb-6 border-b border-meyhane-border">
            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold uppercase tracking-wider">Telefon Numarası</label>
              <input
                type="text"
                value={siteContent.phone || ''}
                onChange={(e) => setSiteContent({ ...siteContent, phone: e.target.value })}
                className="w-full bg-meyhane-bg border border-meyhane-border p-3 rounded-xl text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold uppercase tracking-wider">E-posta</label>
              <input
                type="email"
                value={siteContent.email || ''}
                onChange={(e) => setSiteContent({ ...siteContent, email: e.target.value })}
                className="w-full bg-meyhane-bg border border-meyhane-border p-3 rounded-xl text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-gray-300 font-semibold uppercase tracking-wider">Açık Adres</label>
              <input
                type="text"
                value={siteContent.address || ''}
                onChange={(e) => setSiteContent({ ...siteContent, address: e.target.value })}
                className="w-full bg-meyhane-bg border border-meyhane-border p-3 rounded-xl text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                onClick={handleSaveContent}
                disabled={contentSaving}
                className="px-6 py-2.5 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110"
              >
                İletişim Bilgilerini Kaydet
              </button>
            </div>
          </div>

          {/* Change Admin Password */}
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md text-xs">
            <h3 className="text-sm font-bold font-serif text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-gold" />
              Yönetici Parolasını Değiştir
            </h3>

            {pwMessage && (
              <div className="p-3 rounded-xl bg-white/5 border border-gold/40 text-gold text-xs">
                {pwMessage}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold">Mevcut Parola</label>
              <input
                type="password"
                required
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold">Yeni Parola</label>
              <input
                type="password"
                required
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Yeni güvenli parola"
                className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-gold hover:text-black text-white font-semibold text-xs uppercase tracking-wider transition-colors"
            >
              Parolayı Güncelle
            </button>
          </form>
        </div>
      )}

      {/* EVENT ADD / EDIT MODAL */}
      {showEventModal && editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 flex items-center justify-center animate-fadeIn">
          <div className="luxury-card max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-gold/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-meyhane-border pb-3">
              <h2 className="text-base font-bold font-serif text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-gold" />
                {editingEvent.id.startsWith('new-') ? 'Yeni Sahne Programı Ekle' : 'Etkinliği Düzenle'}
              </h2>
              <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Etkinlik Başlığı *</label>
                <input
                  type="text"
                  required
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  placeholder="Örn: Büyük Gala Faslı & Sanat Müziği"
                  className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Sanatçı / Grup Adı *</label>
                  <input
                    type="text"
                    required
                    value={editingEvent.performer}
                    onChange={(e) => setEditingEvent({ ...editingEvent, performer: e.target.value })}
                    placeholder="Örn: Üstat Fasıl Heyeti"
                    className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Etkinlik Türü</label>
                  <select
                    value={editingEvent.genre}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      genre: e.target.value as any,
                      genreLabel: e.target.value === 'fasıl' ? 'Canlı Fasıl' : e.target.value === 'nostalji' ? '90lar Pop' : e.target.value === 'akustik' ? 'Akustik Trio' : 'Gala'
                    })}
                    className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                  >
                    <option value="fasıl">Canlı Fasıl</option>
                    <option value="nostalji">90lar & Nostalji</option>
                    <option value="akustik">Akustik Meyhane</option>
                    <option value="ozel_sahne">Gala & Özel Sahne</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Gün / Tarih *</label>
                  <input
                    type="text"
                    required
                    value={editingEvent.day}
                    onChange={(e) => setEditingEvent({ ...editingEvent, day: e.target.value })}
                    placeholder="Her Cuma veya 2026-10-15"
                    className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Saat Aralığı</label>
                  <input
                    type="text"
                    value={editingEvent.time}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                    placeholder="20:30 - 00:30"
                    className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Afiş / Fotoğraf Görseli (URL)</label>
                <input
                  type="text"
                  value={editingEvent.image}
                  onChange={(e) => setEditingEvent({ ...editingEvent, image: e.target.value })}
                  placeholder="/assets/Hayalmest-sahne.jpg"
                  className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Tanıtım Açıklaması</label>
                <textarea
                  rows={2}
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  placeholder="Gecenin konsepti ve şarkı repertuvarı hakkında bilgi..."
                  className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-300"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gold text-black font-semibold uppercase tracking-wider"
                >
                  Etkinliği Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MENU ADD / EDIT MODAL */}
      {showMenuModal && editingMenuItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 flex items-center justify-center animate-fadeIn">
          <div className="luxury-card max-w-md w-full rounded-3xl p-6 sm:p-8 border border-gold/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-meyhane-border pb-3">
              <h2 className="text-base font-bold font-serif text-white">
                {editingMenuItem.id.startsWith('new-') ? 'Yeni Menü Ürünü Ekle' : 'Ürünü Düzenle'}
              </h2>
              <button onClick={() => setShowMenuModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Ürün Adı *</label>
                <input
                  type="text"
                  required
                  value={editingMenuItem.name}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name: e.target.value })}
                  placeholder="Örn: Atom Sıcak"
                  className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Fiyat (TL) *</label>
                  <input
                    type="number"
                    required
                    value={editingMenuItem.price}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none font-bold text-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Kategori *</label>
                  <select
                    value={editingMenuItem.category}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, category: e.target.value as any })}
                    className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                  >
                    {MENU_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Rozet (Opsiyonel)</label>
                <input
                  type="text"
                  value={editingMenuItem.badge || ''}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, badge: e.target.value })}
                  placeholder="Örn: Şefin İmzası, Çok Satan"
                  className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Açıklama</label>
                <textarea
                  rows={2}
                  value={editingMenuItem.description || ''}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, description: e.target.value })}
                  placeholder="İçerik, malzeme ve sunum bilgisi..."
                  className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Fotoğraf URL</label>
                <input
                  type="text"
                  value={editingMenuItem.image || ''}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, image: e.target.value })}
                  placeholder="/assets/Hayamest-Mezeler.jpg"
                  className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMenuModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gold text-black font-semibold uppercase tracking-wider"
                >
                  Ürünü Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL RESERVATION ADD MODAL */}
      {showAddResModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 flex items-center justify-center animate-fadeIn">
          <div className="luxury-card max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-gold/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-meyhane-border pb-3">
              <h2 className="text-base font-bold font-serif text-white">
                Telefonla Gelen Rezervasyon Kaydı
              </h2>
              <button onClick={() => setShowAddResModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch('/api/reservations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newRes),
                  });
                  const json = await res.json();
                  if (json.success) {
                    setReservations(prev => [json.data, ...prev]);
                    setShowAddResModal(false);
                    alert('Rezervasyon başarıyla kaydedildi!');
                  }
                } catch (err) {
                  alert('Hata oluştu');
                }
              }} 
              className="space-y-3.5 text-xs"
            >
              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Müşteri Adı Soyadı *</label>
                <input
                  type="text"
                  required
                  value={newRes.fullName}
                  onChange={(e) => setNewRes({ ...newRes, fullName: e.target.value })}
                  placeholder="Ahmet Yılmaz"
                  className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Telefon *</label>
                  <input
                    type="tel"
                    required
                    value={newRes.phone}
                    onChange={(e) => setNewRes({ ...newRes, phone: e.target.value })}
                    placeholder="0532..."
                    className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Kişi Sayısı *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newRes.guestCount}
                    onChange={(e) => setNewRes({ ...newRes, guestCount: parseInt(e.target.value) || 1 })}
                    className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Tarih *</label>
                  <input
                    type="date"
                    required
                    value={newRes.date}
                    onChange={(e) => setNewRes({ ...newRes, date: e.target.value })}
                    className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Saat *</label>
                  <input
                    type="time"
                    required
                    value={newRes.time}
                    onChange={(e) => setNewRes({ ...newRes, time: e.target.value })}
                    className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Masa Seçimi</label>
                <select
                  value={newRes.tableId}
                  onChange={(e) => {
                    const t = tablesList.find(tbl => tbl.id === e.target.value);
                    setNewRes({
                      ...newRes,
                      tableId: e.target.value,
                      sectionId: t?.sectionId || 'salon'
                    });
                  }}
                  className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none cursor-pointer"
                >
                  {tablesList.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.number} ({t.capacity} Kişi - {t.sectionId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddResModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gold text-black font-semibold uppercase tracking-wider"
                >
                  Masayı Ayırt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESERVATION DETAIL POPUP MODAL */}
      {selectedReservationModal && (
        <ReservationDetailModal
          reservation={selectedReservationModal}
          onClose={() => setSelectedReservationModal(null)}
          onStatusChange={handleStatusChange}
          onTableChange={handleTableChange}
          onDelete={(id) => {
            handleDeleteReservation(id);
            setSelectedReservationModal(null);
          }}
        />
      )}

      {/* FLOOR TABLE DETAIL POPUP MODAL */}
      {selectedFloorTable && (() => {
        const matchedRes = reservations.find(
          r => r.date === floorDate && 
               r.status !== 'cancelled' && 
               (r.tableId === selectedFloorTable.id || (r.tableId && r.tableId.includes(selectedFloorTable.id)))
        );
        const isOccupied = !!matchedRes;
        const isSeated = matchedRes?.status === 'seated';
        const section = VENUE_SECTIONS.find(s => s.id === selectedFloorTable.sectionId);

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn">
            <div className="luxury-card max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-gold/40 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-meyhane-border/70 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-2xl font-bold text-white">
                      {selectedFloorTable.number}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isSeated 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' 
                        : isOccupied 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {isSeated ? 'Masada' : isOccupied ? 'Rezerve' : 'Müsait'}
                    </span>
                  </div>
                  <div className="text-xs text-gold font-medium">
                    {section?.name || selectedFloorTable.sectionId} • {selectedFloorTable.capacity} Kişilik Kapasite
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFloorTable(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Table Specifications */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-meyhane-bg/70 border border-meyhane-border space-y-1">
                  <span className="text-meyhane-muted block">Masa Kapasitesi</span>
                  <span className="text-white font-bold">{selectedFloorTable.capacity} Kişi</span>
                  <span className="text-[10px] text-gray-400 block">Min: {selectedFloorTable.minGuests || 1} Kişi</span>
                </div>
                <div className="p-3 rounded-xl bg-meyhane-bg/70 border border-meyhane-border space-y-1">
                  <span className="text-meyhane-muted block">Birleşebilir Masalar</span>
                  <span className="text-gold font-medium">
                    {selectedFloorTable.adjacentWith && selectedFloorTable.adjacentWith.length > 0 
                      ? selectedFloorTable.adjacentWith.map(id => tablesList.find(t => t.id === id)?.number || id).join(', ')
                      : 'Bağımsız Masa'}
                  </span>
                </div>
              </div>

              {/* Occupancy Status for floorDate */}
              <div className="p-4 rounded-2xl bg-meyhane-surface border border-meyhane-border space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-meyhane-border/50 pb-2">
                  <span className="text-gray-400">İncelenen Tarih:</span>
                  <span className="text-white font-bold font-mono">{floorDate}</span>
                </div>

                {matchedRes ? (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Misafir:</span>
                      <span className="text-white font-bold text-sm">{matchedRes.fullName}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">PNR Takip Kodu:</span>
                      <span className="text-gold font-mono font-bold">#{matchedRes.pnr}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">İletişim:</span>
                      <div className="flex items-center gap-2">
                        <a 
                          href={`tel:${matchedRes.phone}`}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-gold/20 text-gray-200 hover:text-gold flex items-center gap-1 text-[11px]"
                        >
                          <Phone className="w-3 h-3 text-gold" />
                          <span>{matchedRes.phone}</span>
                        </a>
                        <a 
                          href={`https://wa.me/90${matchedRes.phone.replace(/[^0-9]/g, '').replace(/^0/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                          title="WhatsApp Mesajı"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-meyhane-border/50">
                      <div>
                        <span className="text-meyhane-muted block text-[11px]">Saat &amp; Kişi:</span>
                        <span className="text-white font-medium">{matchedRes.time} • {matchedRes.guestCount} Kişi</span>
                      </div>
                      <div>
                        <span className="text-meyhane-muted block text-[11px]">Menü:</span>
                        <span className="text-gold font-medium">
                          {matchedRes.packageId === 'premium_fix' ? 'Premium Fiks' : matchedRes.packageId === 'standart_fix' ? 'Klasik Fiks' : 'A La Carte'}
                        </span>
                      </div>
                    </div>

                    {matchedRes.specialRequests && (
                      <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-200 italic">
                        &ldquo;{matchedRes.specialRequests}&rdquo;
                      </div>
                    )}

                    {/* Quick status change buttons */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-meyhane-border/50">
                      {matchedRes.status !== 'seated' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(matchedRes.id, 'seated')}
                          className="px-3 py-1.5 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-colors"
                        >
                          ✓ Masaya Oturdu
                        </button>
                      )}
                      {matchedRes.status !== 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(matchedRes.id, 'confirmed')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-colors"
                        >
                          ✓ Onayla
                        </button>
                      )}
                      {matchedRes.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(matchedRes.id, 'cancelled')}
                          className="px-3 py-1.5 rounded-xl bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-600 hover:text-white transition-colors"
                        >
                          İptal Et
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReservationModal(matchedRes);
                        setSelectedFloorTable(null);
                      }}
                      className="w-full py-2.5 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Tam Rezervasyon Kartını &amp; Değişiklik Panelini Aç</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-3">
                    <div className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>Bu masa seçili tarihte tamamen müsaittir.</span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Doğrudan bu masaya yeni rezervasyon oluşturabilir veya yerleşim planını güncelleyebilirsiniz.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setNewRes({
                          ...newRes,
                          date: floorDate,
                          tableId: selectedFloorTable.id,
                          sectionId: selectedFloorTable.sectionId
                        });
                        setShowAddResModal(true);
                        setSelectedFloorTable(null);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg flex items-center justify-center gap-1.5 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Bu Masaya Rezervasyon Aç</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Table Management Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-meyhane-border/70 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('designer');
                    setSelectedFloorTable(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 flex items-center gap-1.5 transition-colors"
                >
                  <Palette className="w-3.5 h-3.5 text-gold" />
                  <span>Salon Tasarımcısında Düzenle</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`${selectedFloorTable.number} masasını kalıcı olarak silmek istediğinize emin misiniz?`)) return;
                    try {
                      const res = await fetch(`/api/tables?id=${selectedFloorTable.id}`, { method: 'DELETE' });
                      const json = await res.json();
                      if (json.success) {
                        setTablesList(prev => prev.filter(t => t.id !== selectedFloorTable.id));
                        setSelectedFloorTable(null);
                        alert('Masa silindi');
                      } else {
                        alert(json.error || 'Silinemedi');
                      }
                    } catch (err) {
                      alert('Silme işleminde hata oluştu');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Masayı Sil</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
