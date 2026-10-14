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
  UserCheck,
  Download,
  Mail,
  History,
  Star,
  FileSpreadsheet,
  BarChart2,
  Menu,
  ExternalLink,
  ChevronUp,
  QrCode
} from 'lucide-react';
import { Reservation } from '@/lib/storage';
import { CustomerProfile } from '@/lib/customersStorage';
import { ALL_TABLES, VENUE_SECTIONS, TableItem } from '@/data/tablesData';
import { StageEvent } from '@/data/eventsData';
import { MenuItem, MENU_CATEGORIES } from '@/data/menuData';
import { formatTableDisplay, setRegisteredTables } from '@/lib/formatters';
import ReservationDetailModal from '@/components/ReservationDetailModal';
import FloorPlanDesigner from '@/components/FloorPlanDesigner';
import InteractiveFloorPlan from '@/components/InteractiveFloorPlan';
import { VenueElement } from '@/lib/tablesStorage';
import ServiceRequestsLiveFeed from '@/components/ServiceRequestsLiveFeed';
import TableQrCodeModal from '@/components/TableQrCodeModal';

export default function AdminPage() {
  const router = useRouter();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'reservations' | 'customers' | 'floor' | 'designer' | 'events' | 'menu' | 'content' | 'settings'>('reservations');

  // Customers & CRM state
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'vip' | 'regular' | 'new' | 'cancelled'>('all');
  const [customerSort, setCustomerSort] = useState<'reservations' | 'guests' | 'lastVisit' | 'name'>('reservations');
  const [selectedCustomerModal, setSelectedCustomerModal] = useState<CustomerProfile | null>(null);
  const [editingCustomerNote, setEditingCustomerNote] = useState<CustomerProfile | null>(null);
  const [customerNoteForm, setCustomerNoteForm] = useState({ isVip: false, adminNotes: '', allergyNotes: '', tags: '' });

  // Reservations state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [showStats, setShowStats] = useState(true);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [showMobileTabMenu, setShowMobileTabMenu] = useState(false);

  // Modals & Floor inspection state
  const [selectedReservationModal, setSelectedReservationModal] = useState<Reservation | null>(null);
  const [selectedFloorTable, setSelectedFloorTable] = useState<TableItem | null>(null);
  const [floorDate, setFloorDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [floorViewMode, setFloorViewMode] = useState<'canvas' | 'list'>('canvas');

  // Dynamic tables & elements
  const [tablesList, setTablesList] = useState<TableItem[]>(ALL_TABLES);
  const [venueElements, setVenueElements] = useState<VenueElement[]>([]);
  const [qrModalTable, setQrModalTable] = useState<TableItem | null>(null);

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

  // User management state
  const [userAdmins, setUserAdmins] = useState<any[]>([]);
  const [userHosts, setUserHosts] = useState<any[]>([]);
  const [userWaiters, setUserWaiters] = useState<any[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState<'admin' | 'host' | 'waiter' | null>(null);
  const [newUserForm, setNewUserForm] = useState({ username: '', password: '', displayName: '', name: '', pin: '', permissions: ['reservations'] as string[] });
  const [userMsg, setUserMsg] = useState('');

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
      const [resRes, eventsRes, menuRes, contentRes, tablesRes, custRes, usersRes] = await Promise.all([
        fetch('/api/reservations').then(r => r.json()).catch(() => ({})),
        fetch('/api/events').then(r => r.json()).catch(() => ({})),
        fetch('/api/menu').then(r => r.json()).catch(() => ({})),
        fetch('/api/content').then(r => r.json()).catch(() => ({})),
        fetch('/api/tables').then(r => r.json()).catch(() => ({})),
        fetch('/api/customers').then(r => r.json()).catch(() => ({})),
        fetch('/api/admin/users').then(r => r.json()).catch(() => ({})),
      ]);

      if (resRes?.success) setReservations(resRes.data);
      if (eventsRes?.success) setEvents(eventsRes.data);
      if (menuRes?.success) setMenuItems(menuRes.items);
      if (contentRes?.success) setSiteContent(contentRes.data);
      if (tablesRes?.success) {
        if (tablesRes.tables?.length) {
          setTablesList(tablesRes.tables);
          setRegisteredTables(tablesRes.tables);
        }
        if (tablesRes.elements?.length) setVenueElements(tablesRes.elements);
      }
      if (custRes?.success) setCustomers(custRes.data);
      if (usersRes?.success) {
        setUserAdmins(usersRes.admins || []);
        setUserHosts(usersRes.hosts || []);
        setUserWaiters(usersRes.waiters || []);
      }
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const json = await res.json();
      if (json.success) setCustomers(json.data);
    } catch (e) {
      console.error('Error fetching customers:', e);
    }
  };

  // Customer Notes & VIP Edit Handler
  const handleSaveCustomerNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomerNote) return;
    try {
      const res = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: editingCustomerNote.id,
          isVip: customerNoteForm.isVip,
          adminNotes: customerNoteForm.adminNotes,
          allergyNotes: customerNoteForm.allergyNotes,
          tags: customerNoteForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchCustomers();
        setEditingCustomerNote(null);
      } else {
        alert(json.error || 'Not kaydedilemedi');
      }
    } catch (err) {
      alert('Hata oluştu');
    }
  };

  // Quick reservation pre-filler for specific customer
  const handleQuickBookForCustomer = (cust: CustomerProfile) => {
    setNewRes({
      fullName: cust.fullName,
      phone: cust.phone,
      email: cust.email || '',
      date: new Date().toISOString().split('T')[0],
      time: '20:00',
      serviceType: 'Canlı Fasıl Akşamı',
      guestCount: 4,
      occasion: 'Akşam Yemeği',
      sectionId: (cust.favoriteSectionId as any) || 'salon',
      tableId: cust.favoriteTable || 's-1',
      packageId: 'premium_fix',
      specialRequests: cust.allergyNotes ? `Özel Not / Hassasiyet: ${cust.allergyNotes}` : '',
    });
    setShowAddResModal(true);
  };

  // WhatsApp quick chat link generator
  const getWhatsAppUrl = (phone: string, name: string) => {
    const clean = phone.replace(/\D/g, '');
    let intlPhone = clean;
    if (clean.startsWith('0')) intlPhone = '90' + clean.slice(1);
    else if (!clean.startsWith('90')) intlPhone = '90' + clean;
    const text = encodeURIComponent(`Merhaba Sayın ${name}, HayalMest Meyhane'den ulaşıyoruz.`);
    return `https://wa.me/${intlPhone}?text=${text}`;
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
        fetchCustomers();
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
        fetchCustomers();
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
        fetchCustomers();
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

  // Aktif Rezervasyonlar: Geçmişte onaylanmamış (pending) rezervasyonlar istatistiklerde ve aktif listede görünmemeli
  const activeReservations = reservations.filter(r => !(r.status === 'pending' && r.date < todayStr));

  // Stats (Bugünden itibaren tutarlı istatistikler)
  const totalCount = activeReservations.length;
  // Onay Bekleyenler: SADECE bugünden itibaren olan ve teyit bekleyen rezervasyonlar
  const pendingCount = reservations.filter(r => r.status === 'pending' && r.date >= todayStr).length;
  const confirmedCount = reservations.filter(r => r.status === 'confirmed' && r.date >= todayStr).length;
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
      const resCount = activeReservations.filter(r => r.date === dateStr && r.status !== 'cancelled').length;
      const guestTotal = activeReservations
        .filter(r => r.date === dateStr && r.status !== 'cancelled')
        .reduce((acc, curr) => acc + curr.guestCount, 0);
      days.push({ dateStr, dayName, dayDisplay, resCount, guestTotal, isToday: dateStr === todayStr });
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Filtered reservations (Geçmiş onaylanmamış rezervasyonlar hariç)
  const filtered = activeReservations.filter(r => {
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

  // Customer filtering & sorting
  const filteredCustomers = customers
    .filter(c => {
      const q = customerSearch.toLowerCase().trim();
      if (q) {
        const matches = 
          c.fullName.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.adminNotes.toLowerCase().includes(q) ||
          c.allergyNotes.toLowerCase().includes(q) ||
          c.tags.some(t => t.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (customerFilter === 'vip') return c.isVip;
      if (customerFilter === 'regular') return c.totalReservations >= 2;
      if (customerFilter === 'new') return c.totalReservations === 1;
      if (customerFilter === 'cancelled') return c.cancelledCount > 0;
      return true;
    })
    .sort((a, b) => {
      if (customerSort === 'reservations') return b.totalReservations - a.totalReservations;
      if (customerSort === 'guests') return b.totalGuests - a.totalGuests;
      if (customerSort === 'lastVisit') return (b.lastVisit || '').localeCompare(a.lastVisit || '');
      if (customerSort === 'name') return a.fullName.localeCompare(b.fullName, 'tr');
      return 0;
    });

  const vipCustomerCount = customers.filter(c => c.isVip).length;
  const totalGuestsAllCustomers = customers.reduce((sum, c) => sum + c.totalGuests, 0);

  return (
    <div className={`${activeTab === 'designer' ? 'max-w-[1850px]' : 'max-w-7xl'} w-full max-w-full overflow-x-hidden mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-4 sm:space-y-5 transition-all duration-300 pb-28 sm:pb-32`}>
      
      {/* Top Header - Mobile-first & Zero Horizontal Overflow */}
      <div className="border-b border-meyhane-border/70 pb-3 sm:pb-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-wider text-gold font-semibold truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              <span className="truncate">HayalMest Yönetim Paneli</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold font-serif text-white tracking-wide truncate">
              Kontrol Masası
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Live Waiter & Table Service Calls Feed */}
            <ServiceRequestsLiveFeed />

            {/* Desktop-only Rezervasyon button */}
            <button
              onClick={() => setShowAddResModal(true)}
              className="hidden sm:inline-flex px-3 sm:px-4 py-2 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 items-center gap-1.5 shadow-md shadow-gold/20 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Rezervasyon Ekle</span>
            </button>

            {/* Hamburger Menu Trigger Button */}
            <button
              type="button"
              onClick={() => setShowHamburgerMenu(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-meyhane-surface hover:bg-gold/15 border border-gold/40 text-gold flex items-center gap-1.5 transition-all shadow-md"
              title="Yönetim Menüsü"
            >
              <Menu className="w-5 h-5 text-gold" />
              <span className="hidden sm:inline text-xs font-semibold">Menü</span>
            </button>
          </div>
        </div>

        {/* Mobile Full-width Action Button */}
        <div className="sm:hidden">
          <button
            onClick={() => setShowAddResModal(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 flex items-center justify-center gap-1.5 shadow-md shadow-gold/20"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Rezervasyon Ekle</span>
          </button>
        </div>
      </div>

      {/* Stats Row - Compact & Single-Line Swipeable Strip on Mobile, 5-Cols on Desktop */}
      {showStats && (
        <div className="overflow-x-auto scrollbar-none flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 animate-fadeIn -mx-1 sm:mx-0 pb-1">
          <div className="flex-shrink-0 min-w-[135px] sm:min-w-0 p-2.5 sm:p-3 rounded-2xl bg-meyhane-surface/85 border border-meyhane-border space-y-0.5 shadow-sm">
            <div className="text-[10px] text-meyhane-muted uppercase tracking-wider font-semibold">Bugün Beklenen</div>
            <div className="text-xl sm:text-2xl font-bold font-serif text-gold">{todayGuests} Kişi</div>
            <div className="text-[10px] text-gray-400">Aktif masalar toplamı</div>
          </div>

          <div className="flex-shrink-0 min-w-[135px] sm:min-w-0 p-2.5 sm:p-3 rounded-2xl bg-meyhane-surface/85 border border-meyhane-border space-y-0.5 shadow-sm">
            <div className="text-[10px] text-meyhane-muted uppercase tracking-wider font-semibold">Onay Bekleyen</div>
            <div className="text-xl sm:text-2xl font-bold font-serif text-amber-400">{pendingCount}</div>
            <div className="text-[10px] text-gray-400">Teyit bekleyen misafir</div>
          </div>

          <div className="flex-shrink-0 min-w-[135px] sm:min-w-0 p-2.5 sm:p-3 rounded-2xl bg-meyhane-surface/85 border border-gold/40 space-y-0.5 bg-gradient-to-br from-gold/5 to-transparent shadow-sm">
            <div className="text-[10px] text-gold uppercase tracking-wider font-semibold flex items-center gap-1">
              <Crown className="w-3 h-3 text-gold" />
              <span>Misafir Portföyü</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-serif text-gold">{customers.length} Kişi</div>
            <div className="text-[10px] text-amber-200/70">{vipCustomerCount} VIP &amp; Müdavim</div>
          </div>

          <div className="flex-shrink-0 min-w-[135px] sm:min-w-0 p-2.5 sm:p-3 rounded-2xl bg-meyhane-surface/85 border border-meyhane-border space-y-0.5 shadow-sm">
            <div className="text-[10px] text-meyhane-muted uppercase tracking-wider font-semibold">Canlı Sahne</div>
            <div className="text-xl sm:text-2xl font-bold font-serif text-emerald-400">{events.length}</div>
            <div className="text-[10px] text-gray-400">Haftalık sahne programı</div>
          </div>

          <div className="flex-shrink-0 min-w-[135px] sm:min-w-0 p-2.5 sm:p-3 rounded-2xl bg-meyhane-surface/85 border border-meyhane-border space-y-0.5 shadow-sm">
            <div className="text-[10px] text-meyhane-muted uppercase tracking-wider font-semibold">Kayıtlı Menü</div>
            <div className="text-xl sm:text-2xl font-bold font-serif text-white">{menuItems.length}</div>
            <div className="text-[10px] text-gray-400">Meze, kebap ve içkiler</div>
          </div>
        </div>
      )}

      {/* NAVIGATION TABS: DESKTOP FLOATING DOCK & MOBILE EXPANDABLE FLOATING MENU */}
      {(() => {
        interface TabItem {
          id: 'reservations' | 'customers' | 'floor' | 'designer' | 'events' | 'menu' | 'content' | 'settings';
          label: string;
          count?: number;
          icon: React.ComponentType<{ className?: string }>;
          iconColor?: string;
        }

        const adminTabs: TabItem[] = [
          { id: 'reservations', label: 'Rezervasyonlar', count: activeReservations.length, icon: Users },
          { id: 'customers', label: 'Misafirler', count: customers.length, icon: Crown, iconColor: 'text-amber-400' },
          { id: 'floor', label: 'Kuşbakışı', icon: Layers },
          { id: 'designer', label: 'Tasarımcı', icon: Palette, iconColor: 'text-gold' },
          { id: 'events', label: 'Sahne', count: events.length, icon: Music },
          { id: 'menu', label: 'Menü', icon: Utensils },
          { id: 'content', label: 'Galeri', icon: Camera },
          { id: 'settings', label: 'Ayarlar', icon: Settings },
        ];

        const currentTabMeta = adminTabs.find(t => t.id === activeTab) || adminTabs[0];
        const CurrentTabIcon = currentTabMeta.icon;

        return (
          <>
            {/* DESKTOP FLOATING NAVIGATION DOCK (sm ve üzeri ekranlar) */}
            <div className="hidden sm:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[96vw] bg-black/85 backdrop-blur-2xl border border-gold/40 shadow-[0_12px_45px_rgba(0,0,0,0.85)] rounded-full p-1.5 items-center gap-1 overflow-x-auto scrollbar-none animate-fadeIn ring-1 ring-white/10">
              {adminTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-gold text-black shadow-lg shadow-gold/30 font-bold scale-105'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : (tab.iconColor || 'text-current')}`} />
                    <span>{tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}</span>
                  </button>
                );
              })}
            </div>

            {/* MOBILE FLOATING EXPANDABLE MENU (Yüzen Açılır Menü) */}
            <div className="sm:hidden">
              {/* Trigger Pill Button */}
              <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
                <button
                  type="button"
                  onClick={() => setShowMobileTabMenu(!showMobileTabMenu)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#10141D]/95 backdrop-blur-2xl border border-gold/50 shadow-[0_10px_35px_rgba(0,0,0,0.9)] text-white active:scale-95 transition-all ring-1 ring-white/10"
                >
                  <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold">
                    <CurrentTabIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left flex items-center gap-1.5">
                    <span className="text-xs font-bold font-serif text-white">{currentTabMeta.label}</span>
                    {currentTabMeta.count !== undefined && (
                      <span className="px-1.5 py-0.2 rounded-full bg-gold/20 text-gold text-[10px] font-bold">
                        {currentTabMeta.count}
                      </span>
                    )}
                  </div>
                  <div className={`p-1 rounded-full bg-white/10 text-gold transition-transform duration-300 ${showMobileTabMenu ? 'rotate-180' : ''}`}>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>

              {/* Backdrop & Floating Popup Drawer */}
              {showMobileTabMenu && (
                <>
                  <div
                    onClick={() => setShowMobileTabMenu(false)}
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fadeIn"
                  />
                  <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto luxury-card rounded-3xl p-4 border border-gold/40 shadow-[0_20px_60px_rgba(0,0,0,0.95)] animate-fadeIn space-y-3 bg-[#131722]/98 backdrop-blur-2xl">
                    <div className="flex items-center justify-between border-b border-meyhane-border/70 pb-2.5 px-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-gold" />
                        <span className="text-xs font-bold uppercase tracking-wider text-white font-serif">
                          Yönetim Sekmeleri
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMobileTabMenu(false)}
                        className="p-1 rounded-lg text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {adminTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(tab.id as any);
                              setShowMobileTabMenu(false);
                            }}
                            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                              isActive
                                ? 'bg-gold text-black border-gold shadow-lg shadow-gold/25 font-bold'
                                : 'bg-meyhane-surface/80 border-meyhane-border hover:border-gold/40 text-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                                isActive ? 'bg-black/20 text-black' : 'bg-white/5 text-gold'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              {tab.count !== undefined && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                  isActive ? 'bg-black/20 text-black' : 'bg-gold/15 text-gold'
                                }`}>
                                  {tab.count}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-medium tracking-tight">
                              {tab.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        );
      })()}

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
                  Tüm Tarihler ({activeReservations.length})
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
                    suppressHydrationWarning={true}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="İsim, telefon veya PNR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-meyhane-surface border border-meyhane-border pl-9 pr-3 py-2.5 rounded-xl text-xs text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto bg-meyhane-surface border border-meyhane-border px-3 py-2.5 rounded-xl text-xs text-white focus:border-gold focus:outline-none cursor-pointer"
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
                className="w-full sm:w-auto bg-meyhane-surface border border-meyhane-border px-3 py-2.5 rounded-xl text-xs text-white focus:border-gold focus:outline-none cursor-pointer"
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

          {/* 1. MOBILE RESERVATION CARDS (sm:hidden) */}
          <div className="block sm:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400 luxury-card rounded-2xl border border-meyhane-border">
                Bu filtreye uygun rezervasyon bulunamadı.
              </div>
            ) : (
              filtered.map((res) => {
                const isToday = res.date === todayStr;
                return (
                  <div
                    key={res.id}
                    onClick={() => setSelectedReservationModal(res)}
                    className="luxury-card rounded-2xl border border-meyhane-border hover:border-gold/50 p-4 space-y-3 shadow-lg active:scale-[0.99] transition-all bg-gradient-to-br from-meyhane-surface to-black/40"
                  >
                    {/* Card Top: PNR + Today badge + Status */}
                    <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-gold">#{res.pnr}</span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                            BUGÜN
                          </span>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                    </div>

                    {/* Card Body: Guest Name + Phone + Table Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-bold text-white text-sm font-serif">{res.fullName}</h3>
                        <span className="text-xs font-bold text-gold font-serif whitespace-nowrap">{res.guestCount} Kişi</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-300">
                        <div className="flex items-center gap-1.5 text-gold font-medium truncate">
                          <Utensils className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{formatTableDisplay(res.tableId, res.sectionId, tablesList)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-[11px] flex-shrink-0">
                          <Clock className="w-3 h-3 text-gold" />
                          <span>{res.date} • {res.time}</span>
                        </div>
                      </div>

                      {res.specialRequests && (
                        <p className="text-[11px] text-amber-200/90 italic line-clamp-2 bg-black/30 p-2 rounded-lg border border-amber-500/20">
                          &ldquo;{res.specialRequests}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Card Actions: Quick Call, WhatsApp, Details & Statuses */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${res.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-gold/20 text-gold text-xs font-semibold flex items-center gap-1 border border-white/10"
                          title="Misafiri Ara"
                        >
                          <Phone className="w-3.5 h-3.5 text-gold" />
                          <span className="text-[11px]">{res.phone}</span>
                        </a>

                        <a
                          href={`https://wa.me/90${res.phone.replace(/[^0-9]/g, '').replace(/^0/, '')}?text=Merhaba%20Say%C4%B1n%20${encodeURIComponent(res.fullName)},%20HayalMest%20Anadolu%20Meyhanesi%20${res.date}%20tarihli%20saat%20${res.time}%20i%C3%A7in%20%23${res.pnr}%20kodlu%20${res.guestCount}%20ki%C5%9Filik%20rezervasyonunuz%20onaylanm%C4%B1%C5%9Ft%C4%B1r.%20Sizi%20a%C4%9F%C4%B1rlamaktan%20mutluluk%20duyaca%C4%9F%C4%B1z!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors"
                          title="WhatsApp Mesajı"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </div>

                      <div className="flex items-center gap-1">
                        {res.status !== 'confirmed' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(res.id, 'confirmed');
                            }}
                            className="px-2 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 text-[11px] font-bold transition-colors"
                            title="Onayla"
                          >
                            Onayla
                          </button>
                        )}
                        {res.status !== 'seated' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(res.id, 'seated');
                            }}
                            className="px-2 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 text-[11px] font-bold transition-colors"
                            title="Masada"
                          >
                            Masada
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReservationModal(res);
                          }}
                          className="p-1.5 rounded-lg bg-gold/15 text-gold hover:bg-gold hover:text-black transition-colors"
                          title="Detay"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 2. DESKTOP RESERVATION TABLE (hidden sm:block) */}
          <div className="hidden sm:block luxury-card rounded-2xl border border-meyhane-border overflow-hidden shadow-xl">
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
                              {formatTableDisplay(res.tableId, res.sectionId, tablesList)}
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

      {/* TAB: MİSAFİRLER / MÜŞTERİ CRM */}
      {activeTab === 'customers' && (
        <div className="space-y-6 animate-fadeIn">
          {/* CRM Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-meyhane-surface border border-meyhane-border space-y-1">
              <div className="text-xs text-meyhane-muted uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gold" />
                <span>Toplam Kayıtlı Misafir</span>
              </div>
              <div className="text-2xl font-bold font-serif text-white">{customers.length} Kişi</div>
              <div className="text-[11px] text-gray-400">Tekil iletişim kaydı</div>
            </div>

            <div className="p-4 rounded-2xl bg-meyhane-surface border border-gold/40 space-y-1 bg-gradient-to-br from-gold/5 to-transparent">
              <div className="text-xs text-gold uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                <Crown className="w-3.5 h-3.5 text-gold" />
                <span>VIP &amp; Müdavimler</span>
              </div>
              <div className="text-2xl font-bold font-serif text-gold">{vipCustomerCount} Kişi</div>
              <div className="text-[11px] text-amber-200/70">Sadık &amp; özel misafirler</div>
            </div>

            <div className="p-4 rounded-2xl bg-meyhane-surface border border-meyhane-border space-y-1">
              <div className="text-xs text-meyhane-muted uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ağırlanan Toplam Kişi</span>
              </div>
              <div className="text-2xl font-bold font-serif text-emerald-400">{totalGuestsAllCustomers} Misafir</div>
              <div className="text-[11px] text-gray-400">Getirilen toplam misafir</div>
            </div>

            <div className="p-4 rounded-2xl bg-meyhane-surface border border-meyhane-border space-y-1">
              <div className="text-xs text-meyhane-muted uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Toplam Rezervasyon</span>
              </div>
              <div className="text-2xl font-bold font-serif text-blue-400">
                {customers.reduce((acc, c) => acc + c.totalReservations, 0)}
              </div>
              <div className="text-[11px] text-gray-400">Sistemdeki tüm kayıtlar</div>
            </div>
          </div>

          {/* CRM Controls & Action Bar */}
          <div className="p-4 rounded-2xl bg-meyhane-surface border border-meyhane-border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Misafir adı, telefon, e-posta, etiket veya not ara..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full bg-meyhane-bg border border-meyhane-border pl-9 pr-3 py-2.5 rounded-xl text-xs text-white focus:border-gold focus:outline-none"
              />
              {customerSearch && (
                <button
                  type="button"
                  onClick={() => setCustomerSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCustomerFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  customerFilter === 'all'
                    ? 'bg-gold text-black shadow-md font-bold'
                    : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Tümü ({customers.length})
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter('vip')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  customerFilter === 'vip'
                    ? 'bg-amber-400 text-black shadow-md font-bold'
                    : 'bg-white/5 text-amber-300 hover:bg-white/10'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>VIP &amp; Müdavim ({customers.filter(c => c.isVip).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter('new')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  customerFilter === 'new'
                    ? 'bg-emerald-500 text-black shadow-md font-bold'
                    : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Yeni ({customers.filter(c => c.totalReservations === 1).length})
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter('cancelled')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  customerFilter === 'cancelled'
                    ? 'bg-red-500 text-white shadow-md font-bold'
                    : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                İptalli ({customers.filter(c => c.cancelledCount > 0).length})
              </button>
            </div>

            {/* Sort & Excel Export */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={customerSort}
                onChange={(e) => setCustomerSort(e.target.value as any)}
                className="bg-meyhane-bg border border-meyhane-border px-3 py-2 rounded-xl text-xs text-white focus:border-gold focus:outline-none cursor-pointer"
              >
                <option value="reservations">Sırala: En Çok Gelenler</option>
                <option value="guests">Sırala: En Çok Misafir Getirenler</option>
                <option value="lastVisit">Sırala: En Son Ziyaret</option>
                <option value="name">Sırala: İsim (A-Z)</option>
              </select>

              <a
                href="/api/customers?export=csv"
                download
                className="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Tüm müşteri portföyünü Excel / CSV olarak indir"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Excel / CSV İndir</span>
              </a>
            </div>
          </div>

          {/* Customer Cards Grid */}
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-meyhane-muted luxury-card rounded-2xl border border-meyhane-border space-y-2">
              <Users className="w-10 h-10 mx-auto text-gold opacity-50" />
              <p className="text-sm">Arama kriterlerine uygun misafir bulunamadı.</p>
              <button
                type="button"
                onClick={() => { setCustomerSearch(''); setCustomerFilter('all'); }}
                className="text-gold text-xs underline font-semibold mt-2"
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCustomers.map((cust) => {
                const initials = cust.fullName
                  .split(' ')
                  .map(n => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'M';

                return (
                  <div
                    key={cust.id}
                    className={`luxury-card rounded-2xl border p-5 space-y-4 shadow-xl transition-all hover:border-gold/60 relative ${
                      cust.isVip
                        ? 'border-amber-500/60 bg-gradient-to-b from-amber-950/20 to-meyhane-surface'
                        : 'border-meyhane-border'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-md font-serif relative ${
                          cust.isVip
                            ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black ring-2 ring-gold/60'
                            : 'bg-white/10 text-white border border-white/15'
                        }`}>
                          {initials}
                          {cust.isVip && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black text-amber-400 border border-gold flex items-center justify-center text-[9px]">
                              👑
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white font-serif">
                              {cust.fullName}
                            </h3>
                            {cust.isVip && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-bold">
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono">
                            {cust.phone}
                          </div>
                        </div>
                      </div>

                      {/* Quick Communication Actions */}
                      <div className="flex items-center gap-1.5">
                        <a
                          href={getWhatsAppUrl(cust.phone, cust.fullName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-colors"
                          title="WhatsApp ile Mesaj Gönder"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`tel:${cust.phone.replace(/\s+/g, '')}`}
                          className="p-2 rounded-xl bg-white/5 border border-white/15 text-gray-300 hover:text-gold hover:border-gold transition-colors"
                          title="Telefonla Ara"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Email if available */}
                    {cust.email && (
                      <div className="text-[11px] text-gray-400 flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-gold flex-shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                    )}

                    {/* Customer Stats Strip */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-meyhane-bg/70 border border-meyhane-border/70 text-center text-xs">
                      <div>
                        <div className="text-[10px] text-meyhane-muted uppercase">Ziyaret</div>
                        <div className="font-bold text-gold font-serif text-sm">
                          {cust.totalReservations}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-meyhane-muted uppercase">Toplam Kişi</div>
                        <div className="font-bold text-white font-serif text-sm">
                          {cust.totalGuests}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-meyhane-muted uppercase">Favori Alan</div>
                        <div className="font-bold text-emerald-400 truncate text-[11px] mt-0.5">
                          {cust.favoriteSection}
                        </div>
                      </div>
                    </div>

                    {/* Tags List */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {cust.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-[10px] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Admin Notes / Allergy Highlights */}
                    {(cust.adminNotes || cust.allergyNotes) && (
                      <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-1">
                        {cust.adminNotes && (
                          <div className="text-amber-200 text-[11px] flex items-start gap-1.5">
                            <span className="text-gold font-bold">📌 Not:</span>
                            <span className="line-clamp-2">{cust.adminNotes}</span>
                          </div>
                        )}
                        {cust.allergyNotes && (
                          <div className="text-red-300 text-[11px] flex items-start gap-1.5">
                            <span className="font-bold">⚠️ Hassasiyet:</span>
                            <span className="line-clamp-1">{cust.allergyNotes}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Last Visit Footer */}
                    <div className="pt-2 border-t border-meyhane-border/60 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Son Ziyaret: <strong className="text-white">{cust.lastVisit || '-'}</strong></span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {cust.confirmedCount + cust.seatedCount} Başarılı
                        {cust.cancelledCount > 0 && ` • ${cust.cancelledCount} İptal`}
                      </span>
                    </div>

                    {/* Card Actions */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerModal(cust)}
                        className="py-2 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                        title="Tüm Rezervasyon Geçmişini Gör"
                      >
                        <History className="w-3.5 h-3.5 text-gold" />
                        <span>Geçmiş</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingCustomerNote(cust);
                          setCustomerNoteForm({
                            isVip: cust.isVip,
                            adminNotes: cust.adminNotes,
                            allergyNotes: cust.allergyNotes,
                            tags: cust.tags.filter(t => !t.includes('VIP') && !t.includes('Misafir') && !t.includes('Grup') && !t.includes('İptal')).join(', '),
                          });
                        }}
                        className="py-2 px-2 rounded-xl bg-white/5 hover:bg-gold/20 hover:text-gold border border-white/10 text-gray-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                        title="Yönetici Notu &amp; VIP Ayarla"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Not Düzenle</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickBookForCustomer(cust)}
                        className="py-2 px-2 rounded-xl bg-gold text-black hover:brightness-110 font-bold text-[11px] flex items-center justify-center gap-1 transition-all shadow-sm"
                        title="Bu Müşteriye Hızlı Rezervasyon Oluştur"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Rezervasyon</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KUŞBAKIŞI SALON DURUMU & 2D MİMARİ KROKİ */}
      {activeTab === 'floor' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Floor Date & Controls Header */}
          <div className="p-4 rounded-2xl bg-meyhane-surface border border-gold/30 flex flex-wrap items-center justify-between gap-4 text-xs shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gold font-semibold flex items-center gap-1.5 font-serif text-sm">
                <Calendar className="w-4 h-4 text-gold" />
                İncelenen Tarih:
              </span>
              <input
                type="date"
                value={floorDate}
                suppressHydrationWarning={true}
                onChange={(e) => setFloorDate(e.target.value)}
                className="bg-meyhane-bg border border-meyhane-border px-3 py-1.5 rounded-xl text-white font-medium focus:border-gold focus:outline-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setFloorDate(todayStr)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  floorDate === todayStr ? 'bg-gold text-black shadow-md font-bold' : 'bg-white/5 text-gray-300 hover:text-white'
                }`}
              >
                Bugün
              </button>
              
              {/* Quick day counters */}
              {(() => {
                const dayReservations = reservations.filter(r => r.date === floorDate && r.status !== 'cancelled');
                const dayGuests = dayReservations.reduce((acc, curr) => acc + curr.guestCount, 0);
                const occupiedCount = tablesList.filter(t => 
                  reservations.some(r => r.date === floorDate && r.status !== 'cancelled' && (r.tableId === t.id || r.tableId?.includes(t.id)))
                ).length;
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

            <div className="flex items-center gap-2 sm:gap-3">
              {/* View Mode Toggle: 2D Kroki (Default) vs Section List */}
              <div className="flex items-center bg-meyhane-bg p-1 rounded-xl border border-meyhane-border text-xs">
                <button
                  type="button"
                  onClick={() => setFloorViewMode('canvas')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                    floorViewMode === 'canvas'
                      ? 'bg-gold text-black shadow-md font-bold'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  title="2D Mimari Kroki Görünümü"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>2D Mimari Kroki</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFloorViewMode('list')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                    floorViewMode === 'list'
                      ? 'bg-gold text-black shadow-md font-bold'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  title="Bölüm Kartları Listesi"
                >
                  <span>Bölüm Listesi</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('designer')}
                className="px-3.5 py-2 rounded-xl bg-gold/15 border border-gold/40 text-gold hover:bg-gold hover:text-black font-semibold flex items-center gap-1.5 transition-all shadow-md"
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salon Tasarımcısı</span>
              </button>
            </div>
          </div>

          {/* 1. INTERACTIVE 2D BLUEPRINT FLOOR PLAN (Default & Prominent) */}
          {floorViewMode === 'canvas' ? (
            <InteractiveFloorPlan
              tables={tablesList}
              elements={venueElements}
              reservations={reservations}
              selectedDate={floorDate}
              selectedTableId={selectedFloorTable?.id}
              onSelectTable={(table) => setSelectedFloorTable(table)}
              onQuickBookTable={(table) => {
                setNewRes({
                  ...newRes,
                  date: floorDate,
                  tableId: table.id,
                  sectionId: table.sectionId,
                  guestCount: table.capacity,
                });
                setShowAddResModal(true);
              }}
              onStatusChange={handleStatusChange}
            />
          ) : (
            /* 2. SECTION LIST VIEW (Alternative fallback) */
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
          )}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 flex items-center justify-center gap-1.5 shadow-md"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 flex items-center justify-center gap-1.5 shadow-md"
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

          {/* User Management Section */}
          <div className="pt-6 border-t border-meyhane-border space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-serif text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-gold" />
                  Kullanıcı Yönetimi
                </h3>
                <p className="text-[11px] text-gray-400 mt-1">Yönetici ve host hesaplarını yönetin.</p>
              </div>
            </div>

            {userMsg && (
              <div className="p-3 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs animate-fadeIn">
                {userMsg}
              </div>
            )}

            {/* Admins List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                  Yöneticiler
                </h4>
                <button
                  onClick={() => { setShowAddUserModal('admin'); setNewUserForm({ username: '', password: '', displayName: '', name: '', pin: '', permissions: ['reservations'] }); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold text-[11px] font-semibold border border-gold/30 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Yönetici Ekle
                </button>
              </div>
              <div className="space-y-2">
                {userAdmins.map((admin: any) => (
                  <div key={admin.id} className="flex items-center justify-between p-3 rounded-xl bg-meyhane-bg border border-meyhane-border hover:border-gold/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${admin.role === 'founder' ? 'bg-gold/20 text-gold border border-gold/40' : 'bg-white/10 text-white border border-meyhane-border'}`}>
                        {admin.role === 'founder' ? <Crown className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          {admin.displayName}
                          {admin.role === 'founder' && <span className="px-1.5 py-0.5 rounded-full bg-gold/15 text-gold text-[9px] font-bold uppercase">Kurucu</span>}
                        </div>
                        <div className="text-[10px] text-meyhane-muted">@{admin.username}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">{(admin.permissions || []).length} yetki</span>
                      {admin.role !== 'founder' && (
                        <button
                          onClick={async () => {
                            if (!confirm(`${admin.displayName} silinsin mi?`)) return;
                            const res = await fetch(`/api/admin/users?type=admin&id=${admin.id}`, { method: 'DELETE' });
                            const json = await res.json();
                            if (json.success) {
                              setUserAdmins(prev => prev.filter((a: any) => a.id !== admin.id));
                              setUserMsg('Yönetici silindi.');
                              setTimeout(() => setUserMsg(''), 3000);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {userAdmins.length === 0 && <p className="text-xs text-meyhane-muted italic">Henüz yönetici eklenmemiş.</p>}
              </div>
            </div>

            {/* Hosts List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-gold" />
                  Host Kullanıcıları
                </h4>
                <button
                  onClick={() => { setShowAddUserModal('host'); setNewUserForm({ username: '', password: '', displayName: '', name: '', pin: '', permissions: [] }); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold text-[11px] font-semibold border border-gold/30 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Host Ekle
                </button>
              </div>
              <div className="space-y-2">
                {userHosts.map((host: any) => (
                  <div key={host.id} className="flex items-center justify-between p-3 rounded-xl bg-meyhane-bg border border-meyhane-border hover:border-gold/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{host.name}</div>
                        <div className="text-[10px] text-meyhane-muted">PIN: {'•'.repeat(host.pinLength || 4)} · {host.active !== false ? 'Aktif' : 'Pasif'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          const newActive = host.active === false ? true : false;
                          const res = await fetch('/api/admin/users', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'host', id: host.id, active: newActive }),
                          });
                          const json = await res.json();
                          if (json.success) {
                            setUserHosts(prev => prev.map((h: any) => h.id === host.id ? { ...h, active: newActive } : h));
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${host.active !== false ? 'bg-emerald-500/15 text-emerald-400 hover:bg-red-500/15 hover:text-red-400' : 'bg-red-500/15 text-red-400 hover:bg-emerald-500/15 hover:text-emerald-400'}`}
                      >
                        {host.active !== false ? 'Pasife Al' : 'Aktife Al'}
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`${host.name} silinsin mi?`)) return;
                          const res = await fetch(`/api/admin/users?type=host&id=${host.id}`, { method: 'DELETE' });
                          const json = await res.json();
                          if (json.success) {
                            setUserHosts(prev => prev.filter((h: any) => h.id !== host.id));
                            setUserMsg('Host silindi.');
                            setTimeout(() => setUserMsg(''), 3000);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {userHosts.length === 0 && <p className="text-xs text-meyhane-muted italic">Henüz host eklenmemiş.</p>}
              </div>
            </div>

            {/* Waiters List */}
            <div className="space-y-3 pt-2 border-t border-meyhane-border/70">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-gold" />
                  Garson &amp; Servis Personeli
                </h4>
                <button
                  onClick={() => { setShowAddUserModal('waiter'); setNewUserForm({ username: '', password: '', displayName: '', name: '', pin: '', permissions: [] }); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold text-[11px] font-semibold border border-gold/30 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Garson Ekle
                </button>
              </div>
              <div className="space-y-2">
                {userWaiters.map((waiter: any) => (
                  <div key={waiter.id} className="flex items-center justify-between p-3 rounded-xl bg-meyhane-bg border border-meyhane-border hover:border-gold/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{waiter.name}</div>
                        <div className="text-[10px] text-meyhane-muted">PIN: {'•'.repeat(waiter.pinLength || 4)} · {waiter.active !== false ? 'Aktif' : 'Pasif'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          const newActive = waiter.active === false ? true : false;
                          const res = await fetch('/api/admin/users', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'waiter', id: waiter.id, active: newActive }),
                          });
                          const json = await res.json();
                          if (json.success) {
                            setUserWaiters(prev => prev.map((w: any) => w.id === waiter.id ? { ...w, active: newActive } : w));
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${waiter.active !== false ? 'bg-emerald-500/15 text-emerald-400 hover:bg-red-500/15 hover:text-red-400' : 'bg-red-500/15 text-red-400 hover:bg-emerald-500/15 hover:text-emerald-400'}`}
                      >
                        {waiter.active !== false ? 'Pasife Al' : 'Aktife Al'}
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`${waiter.name} silinsin mi?`)) return;
                          const res = await fetch(`/api/admin/users?type=waiter&id=${waiter.id}`, { method: 'DELETE' });
                          const json = await res.json();
                          if (json.success) {
                            setUserWaiters(prev => prev.filter((w: any) => w.id !== waiter.id));
                            setUserMsg('Garson silindi.');
                            setTimeout(() => setUserMsg(''), 3000);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {userWaiters.length === 0 && <p className="text-xs text-meyhane-muted italic">Henüz garson eklenmemiş.</p>}
              </div>
            </div>
          </div>

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
                    suppressHydrationWarning={true}
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-gray-300 font-semibold text-xs">Masa Seçimi</label>
                  <button
                    type="button"
                    onClick={() => {
                      setFloorDate(newRes.date);
                      setActiveTab('floor');
                      setFloorViewMode('canvas');
                      setShowAddResModal(false);
                    }}
                    className="text-gold hover:text-white text-xs font-semibold flex items-center gap-1 hover:underline transition-colors"
                    title="2D Mimari krokiden tıklayarak masa seçin"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>🗺️ Krokiden Masa Seç</span>
                  </button>
                </div>
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
                  className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none cursor-pointer text-xs"
                >
                  {tablesList.map(t => {
                    const isOccupied = reservations.some(
                      r => r.date === newRes.date &&
                           r.status !== 'cancelled' &&
                           (r.tableId === t.id || r.tableId?.includes(t.id))
                    );
                    return (
                      <option key={t.id} value={t.id}>
                        {t.number} ({t.capacity} Kişi - {t.sectionId}) {isOccupied ? '⚠️ [Seçili Tarihte Dolu]' : '✓ [Boş / Müsait]'}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-gray-400">
                  Dilerseniz &ldquo;🗺️ Krokiden Masa Seç&rdquo; butonuna basarak doğrudan kroki üzerinden istediğiniz masaya tıklayıp rezervasyon alabilirsiniz.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold text-xs flex items-center justify-between">
                  <span>🍽️ Menü Paketi Tercihi *</span>
                  <span className="text-[10px] text-gold font-normal">Fiks / A La Carte</span>
                </label>
                <select
                  value={newRes.packageId || 'premium_fix'}
                  onChange={(e) => setNewRes({ ...newRes, packageId: e.target.value as any })}
                  className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="premium_fix">HayalMest Gurme &amp; Rakı Menüsü (Premium Fiks)</option>
                  <option value="standart_fix">Klasik Meyhane Fiks Menüsü</option>
                  <option value="alacarte">A La Carte (Serbest Menü Seçimi)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold text-xs flex items-center justify-between">
                  <span>📝 Özel İstekler / Açıklama Notu</span>
                  <span className="text-[10px] text-gray-500 font-normal">Opsiyonel</span>
                </label>
                <textarea
                  rows={2}
                  value={newRes.specialRequests || ''}
                  onChange={(e) => setNewRes({ ...newRes, specialRequests: e.target.value })}
                  placeholder="Örn: Doğum günü pastası, sahneye yakın masa, pencere kenarı, fındık alerjisi..."
                  className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none placeholder-gray-600 resize-none text-xs"
                />
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
          tables={tablesList}
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

              {/* Table QR Menu & Live Waiter Caller Action */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setQrModalTable(selectedFloorTable)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 hover:from-gold/30 hover:to-gold/20 text-gold border border-gold/40 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md group"
                >
                  <QrCode className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
                  <span>Masaya Özel Canlı QR Menü &amp; Kod (İndir / Yazdır)</span>
                </button>
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

      {/* Table-specific QR Code Modal */}
      {qrModalTable && (
        <TableQrCodeModal
          table={qrModalTable}
          onClose={() => setQrModalTable(null)}
        />
      )}

      {/* CUSTOMER HISTORY & PROFILE MODAL */}
      {selectedCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn">
          <div className="luxury-card max-w-2xl w-full rounded-3xl p-6 sm:p-8 border border-gold/40 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-meyhane-border/70 pb-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-md font-serif ${
                  selectedCustomerModal.isVip
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black ring-2 ring-gold/60'
                    : 'bg-white/10 text-white border border-white/15'
                }`}>
                  {selectedCustomerModal.fullName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
                      {selectedCustomerModal.fullName}
                    </h2>
                    {selectedCustomerModal.isVip && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        VIP Müdavim
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">
                    {selectedCustomerModal.phone} {selectedCustomerModal.email && `• ${selectedCustomerModal.email}`}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomerModal(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-meyhane-bg/70 border border-meyhane-border space-y-0.5">
                <span className="text-meyhane-muted block text-[10px] uppercase">Toplam Rezervasyon</span>
                <span className="text-white font-bold font-serif text-base">{selectedCustomerModal.totalReservations} Adet</span>
                <span className="text-[10px] text-gray-400 block">{selectedCustomerModal.confirmedCount + selectedCustomerModal.seatedCount} Başarılı • {selectedCustomerModal.cancelledCount} İptal</span>
              </div>
              <div className="p-3 rounded-xl bg-meyhane-bg/70 border border-meyhane-border space-y-0.5">
                <span className="text-meyhane-muted block text-[10px] uppercase">Getirilen Misafir</span>
                <span className="text-gold font-bold font-serif text-base">{selectedCustomerModal.totalGuests} Kişi</span>
                <span className="text-[10px] text-gray-400 block">Ort. {Math.round(selectedCustomerModal.totalGuests / (selectedCustomerModal.totalReservations || 1))} kişi / rez</span>
              </div>
              <div className="p-3 rounded-xl bg-meyhane-bg/70 border border-meyhane-border space-y-0.5">
                <span className="text-meyhane-muted block text-[10px] uppercase">Favori Alan</span>
                <span className="text-emerald-400 font-bold text-sm truncate block">{selectedCustomerModal.favoriteSection}</span>
                <span className="text-[10px] text-gray-400 block">Masa: {selectedCustomerModal.favoriteTable ? formatTableDisplay(selectedCustomerModal.favoriteTable, undefined, tablesList) : '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-meyhane-bg/70 border border-meyhane-border space-y-0.5">
                <span className="text-meyhane-muted block text-[10px] uppercase">Son Ziyaret</span>
                <span className="text-blue-400 font-bold text-sm block">{selectedCustomerModal.lastVisit || '-'}</span>
                <span className="text-[10px] text-gray-400 block">İlk: {selectedCustomerModal.firstVisit || '-'}</span>
              </div>
            </div>

            {/* Notes & Allergies if exists */}
            {(selectedCustomerModal.adminNotes || selectedCustomerModal.allergyNotes) && (
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-2">
                {selectedCustomerModal.adminNotes && (
                  <div className="flex items-start gap-2 text-amber-200">
                    <span className="text-gold font-bold">📌 Yönetici Notu:</span>
                    <span>{selectedCustomerModal.adminNotes}</span>
                  </div>
                )}
                {selectedCustomerModal.allergyNotes && (
                  <div className="flex items-start gap-2 text-red-300">
                    <span className="font-bold">⚠️ Alerji / Hassasiyet:</span>
                    <span>{selectedCustomerModal.allergyNotes}</span>
                  </div>
                )}
              </div>
            )}

            {/* Reservation History List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-gold" />
                  Tüm Rezervasyon Geçmişi ({selectedCustomerModal.reservations.length})
                </span>
                <span className="text-gray-400 text-[11px]">En yeniden eskiye sıralı</span>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {selectedCustomerModal.reservations.length === 0 ? (
                  <div className="p-4 rounded-xl bg-meyhane-bg text-center text-gray-400 text-xs">
                    Kayıtlı rezervasyon bulunamadı.
                  </div>
                ) : (
                  selectedCustomerModal.reservations.map((res) => {
                    const statusBadge = 
                      res.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      res.status === 'seated' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                      res.status === 'cancelled' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/30';
                    const statusText =
                      res.status === 'confirmed' ? 'Onaylandı' :
                      res.status === 'seated' ? 'Masada' :
                      res.status === 'cancelled' ? 'İptal' : 'Beklemede';

                    return (
                      <div
                        key={res.id}
                        className="p-3 rounded-xl bg-meyhane-bg/90 border border-meyhane-border hover:border-gold/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-gold font-bold">#{res.pnr}</span>
                            <span className="text-white font-semibold flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {res.date} • {res.time}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                              {statusText}
                            </span>
                          </div>

                          <div className="text-[11px] text-gray-400 flex items-center gap-2 flex-wrap">
                            <span>Masa: <strong className="text-gray-200">{formatTableDisplay(res.tableId, res.sectionId, tablesList)}</strong> ({res.sectionId})</span>
                            <span>•</span>
                            <span>{res.guestCount} Kişi</span>
                            <span>•</span>
                            <span>{res.occasion}</span>
                          </div>

                          {res.specialRequests && (
                            <div className="text-[11px] text-amber-200/80 italic">
                              Not: &quot;{res.specialRequests}&quot;
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReservationModal(res);
                              setSelectedCustomerModal(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-gold/20 text-gray-300 hover:text-gold border border-white/10 text-[11px] flex items-center gap-1 transition-colors"
                            title="Rezervasyon detay kartını ve durum değiştirme penceresini aç"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Detay</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-meyhane-border/70 text-xs">
              <div className="flex items-center gap-2">
                <a
                  href={getWhatsAppUrl(selectedCustomerModal.phone, selectedCustomerModal.fullName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`tel:${selectedCustomerModal.phone.replace(/\s+/g, '')}`}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-gold border border-white/10 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Ara</span>
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cust = selectedCustomerModal;
                    setSelectedCustomerModal(null);
                    setEditingCustomerNote(cust);
                    setCustomerNoteForm({
                      isVip: cust.isVip,
                      adminNotes: cust.adminNotes,
                      allergyNotes: cust.allergyNotes,
                      tags: cust.tags.filter(t => !t.includes('VIP') && !t.includes('Misafir') && !t.includes('Grup') && !t.includes('İptal')).join(', '),
                    });
                  }}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-gold/20 text-gray-300 hover:text-gold border border-white/10 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Notu Düzenle</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const cust = selectedCustomerModal;
                    setSelectedCustomerModal(null);
                    handleQuickBookForCustomer(cust);
                  }}
                  className="px-4 py-2 rounded-xl bg-gold text-black font-bold uppercase tracking-wider hover:brightness-110 flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Hızlı Rezervasyon Aç</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* EDIT CUSTOMER NOTE & VIP MODAL */}
      {editingCustomerNote && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn">
          <div className="luxury-card max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-gold/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-meyhane-border/70 pb-3">
              <div>
                <h2 className="text-base font-bold font-serif text-white flex items-center gap-2">
                  <Crown className="w-4 h-4 text-gold" />
                  <span>Misafir Notu &amp; VIP Düzenleme</span>
                </h2>
                <p className="text-xs text-gold font-medium mt-0.5">
                  {editingCustomerNote.fullName} ({editingCustomerNote.phone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCustomerNote(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomerNotes} className="space-y-4 text-xs">
              
              {/* VIP Toggle Checkbox */}
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/40 cursor-pointer hover:bg-amber-950/30 transition-colors">
                <input
                  type="checkbox"
                  checked={customerNoteForm.isVip}
                  onChange={(e) => setCustomerNoteForm({ ...customerNoteForm, isVip: e.target.checked })}
                  className="w-4 h-4 rounded text-gold focus:ring-gold bg-meyhane-bg border-gray-600 cursor-pointer"
                />
                <div>
                  <span className="text-white font-bold text-xs block">VIP &amp; Müdavim Misafir</span>
                  <span className="text-[11px] text-gray-400 block">
                    İşaretlendiğinde portföyde ve rezervasyonlarda altın VIP tacı ile öncelikli gösterilir.
                  </span>
                </div>
              </label>

              {/* Admin Private Notes */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-semibold block flex items-center justify-between">
                  <span>📌 Yönetici Özel Notu</span>
                  <span className="text-[10px] text-gray-500 font-normal">Sadece adminler görür</span>
                </label>
                <textarea
                  rows={3}
                  value={customerNoteForm.adminNotes}
                  onChange={(e) => setCustomerNoteForm({ ...customerNoteForm, adminNotes: e.target.value })}
                  placeholder="Örn: Sanatçı yakını, sahne önü masaları tercih eder, bahşiş konusunda cömert..."
                  className="w-full bg-meyhane-bg border border-meyhane-border p-3 rounded-xl text-white focus:border-gold focus:outline-none placeholder-gray-600 resize-none text-xs"
                />
              </div>

              {/* Allergy & Dietary Notes */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-semibold block flex items-center justify-between">
                  <span>⚠️ Alerji / Hassasiyet / Tercihler</span>
                  <span className="text-[10px] text-red-400/80 font-normal">Mutfak &amp; Servis Uyarısı</span>
                </label>
                <textarea
                  rows={2}
                  value={customerNoteForm.allergyNotes}
                  onChange={(e) => setCustomerNoteForm({ ...customerNoteForm, allergyNotes: e.target.value })}
                  placeholder="Örn: Kabuklu deniz ürünleri alerjisi var, etler az pişmiş olmalı..."
                  className="w-full bg-meyhane-bg border border-meyhane-border p-3 rounded-xl text-white focus:border-gold focus:outline-none placeholder-gray-600 resize-none text-xs"
                />
              </div>

              {/* Custom Tags */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-semibold block flex items-center justify-between">
                  <span>🏷️ Özel Etiketler (Virgülle ayırın)</span>
                  <span className="text-[10px] text-gray-500 font-normal">Filtreleme ve arama için</span>
                </label>
                <input
                  type="text"
                  value={customerNoteForm.tags}
                  onChange={(e) => setCustomerNoteForm({ ...customerNoteForm, tags: e.target.value })}
                  placeholder="Şirket Yemeği, Sanatçı Dostu, Doğum Günü, Gurme"
                  className="w-full bg-meyhane-bg border border-meyhane-border p-3 rounded-xl text-white focus:border-gold focus:outline-none placeholder-gray-600 text-xs"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-meyhane-border/70">
                <button
                  type="button"
                  onClick={() => setEditingCustomerNote(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gold text-black font-bold uppercase tracking-wider hover:brightness-110 shadow-lg text-xs"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* FLOATING ACTION DRAWER (Açılır Çekmece - Varlık Ekle Tarzı) */}
      {showHamburgerMenu && (
        <>
          {/* Subtle click-away backdrop */}
          <div
            onClick={() => setShowHamburgerMenu(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-fadeIn"
          />

          {/* Floating Luxury Card Drawer pinned near top-right header */}
          <div className="fixed top-16 sm:top-20 left-3 right-3 sm:left-auto sm:right-6 z-50 sm:w-88 max-h-[85vh] overflow-y-auto luxury-card rounded-3xl p-5 border-2 border-gold/60 shadow-2xl backdrop-blur-2xl animate-fadeIn space-y-4">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-meyhane-border/70 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold uppercase tracking-wider text-gold font-serif">Hızlı Yönetim Menüsü</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHamburgerMenu(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions List */}
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowHamburgerMenu(false);
                  setShowAddResModal(true);
                }}
                className="w-full p-3 rounded-xl bg-gold text-black font-bold flex items-center gap-2.5 shadow-md hover:brightness-110 transition-all text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Telefonla Rezervasyon Aç</span>
              </button>

              <Link
                href="/host"
                onClick={() => setShowHamburgerMenu(false)}
                className="w-full p-2.5 rounded-xl bg-meyhane-surface hover:bg-gold/15 border border-gold/40 text-gold font-semibold flex items-center gap-2.5 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                <span>Host Masası (Kapı Masa Bulucu)</span>
              </Link>

              <Link
                href="/garson"
                onClick={() => setShowHamburgerMenu(false)}
                className="w-full p-2.5 rounded-xl bg-meyhane-surface hover:bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold flex items-center gap-2.5 transition-colors"
              >
                <Utensils className="w-4 h-4" />
                <span>Garson Paneli (Masa Çağrıları)</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  fetchAllData();
                  setShowHamburgerMenu(false);
                }}
                className="w-full p-2.5 rounded-xl bg-meyhane-surface hover:bg-white/10 border border-meyhane-border text-gray-200 flex items-center gap-2.5 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-gold' : ''}`} />
                <span>Tüm Verileri Yenile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowStats(!showStats);
                  setShowHamburgerMenu(false);
                }}
                className="w-full p-2.5 rounded-xl bg-meyhane-surface hover:bg-white/10 border border-meyhane-border text-gray-200 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart2 className="w-4 h-4 text-gold" />
                  <span>KPI &amp; İstatistik Şeridi</span>
                </div>
                <span className="text-[10px] text-gold font-bold bg-gold/15 px-2 py-0.5 rounded">{showStats ? 'Açık' : 'Gizli'}</span>
              </button>

              <Link
                href="/"
                target="_blank"
                className="w-full p-2.5 rounded-xl bg-meyhane-surface hover:bg-white/10 border border-meyhane-border text-gray-300 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                  <span>Canlı Siteyi Aç</span>
                </div>
                <span className="text-[10px] text-gray-500">↗</span>
              </Link>
            </div>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-meyhane-border/70">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Güvenli Çıkış Yap</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 flex items-center justify-center animate-fadeIn">
          <div className="luxury-card max-w-md w-full rounded-3xl p-6 sm:p-8 border border-gold/40 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-meyhane-border pb-3">
              <h2 className="text-base font-bold font-serif text-white flex items-center gap-2">
                {showAddUserModal === 'admin' ? (
                  <ShieldCheck className="w-4 h-4 text-gold" />
                ) : showAddUserModal === 'host' ? (
                  <UserCheck className="w-4 h-4 text-gold" />
                ) : (
                  <Utensils className="w-4 h-4 text-gold" />
                )}
                {showAddUserModal === 'admin' ? 'Yeni Yönetici Ekle' : showAddUserModal === 'host' ? 'Yeni Host Ekle' : 'Yeni Garson Ekle'}
              </h2>
              <button onClick={() => setShowAddUserModal(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const body = showAddUserModal === 'admin'
                    ? { type: 'admin', username: newUserForm.username, password: newUserForm.password, displayName: newUserForm.displayName, permissions: newUserForm.permissions, createdBy: 'admin' }
                    : showAddUserModal === 'host'
                    ? { type: 'host', name: newUserForm.name, pin: newUserForm.pin, createdBy: 'admin' }
                    : { type: 'waiter', name: newUserForm.name, pin: newUserForm.pin, createdBy: 'admin' };
                  const res = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                  });
                  const json = await res.json();
                  if (json.success) {
                    // Re-fetch users
                    const usersRes = await fetch('/api/admin/users').then(r => r.json()).catch(() => ({}));
                    if (usersRes?.success) {
                      setUserAdmins(usersRes.admins || []);
                      setUserHosts(usersRes.hosts || []);
                      setUserWaiters(usersRes.waiters || []);
                    }
                    setShowAddUserModal(null);
                    setUserMsg(
                      showAddUserModal === 'admin' 
                        ? 'Yönetici başarıyla eklendi.' 
                        : showAddUserModal === 'host' 
                        ? 'Host başarıyla eklendi.' 
                        : 'Garson başarıyla eklendi.'
                    );
                    setTimeout(() => setUserMsg(''), 3000);
                  } else {
                    alert(json.error || 'Hata oluştu.');
                  }
                } catch {
                  alert('Bağlantı hatası.');
                }
              }}
              className="space-y-4 text-xs"
            >
              {showAddUserModal === 'admin' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-semibold uppercase tracking-wider">Görünen Ad *</label>
                    <input
                      type="text" required value={newUserForm.displayName}
                      onChange={(e) => setNewUserForm({ ...newUserForm, displayName: e.target.value })}
                      placeholder="Örn: Müdür Mehmet"
                      className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-semibold uppercase tracking-wider">Kullanıcı Adı *</label>
                    <input
                      type="text" required value={newUserForm.username}
                      onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                      placeholder="Örn: mehmet"
                      className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-semibold uppercase tracking-wider">Şifre *</label>
                    <input
                      type="password" required value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      placeholder="En az 4 karakter"
                      className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-gray-300 font-semibold uppercase tracking-wider">Yetkiler</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'reservations', label: 'Rezervasyonlar' },
                        { key: 'customers', label: 'Misafirler' },
                        { key: 'floor', label: 'Kuşbakışı' },
                        { key: 'designer', label: 'Salon Tasarımcısı' },
                        { key: 'events', label: 'Etkinlikler' },
                        { key: 'menu', label: 'Menü' },
                        { key: 'content', label: 'İçerik' },
                        { key: 'settings', label: 'Ayarlar' },
                      ].map(perm => (
                        <label key={perm.key} className="flex items-center gap-2 p-2 rounded-lg bg-meyhane-bg border border-meyhane-border cursor-pointer hover:border-gold/30 transition-colors">
                          <input
                            type="checkbox"
                            checked={newUserForm.permissions.includes(perm.key)}
                            onChange={(e) => {
                              const perms = e.target.checked
                                ? [...newUserForm.permissions, perm.key]
                                : newUserForm.permissions.filter(p => p !== perm.key);
                              setNewUserForm({ ...newUserForm, permissions: perms });
                            }}
                            className="accent-gold"
                          />
                          <span className="text-gray-300">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              ) : showAddUserModal === 'host' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-semibold uppercase tracking-wider">Host Adı *</label>
                    <input
                      type="text" required value={newUserForm.name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                      placeholder="Örn: Ahmet"
                      className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-semibold uppercase tracking-wider">PIN Kodu * (4-6 Haneli)</label>
                    <input
                      type="text" required maxLength={6} value={newUserForm.pin}
                      onChange={(e) => setNewUserForm({ ...newUserForm, pin: e.target.value.replace(/\D/g, '') })}
                      placeholder="Örn: 1234"
                      className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none text-center tracking-[0.5em] text-lg font-mono"
                    />
                    <p className="text-[10px] text-meyhane-muted">Host bu PIN ile giriş yapacaktır.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-semibold uppercase tracking-wider">Garson Adı &amp; Ünvanı *</label>
                    <input
                      type="text" required value={newUserForm.name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                      placeholder="Örn: Garson Mehmet / Şef Garson Ali"
                      className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-semibold uppercase tracking-wider">PIN Kodu * (4-6 Haneli)</label>
                    <input
                      type="text" required maxLength={6} value={newUserForm.pin}
                      onChange={(e) => setNewUserForm({ ...newUserForm, pin: e.target.value.replace(/\D/g, '') })}
                      placeholder="Örn: 5678"
                      className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none text-center tracking-[0.5em] text-lg font-mono"
                    />
                    <p className="text-[10px] text-meyhane-muted">Garson masabaşında bu PIN ile panele giriş yapacaktır.</p>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-meyhane-border transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 via-gold to-gold-600 text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/25 transition-all"
                >
                  {showAddUserModal === 'admin' ? 'Yönetici Ekle' : showAddUserModal === 'host' ? 'Host Ekle' : 'Garson Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
