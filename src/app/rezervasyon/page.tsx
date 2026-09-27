'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Calendar, 
  Users, 
  Clock, 
  Wine, 
  Utensils, 
  Sparkles, 
  CheckCircle, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Phone, 
  Mail, 
  User, 
  PartyPopper,
  Music,
  MapPin,
  Copy,
  Layers,
  LayoutGrid
} from 'lucide-react';
import { VENUE_SECTIONS, FIX_PACKAGES, ALL_TABLES } from '@/data/tablesData';
import { StageEvent } from '@/data/eventsData';
import { formatTableDisplay } from '@/lib/formatters';
import { getNextEventDate } from '@/lib/dateUtils';
import SeatingFloorPlan from '@/components/SeatingFloorPlan';

function ReservationContent() {
  const searchParams = useSearchParams();

  // Wizard Step (1 to 5, 6 is Success)
  const [step, setStep] = useState(1);

  // Form State
  const [date, setDate] = useState(() => {
    return searchParams.get('date') || new Date().toISOString().split('T')[0];
  });
  const [time, setTime] = useState('20:00');
  const [serviceType, setServiceType] = useState('Canlı Fasıl Akşamı (20:00)');
  const [guestCount, setGuestCount] = useState<number>(() => {
    const g = searchParams.get('guests');
    return g ? parseInt(g, 10) : 4;
  });
  const [occasion, setOccasion] = useState(() => {
    return searchParams.get('occasion') || 'Arkadaş Buluşması / Muhabbet';
  });
  const [sectionId, setSectionId] = useState<'vip_sahne' | 'salon' | 'bahce' | 'loca'>('salon');
  const [tableId, setTableId] = useState<string>('any');
  const [packageId, setPackageId] = useState<'standart_fix' | 'premium_fix' | 'alacarte'>('premium_fix');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // View mode in Step 3: 'map' (Kuşbakışı harita) or 'cards' (Bölge kartları)
  const [seatingViewMode, setSeatingViewMode] = useState<'map' | 'cards'>('map');

  // Dynamic events and reservations
  const [allEvents, setAllEvents] = useState<StageEvent[]>([]);
  const [currentDayEvent, setCurrentDayEvent] = useState<StageEvent | null>(null);
  const [occupiedTableIds, setOccupiedTableIds] = useState<string[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedPnr, setCopiedPnr] = useState(false);

  // Fetch events on mount and auto-align with requested event
  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setAllEvents(json.data);

          const evParam = searchParams.get('event');
          const dateParam = searchParams.get('date');

          if (evParam) {
            const ev = json.data.find((e: any) => e.id === evParam);
            if (ev) {
              if (!dateParam) {
                const targetDate = getNextEventDate(ev);
                setDate(targetDate);
              }
              const cleanTime = ev.time?.split(' - ')[0] || '20:00';
              setTime(cleanTime);
              setServiceType(`${ev.title} (${cleanTime})`);
            }
          }
        }
      })
      .catch(err => console.error('Events error:', err));
  }, [searchParams]);

  // Compute event on chosen date
  useEffect(() => {
    if (!date) return;
    const dayIndex = new Date(date + 'T00:00:00').getDay();
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const currentDayName = dayNames[dayIndex];

    const matched = allEvents.find(e => 
      e.day.toLowerCase().includes(currentDayName.toLowerCase()) ||
      e.dateStr === date
    );

    setCurrentDayEvent(matched || (allEvents.length > 0 ? allEvents[0] : null));
  }, [date, allEvents]);

  // Fetch occupied tables for selected date
  useEffect(() => {
    if (!date) return;
    fetch('/api/reservations')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          const occ: string[] = [];
          json.data.forEach((r: any) => {
            if (r.date === date && r.status !== 'cancelled') {
              if (r.tableId && r.tableId !== 'any' && !r.tableId.includes('-auto')) {
                if (r.tableId.includes('+')) {
                  occ.push(...r.tableId.split('+'));
                } else {
                  occ.push(r.tableId);
                }
              }
            }
          });
          setOccupiedTableIds(occ);
        }
      })
      .catch(err => console.error('Occupancy error:', err));
  }, [date]);

  const currentSection = VENUE_SECTIONS.find(s => s.id === sectionId) || VENUE_SECTIONS[1];

  const occasions = [
    'Arkadaş Buluşması / Muhabbet',
    'Doğum Günü Kutlaması',
    'Bekarlığa Veda Partisi',
    'Şirket & İş Yemeği',
    'Yıl Dönümü & Romantik Akşam',
    'Aile Buluşması',
    'Diğer Özel Kutlama'
  ];

  const timeSlots = [
    { time: '18:30', label: 'Erken Akşam Yemeği', icon: '☀️' },
    { time: '19:30', label: 'Klasik Meyhane Seansı', icon: '🍷' },
    { time: '20:00', label: 'Canlı Fasıl & Gala Başlangıcı', icon: '🎵', badge: 'Popüler' },
    { time: '20:30', label: 'Fasıl & Sahne Seansı', icon: '🎶', badge: 'En Çok Tercih Edilen' },
    { time: '21:00', label: 'Gece Eğlencesi & Muhabbet', icon: '🌙' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // If table is still 'any', assign an available table fitting the party
      let finalTableId = tableId;
      if (finalTableId === 'any') {
        const availableInSec = currentSection.tables.find(
          t => !occupiedTableIds.includes(t.id) && t.capacity >= guestCount
        );
        finalTableId = availableInSec ? availableInSec.id : `${sectionId}-auto`;
      }

      const payload = {
        fullName,
        phone,
        email,
        date,
        time,
        serviceType,
        guestCount,
        occasion,
        sectionId,
        tableId: finalTableId,
        packageId,
        specialRequests,
      };

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Rezervasyon oluşturulamadı.');
      }

      setConfirmedReservation(json.data);
      setStep(6);
    } catch (err: any) {
      setErrorMessage(err.message || 'Bir hata oluştu, lütfen bilgilerinizi kontrol ediniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPnr(true);
    setTimeout(() => setCopiedPnr(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
      
      {/* Page Title */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Kuşbakışı Masa Seçimli Online Rezervasyon</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-white">
          HayalMest Masanızı Ayırtın
        </h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto font-light">
          İstediğiniz tarihi, canlı müzik programını ve koltuğunuzu seçerek meyhane keyfinizi güvenceye alın.
        </p>
      </div>

      {/* Progress Stepper */}
      {step < 6 && (
        <div className="mb-10">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-meyhane-border -translate-y-1/2 z-0" />
            
            {[1, 2, 3, 4, 5].map((s) => {
              const isActive = step === s;
              const isPast = step > s;
              return (
                <div key={s} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isActive
                        ? 'bg-gold text-black ring-4 ring-gold/20 scale-110'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-meyhane-card text-gray-400 border border-meyhane-border'
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4" /> : s}
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-400 mt-1.5 hidden sm:block">
                    {s === 1 && 'Tarih & Sahne'}
                    {s === 2 && 'Kişi & Kutlama'}
                    {s === 3 && 'Kuşbakışı Masa'}
                    {s === 4 && 'Menü Paketi'}
                    {s === 5 && 'İletişim'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP CONTAINER */}
      <div className="luxury-card rounded-3xl p-6 sm:p-10 border border-meyhane-border shadow-2xl relative">
        
        {/* STEP 1: TARİH & DİNAMİK SAHNE ETKİNLİĞİ */}
        {step === 1 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold font-serif text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold" />
                1. Adım: Ne Zaman Gelmek İstersiniz?
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Lütfen tarihinizi seçiniz; seçtiğiniz güne ait canlı fasıl programı otomatik görüntülenecektir.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Date Input */}
              <div className="p-5 rounded-2xl bg-meyhane-bg/70 border border-meyhane-border space-y-2">
                <label className="text-xs uppercase tracking-wider text-gray-300 font-semibold block">
                  Rezervasyon Tarihi
                </label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-meyhane-surface text-white px-4 py-3 rounded-xl border border-meyhane-border focus:border-gold focus:outline-none text-base font-medium cursor-pointer"
                  required
                />
                <p className="text-[11px] text-meyhane-muted pt-1">
                  Seçilen Tarih: <span className="text-gold font-medium">{date}</span>
                </p>
              </div>

              {/* Dynamic Event Matching Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-gold/15 via-meyhane-surface to-transparent border border-gold/40 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gold text-xs font-bold uppercase tracking-wider">
                    <Music className="w-4 h-4 animate-pulse" />
                    <span>O Gün Sahnede</span>
                  </div>
                  {currentDayEvent?.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-gold text-black text-[9px] font-bold uppercase">
                      {currentDayEvent.badge}
                    </span>
                  )}
                </div>

                {currentDayEvent ? (
                  <div className="space-y-1">
                    <div className="text-base font-bold text-white font-serif">
                      {currentDayEvent.title}
                    </div>
                    <div className="text-xs text-gold-300 font-semibold">
                      {currentDayEvent.performer}
                    </div>
                    <p className="text-[11px] text-gray-300 line-clamp-2 mt-1">
                      {currentDayEvent.description}
                    </p>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">
                    Özel Meyhane Akşamı ve Seçkin Müzikler eşliğinde hizmetinizdeyiz.
                  </div>
                )}

                <div className="text-[10px] text-meyhane-muted pt-1 border-t border-white/10 flex items-center justify-between">
                  <span>Saat: {currentDayEvent?.time || '20:00 - 01:00'}</span>
                  <span className="text-emerald-400 font-medium">Canlı Performans</span>
                </div>
              </div>
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider text-gray-300 font-semibold block">
                Geliş Saati &amp; Seans Tercihi
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {timeSlots.map((slot) => {
                  const isSelected = time === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => {
                        setTime(slot.time);
                        setServiceType(`${slot.label} (${slot.time})`);
                      }}
                      className={`p-4 rounded-xl text-left border transition-all relative ${
                        isSelected
                          ? 'bg-gold/15 border-gold shadow-lg shadow-gold/10 ring-1 ring-gold'
                          : 'bg-meyhane-bg/60 border-meyhane-border hover:border-gray-500'
                      }`}
                    >
                      {slot.badge && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gold text-black text-[9px] font-bold uppercase tracking-wider">
                          {slot.badge}
                        </span>
                      )}
                      <div className="text-xl mb-1">{slot.icon}</div>
                      <div className="text-lg font-bold text-white font-serif">{slot.time}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{slot.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-8 py-3.5 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/20 flex items-center gap-2"
              >
                <span>Devam Et: Kişi Sayısı</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: KİŞİ SAYISI & KUTLAMA AMACI */}
        {step === 2 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold font-serif text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-gold" />
                2. Adım: Kaç Kişi Olacaksınız?
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Kişi sayınızı seçin. 6 veya daha fazla kişi için sistemimiz otomatik masa birleştirme teklif edebilir.
              </p>
            </div>

            {/* Guest Count Selector */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider text-gray-300 font-semibold block">
                Kişi Sayısı
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[2, 4, 6, 8, 10, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGuestCount(num)}
                    className={`py-4 px-3 rounded-2xl border text-center transition-all ${
                      guestCount === num
                        ? 'bg-gold text-black font-bold border-gold shadow-lg shadow-gold/20 scale-105'
                        : 'bg-meyhane-bg/70 text-white border-meyhane-border hover:border-gray-500'
                    }`}
                  >
                    <div className="text-xl font-serif">{num}</div>
                    <div className="text-[10px] uppercase tracking-wider mt-0.5">Kişi</div>
                  </button>
                ))}
              </div>

              {/* Custom Guest count input */}
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs text-meyhane-muted">Farklı kişi sayısı için:</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 bg-meyhane-surface border border-meyhane-border px-3 py-1.5 rounded-lg text-white text-sm font-semibold focus:border-gold focus:outline-none"
                />
                <span className="text-xs text-gray-400">kişilik masa</span>
              </div>
            </div>

            {/* Occasion Selector */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider text-gray-300 font-semibold block flex items-center gap-1.5">
                <PartyPopper className="w-4 h-4 text-gold" />
                Özel Bir Kutlama mı?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {occasions.map((occ) => {
                  const isSelected = occasion === occ;
                  return (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => setOccasion(occ)}
                      className={`p-3.5 rounded-xl text-left text-xs font-medium border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-gold/15 border-gold text-white font-semibold'
                          : 'bg-meyhane-bg/60 border-meyhane-border text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <span>{occ}</span>
                      {isSelected && <Check className="w-4 h-4 text-gold" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Geri</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-8 py-3.5 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/20 flex items-center gap-2"
              >
                <span>Devam Et: Kuşbakışı Masa Seçimi</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: KUŞBAKIŞI UÇAK/OTOBÜS TİPİ MASA SEÇİMİ */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-serif text-white flex items-center gap-2">
                  <Wine className="w-5 h-5 text-gold" />
                  3. Adım: Masanızı Seçin
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Uçak/tiyatro koltuk seçimi gibi, kuşbakışı harita üzerinden istediğiniz masaya tıklayabilirsiniz.
                </p>
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-meyhane-surface border border-meyhane-border self-start">
                <button
                  type="button"
                  onClick={() => setSeatingViewMode('map')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    seatingViewMode === 'map' ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Kuşbakışı Harita</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSeatingViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    seatingViewMode === 'cards' ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Bölge Listesi</span>
                </button>
              </div>
            </div>

            {/* SEATING VIEW MODE: KUŞBAKIŞI HARİTA */}
            {seatingViewMode === 'map' ? (
              <SeatingFloorPlan
                selectedTableId={tableId}
                onSelectTable={(selectedId, sId) => {
                  setTableId(selectedId);
                  if (sId) setSectionId(sId);
                }}
                guestCount={guestCount}
                occupiedTableIds={occupiedTableIds}
              />
            ) : (
              /* SEATING VIEW MODE: BÖLGE KARTLARI */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {VENUE_SECTIONS.map((sec) => {
                    const isSelected = sectionId === sec.id;
                    return (
                      <div
                        key={sec.id}
                        onClick={() => {
                          setSectionId(sec.id);
                          setTableId('any');
                        }}
                        className={`rounded-2xl border overflow-hidden cursor-pointer transition-all ${
                          isSelected
                            ? 'border-gold ring-2 ring-gold/30 bg-meyhane-surface shadow-xl'
                            : 'border-meyhane-border/70 bg-meyhane-bg/60 hover:border-gray-500'
                        }`}
                      >
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white font-serif">{sec.name}</h3>
                            <span className="text-[10px] text-gold">{sec.badge}</span>
                          </div>
                          <p className="text-xs text-gray-400">{sec.shortDesc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Currently Selected Table Info Bar */}
            <div className="p-4 rounded-2xl bg-meyhane-surface/90 border border-gold/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-meyhane-muted">Seçilen Konum:</span>
                <span className="font-bold text-white font-serif">
                  {formatTableDisplay(tableId, sectionId)}
                </span>
                <span className="text-[11px] text-gold">({currentSection.name})</span>
              </div>
              <div className="text-[11px] text-gray-400">
                {guestCount} Misafir
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Geri</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-8 py-3.5 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/20 flex items-center gap-2"
              >
                <span>Devam Et: Menü Paketi</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: MENÜ PAKETİ */}
        {step === 4 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold font-serif text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-gold" />
                4. Adım: Menü Tercihiniz
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Fiks menü paketlerimizle masanızı zenginleştirebilir veya serbest A La Carte tercih edebilirsiniz.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FIX_PACKAGES.map((pkg) => {
                const isSelected = packageId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setPackageId(pkg.id as any)}
                    className={`rounded-2xl p-6 border cursor-pointer transition-all flex flex-col justify-between space-y-5 ${
                      isSelected
                        ? 'border-gold bg-meyhane-surface ring-2 ring-gold/30 shadow-2xl scale-[1.02]'
                        : 'border-meyhane-border/70 bg-meyhane-bg/70 hover:border-gray-500'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-gold/15 text-gold text-[10px] font-bold uppercase tracking-wider border border-gold/30">
                          {pkg.badge}
                        </span>
                        {isSelected && <Check className="w-5 h-5 text-gold" />}
                      </div>

                      <h3 className="text-base font-bold font-serif text-white">{pkg.name}</h3>

                      <div className="pt-1">
                        <span className="text-2xl font-bold font-serif text-gold">
                          {pkg.price === 0 ? 'Serbest Seçim' : `${pkg.price.toLocaleString('tr-TR')} TL`}
                        </span>
                        <span className="text-xs text-meyhane-muted block mt-0.5">{pkg.unit}</span>
                      </div>

                      <ul className="space-y-2 pt-2 border-t border-meyhane-border/50 text-xs text-gray-300">
                        {pkg.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-gold text-sm leading-none">•</span>
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      className={`w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                        isSelected
                          ? 'bg-gold text-black shadow-md'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {isSelected ? 'Paket Seçildi' : 'Bu Paketi Seç'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Geri</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-8 py-3.5 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/20 flex items-center gap-2"
              >
                <span>Devam Et: İletişim Bilgileri</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: İLETİŞİM & ONAY */}
        {step === 5 && (
          <form onSubmit={handleSubmit} className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold font-serif text-white flex items-center gap-2">
                <User className="w-5 h-5 text-gold" />
                5. Adım: İletişim Bilgileriniz
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Rezervasyon onay kodunuz ve masa detaylarınız bu bilgilere iletilecektir.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-900/30 border border-red-500/50 text-red-200 text-xs">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-gray-300 font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gold" />
                  Adınız ve Soyadınız *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full bg-meyhane-bg border border-meyhane-border px-4 py-3 rounded-xl text-white text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-gray-300 font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gold" />
                  Telefon Numaranız *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Örn: 0532 123 45 67"
                  className="w-full bg-meyhane-bg border border-meyhane-border px-4 py-3 rounded-xl text-white text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs uppercase tracking-wider text-gray-300 font-semibold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gold" />
                  E-posta Adresiniz (Opsiyonel)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Örn: ahmet@gmail.com"
                  className="w-full bg-meyhane-bg border border-meyhane-border px-4 py-3 rounded-xl text-white text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs uppercase tracking-wider text-gray-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  Özel İstekler &amp; Notlar
                </label>
                <textarea
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Doğum günü pastası servisi, masa süslemesi veya alerjen durumları..."
                  className="w-full bg-meyhane-bg border border-meyhane-border px-4 py-3 rounded-xl text-white text-sm focus:border-gold focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Reservation Summary Card */}
            <div className="p-5 rounded-2xl bg-meyhane-surface/80 border border-gold/30 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold font-serif">
                Rezervasyon Özeti
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-meyhane-muted block">Tarih:</span>
                  <span className="text-white font-medium">{date}</span>
                </div>
                <div>
                  <span className="text-meyhane-muted block">Saat:</span>
                  <span className="text-white font-medium">{time}</span>
                </div>
                <div>
                  <span className="text-meyhane-muted block">Kişi:</span>
                  <span className="text-white font-medium">{guestCount} Misafir</span>
                </div>
                <div>
                  <span className="text-meyhane-muted block">Masa:</span>
                  <span className="text-gold font-medium">
                    {formatTableDisplay(tableId, sectionId)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Geri</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-4 rounded-xl bg-gradient-to-r from-gold-500 via-gold to-gold-600 text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-xl shadow-gold/25 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Kaydediliyor...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Rezervasyonu Tamamla</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 6: TEBRİKLER & REZERVASYON ONAY EKRANI */}
        {step === 6 && confirmedReservation && (
          <div className="text-center space-y-8 py-4 animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 mx-auto flex items-center justify-center shadow-2xl">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                Rezervasyon Talebiniz Başarıyla Alındı
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white">
                Teşekkür Ederiz, {confirmedReservation.fullName}!
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto">
                HayalMest Anadolu Meyhanesi masanız ayrıldı. Rezervasyon takip kodunuz aşağıdadır.
              </p>
            </div>

            {/* PNR Code Box */}
            <div className="max-w-md mx-auto p-5 rounded-2xl bg-meyhane-surface border border-gold/40 shadow-xl space-y-3">
              <div className="text-xs uppercase tracking-wider text-meyhane-muted">
                Rezervasyon Takip Kodunuz (PNR)
              </div>
              <div className="text-3xl font-bold font-mono tracking-widest text-gold flex items-center justify-center gap-3">
                <span>{confirmedReservation.pnr}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(confirmedReservation.pnr)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 transition-colors"
                  title="Kodu Kopyala"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copiedPnr && (
                <div className="text-[11px] text-emerald-400 font-medium">
                  Kod panoya kopyalandı!
                </div>
              )}
            </div>

            {/* Details Summary */}
            <div className="max-w-md mx-auto p-6 rounded-2xl bg-meyhane-bg/70 border border-meyhane-border text-left space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-meyhane-border/50">
                <span className="text-gray-400">Tarih &amp; Saat:</span>
                <span className="text-white font-semibold">{confirmedReservation.date} saat {confirmedReservation.time}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-meyhane-border/50">
                <span className="text-gray-400">Kişi Sayısı:</span>
                <span className="text-white font-semibold">{confirmedReservation.guestCount} Kişi</span>
              </div>
              <div className="flex justify-between py-1 border-b border-meyhane-border/50">
                <span className="text-gray-400">Masa / Konum:</span>
                <span className="text-gold font-semibold">
                  {formatTableDisplay(confirmedReservation.tableId, confirmedReservation.sectionId)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-meyhane-border/50">
                <span className="text-gray-400">Kutlama:</span>
                <span className="text-white font-semibold">{confirmedReservation.occasion}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Seans:</span>
                <span className="text-gold font-semibold">{confirmedReservation.serviceType}</span>
              </div>
            </div>

            {/* WhatsApp Confirmation Link */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={`https://wa.me/905305012458?text=Merhaba,%20%23${confirmedReservation.pnr}%20kodlu%20${confirmedReservation.guestCount}%20ki%C5%9Filik%20rezervasyonum%20hakk%C4%B1nda%20yaz%C4%B1yorum.%20Masa%20tarihimiz:%20${confirmedReservation.date}%20saat%20${confirmedReservation.time}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <span>WhatsApp ile Teyit Et</span>
              </a>

              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs uppercase tracking-wider border border-meyhane-border transition-colors block text-center"
              >
                Anasayfaya Dön
              </Link>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

export default function ReservationPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gold">Yükleniyor...</div>}>
      <ReservationContent />
    </Suspense>
  );
}
