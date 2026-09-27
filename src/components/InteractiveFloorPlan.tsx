'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Music,
  Wine,
  DoorOpen,
  DoorClosed,
  Users,
  CreditCard,
  Utensils,
  Building2,
  Sparkles,
  Plus,
  Calendar,
  Clock,
  Phone,
  MessageCircle,
  CheckCircle,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Filter,
  UserCheck,
  Layers,
  ChevronRight,
  X,
  AlertCircle,
  AlertTriangle,
  Sparkle,
  Crown
} from 'lucide-react';
import { TableItem, VENUE_SECTIONS } from '@/data/tablesData';
import { VenueElement } from '@/lib/tablesStorage';
import { Reservation } from '@/lib/storage';

const VIRTUAL_WIDTH = 2400;
const VIRTUAL_HEIGHT = 1500;

interface InteractiveFloorPlanProps {
  tables: TableItem[];
  elements: VenueElement[];
  reservations: Reservation[];
  selectedDate: string;
  selectedTableId?: string | null;
  onSelectTable: (table: TableItem) => void;
  onQuickBookTable?: (table: TableItem) => void;
  onStatusChange?: (resId: string, status: Reservation['status']) => void;
  mode?: 'admin' | 'host' | 'customer';
  guestCount?: number;
  highlightedTableId?: string | null;
  onOccupiedTableClick?: (table: TableItem) => void;
}

export default function InteractiveFloorPlan({
  tables,
  elements,
  reservations,
  selectedDate,
  selectedTableId,
  onSelectTable,
  onQuickBookTable,
  onStatusChange,
  mode = 'admin',
  guestCount,
  highlightedTableId,
  onOccupiedTableClick,
}: InteractiveFloorPlanProps) {
  const [zoom, setZoom] = useState<number>(0.65);
  const [hoveredTable, setHoveredTable] = useState<TableItem | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [occupiedWarning, setOccupiedWarning] = useState<TableItem | null>(null);
  const [capacityModal, setCapacityModal] = useState<{
    targetTable: TableItem;
    availableAdjacent: TableItem[];
    alternativeLargeTables: TableItem[];
  } | null>(null);
  const [selectionSuccessFeedback, setSelectionSuccessFeedback] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied' | 'seated'>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  // Pan & Viewport Drag refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasInnerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  // Keep selectedTable in sync with prop if passed
  useEffect(() => {
    if (selectedTableId) {
      const match = tables.find(t => t.id === selectedTableId || selectedTableId.includes(t.id));
      if (match) setSelectedTable(match);
    }
  }, [selectedTableId, tables]);

  // If a highlightedTableId is provided (e.g. host modal/jump), auto-scroll to that table and spotlight it
  useEffect(() => {
    if (highlightedTableId && tables.length > 0) {
      const target = tables.find(t => t.id === highlightedTableId || highlightedTableId.includes(t.id));
      if (target) {
        setSelectedTable(target);
        scrollToZone(target.posX, target.posY);
      }
    }
  }, [highlightedTableId, tables]);

  // Fit to screen helper
  const handleFitScreen = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const pad = 48;
      const scaleX = (container.clientWidth - pad) / VIRTUAL_WIDTH;
      const scaleY = (container.clientHeight - pad) / VIRTUAL_HEIGHT;
      const fit = Math.min(scaleX, scaleY);
      const clamped = Math.min(1.4, Math.max(0.25, Number(fit.toFixed(2))));
      setZoom(clamped);
      container.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    } else {
      setZoom(0.45);
    }
  }, []);

  // Initial Auto-fit on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitScreen();
    }, 200);
    return () => clearTimeout(timer);
  }, [handleFitScreen]);

  // Quick Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(1.8, Number((prev + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom(prev => Math.max(0.2, Number((prev - 0.15).toFixed(2))));

  // Quick Scroll to Zone in 2400px virtual coordinates
  const scrollToZone = (xPct: number, yPct: number) => {
    if (!scrollContainerRef.current) return;
    const targetX = (VIRTUAL_WIDTH * zoom * xPct) / 100 - scrollContainerRef.current.clientWidth / 2;
    const targetY = (VIRTUAL_HEIGHT * zoom * yPct) / 100 - scrollContainerRef.current.clientHeight / 2;
    scrollContainerRef.current.scrollTo({
      left: Math.max(0, targetX),
      top: Math.max(0, targetY),
      behavior: 'smooth',
    });
  };

  // Viewport Mouse Drag Handlers (Smooth hand panning)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-interactive-table="true"]')) return;

    if (scrollContainerRef.current) {
      panStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: scrollContainerRef.current.scrollLeft,
        scrollTop: scrollContainerRef.current.scrollTop,
      };
      setIsPanning(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!panStartRef.current || !scrollContainerRef.current) return;
    const dx = e.clientX - panStartRef.current.startX;
    const dy = e.clientY - panStartRef.current.startY;
    scrollContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
    scrollContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handleMouseUp = () => {
    panStartRef.current = null;
    setIsPanning(false);
  };

  // Viewport Touch Handlers (Mobile hand panning)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scrollContainerRef.current) {
      const touch = e.touches[0];
      panStartRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        scrollLeft: scrollContainerRef.current.scrollLeft,
        scrollTop: scrollContainerRef.current.scrollTop,
      };
      setIsPanning(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!panStartRef.current || !scrollContainerRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - panStartRef.current.startX;
    const dy = touch.clientY - panStartRef.current.startY;
    scrollContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
    scrollContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handleTouchEnd = () => {
    panStartRef.current = null;
    setIsPanning(false);
  };

  // Reservation lookup helper
  const getTableReservation = (tableId: string) => {
    return reservations.find(
      r =>
        r.date === selectedDate &&
        r.status !== 'cancelled' &&
        (r.tableId === tableId || (r.tableId && r.tableId.includes(tableId)))
    );
  };

  // Counts for the day
  const dayReservations = reservations.filter(r => r.date === selectedDate && r.status !== 'cancelled');
  const occupiedCount = tables.filter(t => !!getTableReservation(t.id)).length;
  const availableCount = Math.max(0, tables.length - occupiedCount);
  const seatedCount = tables.filter(t => getTableReservation(t.id)?.status === 'seated').length;

  // Filter checker
  const isTableVisible = (tbl: TableItem) => {
    const res = getTableReservation(tbl.id);
    const isOccupied = !!res;
    const isSeated = res?.status === 'seated';

    // Status filter
    if (statusFilter === 'available' && isOccupied) return false;
    if (statusFilter === 'occupied' && !isOccupied) return false;
    if (statusFilter === 'seated' && !isSeated) return false;

    // Section filter
    if (sectionFilter !== 'all' && tbl.sectionId !== sectionFilter) return false;

    return true;
  };

  // Customer action handler with capacity check & adjacent merge proposal
  const handleCustomerActionClick = (table: TableItem) => {
    // If guest count exceeds table capacity, open the merge suggestion modal
    if (guestCount && guestCount > table.capacity) {
      const availableAdjacent = (table.adjacentWith || [])
        .map(adjId => tables.find(t => t.id === adjId))
        .filter((adj): adj is TableItem => Boolean(adj && !getTableReservation(adj.id)));

      const alternativeLargeTables = tables.filter(
        t => t.capacity >= guestCount && !getTableReservation(t.id) && t.id !== table.id
      );

      setCapacityModal({
        targetTable: table,
        availableAdjacent,
        alternativeLargeTables,
      });
      return;
    }

    onSelectTable(table);
    setSelectionSuccessFeedback(true);
    setTimeout(() => setSelectionSuccessFeedback(false), 3000);
  };

  // Table click dispatcher
  const handleTableClick = (table: TableItem) => {
    const res = getTableReservation(table.id);
    const isOccupied = !!res;

    // Customer Mode: If occupied, show clear friendly warning
    if (mode === 'customer') {
      if (isOccupied) {
        setOccupiedWarning(table);
        if (onOccupiedTableClick) onOccupiedTableClick(table);
        return;
      }
      setSelectedTable(table);

      // If guest count exceeds table capacity, open the merge suggestion modal
      if (guestCount && guestCount > table.capacity) {
        const availableAdjacent = (table.adjacentWith || [])
          .map(adjId => tables.find(t => t.id === adjId))
          .filter((adj): adj is TableItem => Boolean(adj && !getTableReservation(adj.id)));

        const alternativeLargeTables = tables.filter(
          t => t.capacity >= guestCount && !getTableReservation(t.id) && t.id !== table.id
        );

        setCapacityModal({
          targetTable: table,
          availableAdjacent,
          alternativeLargeTables,
        });
      } else {
        onSelectTable(table);
        setSelectionSuccessFeedback(true);
        setTimeout(() => setSelectionSuccessFeedback(false), 3000);
      }
      return;
    }

    // Admin & Host Mode
    setSelectedTable(table);
    onSelectTable(table);
  };

  // Selected table reservation details
  const activeSelectedRes = selectedTable ? getTableReservation(selectedTable.id) : null;
  const hoveredRes = hoveredTable ? getTableReservation(hoveredTable.id) : null;

  return (
    <div className="space-y-4 select-none">
      
      {/* Top Viewport Navigator & Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-meyhane-surface/95 border border-gold/40 shadow-xl backdrop-blur-md">
        
        {/* Live Status Filter Pills (or Customer Legend) */}
        {mode === 'customer' ? (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-gold font-serif font-bold text-xs">
              Masa Durumu:
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Müsait ({availableCount})</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/40 text-red-300 border border-red-500/40 font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span>Dolu / Rezerve ({occupiedCount})</span>
            </span>
            {selectedTable && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/20 text-gold border border-gold font-bold">
                <Sparkles className="w-3 h-3 text-gold" />
                <span>Seçilen: {selectedTable.number}</span>
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-gold font-serif font-bold text-xs mr-1 hidden sm:inline">
              Filtrele:
            </span>

            <button
              type="button"
              onClick={() => { setStatusFilter('all'); setSectionFilter('all'); }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                statusFilter === 'all' && sectionFilter === 'all'
                  ? 'bg-gold text-black shadow-md shadow-gold/30 font-bold scale-105'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
            >
              Tümü ({tables.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'available' ? 'all' : 'available')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'available'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30 font-bold scale-105'
                  : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Müsait ({availableCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'occupied' ? 'all' : 'occupied')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'occupied'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30 font-bold scale-105'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Rezerve ({occupiedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'seated' ? 'all' : 'seated')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'seated'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30 font-bold scale-105'
                  : 'bg-blue-950/40 text-blue-300 border border-blue-500/40 hover:bg-blue-900/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>Masada ({seatedCount})</span>
            </button>

            <div className="h-4 w-px bg-white/20 mx-1 hidden md:block" />

            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="bg-meyhane-bg border border-meyhane-border px-2.5 py-1.5 rounded-xl text-white text-xs focus:border-gold focus:outline-none cursor-pointer"
            >
              <option value="all">Bütün Salon Bölümleri</option>
              <option value="vip_sahne">👑 VIP Sahne Önü</option>
              <option value="salon">🍷 Orta Salon</option>
              <option value="loca">🎉 Özel Loca &amp; Gala</option>
              <option value="bahce">🌿 Bahçe &amp; Teras</option>
            </select>
          </div>
        )}

        {/* Zoom & Screen Fit Controls */}
        <div className="flex items-center gap-2">
          
          {/* Quick Zone Navigator */}
          <div className="hidden xl:flex items-center gap-1 text-[11px]">
            <span className="text-gray-500 mr-1 text-[10px]">Odaklan:</span>
            <button
              type="button"
              onClick={() => scrollToZone(47, 6)}
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-gold/20 hover:text-gold text-gray-300 transition-colors"
            >
              🎤 Sahne
            </button>
            <button
              type="button"
              onClick={() => scrollToZone(48, 48)}
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-gold/20 hover:text-gold text-gray-300 transition-colors"
            >
              🍷 Salon
            </button>
            <button
              type="button"
              onClick={() => scrollToZone(48, 72)}
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-gold/20 hover:text-gold text-gray-300 transition-colors"
            >
              👑 Loca
            </button>
            <button
              type="button"
              onClick={() => scrollToZone(88, 48)}
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-gold/20 hover:text-gold text-gray-300 transition-colors"
            >
              🌿 Bahçe
            </button>
            <button
              type="button"
              onClick={() => scrollToZone(19, 95)}
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-gold/20 hover:text-gold text-gray-300 transition-colors"
            >
              🚪 Giriş
            </button>
          </div>

          <div className="h-4 w-px bg-white/20 mx-1 hidden sm:block" />

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 bg-meyhane-bg p-1 rounded-xl border border-meyhane-border">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white"
              title="Uzaklaş"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-gold font-bold min-w-[40px] text-center">
              %{Math.round(zoom * 100)}
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white"
              title="Yakınlaş"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleFitScreen}
            className="px-3 py-1.5 rounded-xl bg-gold/20 hover:bg-gold text-gold hover:text-black text-xs font-bold transition-all flex items-center gap-1.5 border border-gold/40 shadow-sm"
            title="Krokiyi Ekrana Tam Sığdır"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tam Sığdır</span>
          </button>
        </div>

      </div>

      {/* VIEWPORT FRAME & 2400x1500 VIRTUAL KROKI CANVAS */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-meyhane-border/90 shadow-2xl">
        
        {/* Scrollable Viewport with Mouse & Touch Drag Pan */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative bg-[#07090D] overflow-auto select-none scrollbar-thin scrollbar-thumb-gold/30 scrollbar-track-transparent h-[76vh] min-h-[580px] max-h-[880px] ${
            isPanning ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Centering Wrapper: centers when canvas is smaller than container, scrolls freely when larger */}
          <div className="min-w-full min-h-full w-max h-max flex p-6 sm:p-10">
            {/* Scaled Wrapper */}
            <div
              style={{
                width: `${VIRTUAL_WIDTH * zoom}px`,
                height: `${VIRTUAL_HEIGHT * zoom}px`,
                flexShrink: 0,
              }}
              className="m-auto relative rounded-2xl shadow-2xl overflow-hidden border border-white/10"
            >
              {/* Virtual Infinite Canvas (2400px x 1500px transformed by zoom) */}
              <div
                ref={canvasInnerRef}
                style={{
                  width: `${VIRTUAL_WIDTH}px`,
                  height: `${VIRTUAL_HEIGHT}px`,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
                className="relative bg-[#090C10]"
              >
                {/* Architectural Blueprint Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293718_1px,transparent_1px),linear-gradient(to_bottom,#1f293718_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#d4af3708_1px,transparent_1px),linear-gradient(to_bottom,#d4af3708_1px,transparent_1px)] bg-[size:150px_150px] pointer-events-none" />

                {/* 1. ARCHITECTURAL & KROKI ELEMENTS (Sahne, Bar, WC, Kapılar, Kasa, Mutfak, Kolonlar) */}
                {elements.map((el) => {
                  const w = el.width || 12;
                  const h = el.height || 10;
                  const isVertical = h > w * 1.15;

                  const getElementStyle = () => {
                    switch (el.type) {
                      case 'stage':
                        return 'border-2 border-gold/70 bg-gradient-to-r from-gold/15 via-gold/30 to-gold/15 text-gold shadow-[0_0_35px_rgba(212,175,55,0.25)]';
                      case 'bar':
                        return 'border-2 border-emerald-500/70 bg-emerald-950/40 text-emerald-200 shadow-lg';
                      case 'entrance':
                        return 'border-2 border-emerald-400 bg-emerald-950/60 text-emerald-300 shadow-emerald-500/20';
                      case 'exit':
                        return 'border-2 border-red-500 bg-red-950/60 text-red-300 shadow-red-500/20';
                      case 'wc':
                        return 'border-2 border-indigo-500/70 bg-indigo-950/50 text-indigo-200 shadow-indigo-500/20';
                      case 'cashier':
                        return 'border-2 border-amber-500/70 bg-amber-950/50 text-amber-200 shadow-amber-500/20';
                      case 'kitchen':
                        return 'border-2 border-orange-500/70 bg-orange-950/50 text-orange-200 shadow-orange-500/20';
                      case 'column':
                        return 'border-2 border-gray-500 bg-gray-800/80 text-gray-300';
                      case 'wine':
                        return 'border-2 border-purple-500/70 bg-purple-950/50 text-purple-200 shadow-purple-500/20';
                      default:
                        return 'border-2 border-gold/50 bg-meyhane-surface/90 text-white';
                    }
                  };

                  const getElementIcon = () => {
                    switch (el.type) {
                      case 'stage': return <Music className="w-5 h-5 text-gold animate-pulse" />;
                      case 'bar': return <Wine className="w-5 h-5 text-emerald-400" />;
                      case 'entrance': return <DoorOpen className="w-5 h-5 text-emerald-400" />;
                      case 'exit': return <DoorClosed className="w-5 h-5 text-red-400" />;
                      case 'wc': return <Users className="w-5 h-5 text-indigo-400" />;
                      case 'cashier': return <CreditCard className="w-5 h-5 text-amber-400" />;
                      case 'kitchen': return <Utensils className="w-5 h-5 text-orange-400" />;
                      case 'column': return <Building2 className="w-4 h-4 text-gray-400" />;
                      case 'wine': return <Wine className="w-5 h-5 text-purple-400" />;
                      default: return <Sparkles className="w-4 h-4 text-gold" />;
                    }
                  };

                  return (
                    <div
                      key={el.id}
                      style={{
                        left: `${el.posX}%`,
                        top: `${el.posY}%`,
                        width: `${w}%`,
                        height: `${h}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className={`absolute rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-center text-center select-none pointer-events-none ${getElementStyle()} z-10`}
                    >
                      {isVertical ? (
                        <div className="flex flex-col items-center justify-center h-full w-full py-1">
                          <div className="mb-1 flex-shrink-0">{getElementIcon()}</div>
                          <div
                            style={{
                              writingMode: 'vertical-rl',
                              transform: 'rotate(180deg)',
                            }}
                            className="text-xs font-bold font-serif uppercase tracking-wider whitespace-nowrap leading-none"
                          >
                            {el.name}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full px-1">
                          <div className="flex items-center justify-center gap-1.5 mb-1 max-w-full">
                            {getElementIcon()}
                            <span className="text-xs font-bold font-serif uppercase tracking-wider leading-tight text-center break-words">
                              {el.name}
                            </span>
                          </div>
                          <span className="text-[10px] opacity-75 uppercase font-mono tracking-widest text-center leading-tight">
                            {el.type === 'stage' ? '♫ Canlı Fasıl & Gala ♫' :
                             el.type === 'entrance' ? '➔ Ana Müşteri Girişi' :
                             el.type === 'exit' ? '➔ Acil Yangın Çıkışı' :
                             el.type === 'wc' ? 'Bay & Bayan WC' :
                             el.type === 'column' ? 'Taşıyıcı Engel' : 'Kroki Alanı'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 2. INTERACTIVE TABLES WITH LIVE OCCUPANCY STATUS FOR SELECTED DATE */}
                {tables.map((table) => {
                  const isVisible = isTableVisible(table);
                  const isSelected = selectedTable?.id === table.id || (selectedTableId ? (selectedTableId === table.id || selectedTableId.split('+').includes(table.id)) : false);
                  const isSpotlighted = highlightedTableId && (highlightedTableId === table.id || highlightedTableId.includes(table.id));
                  const res = getTableReservation(table.id);
                  const isOccupied = !!res;
                  const isSeated = res?.status === 'seated';
                  const isPending = res?.status === 'pending';

                  const isVIP = table.sectionId === 'vip_sahne';
                  const isLoca = table.sectionId === 'loca';
                  const isBahce = table.sectionId === 'bahce';

                  const defaultW = isLoca ? 9 : isVIP ? 8 : 7.5;
                  const defaultH = isLoca ? 7.5 : 6.5;
                  const tableW = table.width || defaultW;
                  const tableH = table.height || defaultH;
                  const isVertical = tableH > tableW * 1.15;

                  // Dynamic color styles based on real-time occupancy status
                  const getTableVisualClass = () => {
                    if (isSpotlighted) {
                      return 'ring-4 ring-gold border-gold bg-gold text-black scale-115 z-40 shadow-[0_0_40px_rgba(212,175,55,0.9)] animate-pulse font-bold';
                    }

                    if (isSelected) {
                      return 'ring-4 ring-gold border-gold bg-gold text-black scale-110 z-30 shadow-[0_0_30px_rgba(212,175,55,0.6)] font-bold';
                    }

                    if (mode === 'customer') {
                      if (isOccupied) {
                        return 'border-red-500/60 bg-red-950/40 text-red-200/90 shadow-md hover:border-red-400 hover:bg-red-950/70 z-10 cursor-not-allowed';
                      }
                      // Available for customer
                      if (isVIP) {
                        return 'border-amber-400 bg-amber-950/40 text-amber-200 hover:border-gold hover:bg-amber-950/80 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-105 z-10';
                      }
                      if (isLoca) {
                        return 'border-purple-400 bg-purple-950/40 text-purple-200 hover:border-purple-300 hover:bg-purple-950/80 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-105 z-10';
                      }
                      if (isBahce) {
                        return 'border-teal-400 bg-teal-950/40 text-teal-200 hover:border-teal-300 hover:bg-teal-950/80 hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] hover:scale-105 z-10';
                      }
                      return 'border-emerald-500 bg-[#0E131C] text-white hover:border-emerald-300 hover:bg-emerald-950/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105 z-10';
                    }

                    // Admin / Host Mode
                    if (isSeated) {
                      return 'border-blue-400 bg-blue-950/90 text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.35)] ring-1 ring-blue-500/50 hover:scale-105 z-20';
                    }

                    if (isOccupied) {
                      return 'border-amber-400 bg-amber-950/90 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-1 ring-amber-500/50 hover:scale-105 z-20';
                    }

                    // Available Table in Admin / Host
                    if (isVIP) {
                      return 'border-amber-400/80 bg-amber-950/40 text-amber-200 hover:border-gold hover:bg-amber-950/80 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-105 z-10';
                    }
                    if (isLoca) {
                      return 'border-purple-400/80 bg-purple-950/40 text-purple-200 hover:border-purple-300 hover:bg-purple-950/80 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-105 z-10';
                    }
                    if (isBahce) {
                      return 'border-teal-400/80 bg-teal-950/40 text-teal-200 hover:border-teal-300 hover:bg-teal-950/80 hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:scale-105 z-10';
                    }
                    return 'border-emerald-500/70 bg-[#0E131C] text-white hover:border-emerald-400 hover:bg-emerald-950/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 z-10';
                  };

                  return (
                    <div
                      key={table.id}
                      data-interactive-table="true"
                      onClick={() => handleTableClick(table)}
                      onMouseEnter={() => setHoveredTable(table)}
                      onMouseLeave={() => setHoveredTable(null)}
                      style={{
                        left: `${table.posX}%`,
                        top: `${table.posY}%`,
                        width: `${tableW}%`,
                        height: `${tableH}%`,
                        transform: 'translate(-50%, -50%)',
                        minWidth: '64px',
                        minHeight: '48px',
                        willChange: 'transform, left, top',
                      }}
                      className={`absolute p-2 rounded-2xl border-2 flex flex-col items-center justify-center text-center select-none transition-all duration-200 cursor-pointer group ${
                        !isVisible ? 'opacity-20 scale-95 pointer-events-none' : ''
                      } ${getTableVisualClass()}`}
                      title={`${table.number} (${table.capacity} Kişi) - ${
                        isSeated ? 'Masada' : isOccupied ? 'Dolu / Rezerve' : 'Müsait'
                      }`}
                    >
                      {/* Top Status Indicator Badge */}
                      <div className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-tight uppercase flex items-center gap-1 shadow-md z-30">
                        {mode === 'customer' ? (
                          isOccupied ? (
                            <span className="bg-red-600 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                              <span>Dolu</span>
                            </span>
                          ) : (
                            <span className="bg-emerald-600 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                              <span>Boş</span>
                            </span>
                          )
                        ) : isSeated ? (
                          <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                            Masada
                          </span>
                        ) : isOccupied ? (
                          <span className={`px-1.5 py-0.5 rounded-full ${isPending ? 'bg-yellow-500 text-black animate-pulse' : 'bg-amber-600 text-white'}`}>
                            {isPending ? 'Bekliyor' : 'Dolu'}
                          </span>
                        ) : (
                          <span className="bg-emerald-600/90 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                            <span>Boş</span>
                          </span>
                        )}
                      </div>

                      {/* Spotlight Label when highlighted by Host */}
                      {isSpotlighted && (
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black text-amber-300 border border-gold text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-2xl whitespace-nowrap z-40">
                          ★ Misafirin Masası ★
                        </div>
                      )}

                      {/* Content (Vertical or Horizontal) */}
                      {isVertical ? (
                        <div className="flex flex-col items-center justify-center h-full w-full pointer-events-none py-1">
                          <div
                            style={{
                              writingMode: 'vertical-rl',
                              transform: 'rotate(180deg)',
                            }}
                            className="text-xs sm:text-sm font-bold font-serif tracking-wide leading-none whitespace-nowrap"
                          >
                            {table.number}
                          </div>
                          
                          {/* If occupied and not in customer mode, show guest name snippet; otherwise show capacity */}
                          {res && mode !== 'customer' ? (
                            <div
                              style={{
                                writingMode: 'vertical-rl',
                                transform: 'rotate(180deg)',
                              }}
                              className="text-[10px] text-amber-200 font-semibold tracking-tight mt-1 leading-none truncate max-h-16"
                            >
                              {res.fullName.split(' ')[0]} ({res.time})
                            </div>
                          ) : (
                            <div
                              style={{
                                writingMode: 'vertical-rl',
                                transform: 'rotate(180deg)',
                              }}
                              className="text-[10px] opacity-90 font-medium tracking-tight mt-1 leading-none whitespace-nowrap"
                            >
                              {table.capacity} Kişi
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pointer-events-none w-full px-1">
                          <div className="text-xs sm:text-sm font-bold font-serif leading-tight text-center break-words max-w-full">
                            {table.number}
                          </div>

                          {res && mode !== 'customer' ? (
                            <div className="text-[10px] text-amber-200 font-semibold leading-tight text-center mt-0.5 truncate max-w-full">
                              {res.fullName} <span className="font-mono text-gold opacity-90">({res.time})</span>
                            </div>
                          ) : (
                            <div className="text-[11px] opacity-90 leading-tight text-center mt-0.5 font-medium whitespace-nowrap">
                              {table.capacity} Kişi
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hover action prompt */}
                      <div className="absolute inset-0 bg-gold/15 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black/80 px-2 py-0.5 rounded-full border border-gold/40 shadow-lg">
                          {mode === 'customer'
                            ? isOccupied ? '⚠️ Dolu Masa' : '✓ Masayı Seç'
                            : isOccupied ? 'İncele' : '+ Rezervasyon'}
                        </span>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          </div>
        </div>

        {/* FLOATING HOVER MAGNIFIER BADGE (Top Left Glass Card) */}
        {hoveredTable && (
          <div className="absolute top-4 left-4 z-40 p-3.5 rounded-2xl bg-black/90 border border-gold/70 shadow-2xl backdrop-blur-md text-xs animate-fadeIn flex items-center gap-3.5 pointer-events-none max-w-sm">
            <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center font-serif text-sm shadow-md ${
              hoveredRes
                ? mode === 'customer'
                  ? 'bg-red-600 text-white'
                  : hoveredRes.status === 'seated'
                  ? 'bg-blue-600 text-white'
                  : 'bg-amber-500 text-black'
                : 'bg-gold text-black'
            }`}>
              {hoveredTable.capacity}p
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {hoveredTable.number}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  hoveredRes 
                    ? mode === 'customer'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : hoveredRes.status === 'seated'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {hoveredRes ? (mode === 'customer' ? 'Dolu' : hoveredRes.status === 'seated' ? 'Masada' : 'Rezerve') : 'Müsait'}
                </span>
              </div>

              {hoveredRes && mode !== 'customer' ? (
                <div className="text-[11px] text-amber-200 mt-0.5 font-medium">
                  <strong>{hoveredRes.fullName}</strong> • {hoveredRes.guestCount} Kişi • {hoveredRes.time}
                </div>
              ) : hoveredRes && mode === 'customer' ? (
                <div className="text-[11px] text-red-300 mt-0.5 font-medium">
                  Seçtiğiniz tarihte doludur. Lütfen yeşil masalardan birini seçiniz.
                </div>
              ) : (
                <div className="text-[11px] text-emerald-400 mt-0.5 font-medium">
                  {hoveredTable.sectionId === 'vip_sahne' ? 'VIP Sahne Önü' :
                   hoveredTable.sectionId === 'salon' ? 'Orta Salon' :
                   hoveredTable.sectionId === 'loca' ? 'Özel Loca' : 'Bahçe / Teras'}
                  {' '}• {hoveredTable.capacity} Kişilik Kapasite
                </div>
              )}
            </div>
          </div>
        )}

        {/* FLOATING BOTTOM ACTION BAR WHEN A TABLE IS SELECTED */}
        {selectedTable && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-40 p-4 rounded-3xl bg-[#090C10]/95 border-2 border-gold/70 shadow-2xl backdrop-blur-xl animate-fadeIn flex flex-col sm:flex-row items-center justify-between gap-4 max-w-xl">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-serif font-bold text-base shadow-md flex-shrink-0 ${
                activeSelectedRes
                  ? mode === 'customer'
                    ? 'bg-red-600 text-white'
                    : activeSelectedRes.status === 'seated'
                    ? 'bg-blue-600 text-white'
                    : 'bg-amber-500 text-black'
                  : 'bg-gold text-black'
              }`}>
                {selectedTable.capacity}p
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base font-serif">
                    {selectedTable.number}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    activeSelectedRes
                      ? mode === 'customer'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : activeSelectedRes.status === 'seated'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {activeSelectedRes ? (mode === 'customer' ? 'Dolu' : activeSelectedRes.status === 'seated' ? 'Masada' : 'Rezerve') : 'Müsait'}
                  </span>
                  {mode === 'customer' && guestCount && guestCount > selectedTable.capacity && !activeSelectedRes && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>{guestCount} Kişi İçin Yetersiz</span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-300 mt-0.5">
                  {activeSelectedRes && mode !== 'customer' ? (
                    <span className="text-amber-200">
                      <strong>{activeSelectedRes.fullName}</strong> ({activeSelectedRes.guestCount} Kişi • {activeSelectedRes.time})
                    </span>
                  ) : activeSelectedRes && mode === 'customer' ? (
                    <span className="text-red-300 font-semibold">
                      Bu masa seçili tarihte doludur.
                    </span>
                  ) : (
                    <span>
                      {selectedTable.capacity} Kişilik Kapasite • {selectedDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {mode === 'customer' ? (
                !activeSelectedRes && (() => {
                  const isConfirmed = Boolean(
                    selectedTableId && (
                      selectedTableId === selectedTable.id || 
                      selectedTableId.split('+').includes(selectedTable.id)
                    )
                  ) || selectionSuccessFeedback;
                  const isInsufficient = Boolean(guestCount && guestCount > selectedTable.capacity);

                  return (
                    <button
                      type="button"
                      onClick={() => handleCustomerActionClick(selectedTable)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all flex items-center gap-1.5 w-full sm:w-auto justify-center ${
                        isConfirmed
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400 shadow-emerald-600/50'
                          : isInsufficient
                          ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/40 animate-pulse'
                          : 'bg-gold hover:bg-amber-400 text-black shadow-gold/30 hover:brightness-110'
                      }`}
                    >
                      <CheckCircle className={`w-4 h-4 ${isConfirmed ? 'text-emerald-200' : ''}`} />
                      <span>
                        {isConfirmed
                          ? '✓ Masa Seçildi'
                          : isInsufficient
                          ? '⚠️ Birleştir veya Seç'
                          : 'Bu Masayı Seç'}
                      </span>
                    </button>
                  );
                })()
              ) : mode === 'host' ? (
                <>
                  {activeSelectedRes && onStatusChange && (
                    <button
                      type="button"
                      onClick={() => onStatusChange(activeSelectedRes.id, activeSelectedRes.status === 'seated' ? 'confirmed' : 'seated')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5 ${
                        activeSelectedRes.status === 'seated'
                          ? 'bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-500/40'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{activeSelectedRes.status === 'seated' ? 'Masadan Kaldır' : '✓ Masaya Oturt'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectTable(selectedTable)}
                    className="px-4 py-2 rounded-xl bg-gold text-black hover:brightness-110 text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Masa Kartı</span>
                  </button>
                </>
              ) : (
                /* Admin Mode */
                activeSelectedRes ? (
                  <>
                    {activeSelectedRes.status !== 'seated' && onStatusChange && (
                      <button
                        type="button"
                        onClick={() => onStatusChange(activeSelectedRes.id, 'seated')}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors"
                      >
                        ✓ Oturdu
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectTable(selectedTable)}
                      className="px-4 py-2 rounded-xl bg-gold text-black hover:brightness-110 text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Kartı Aç</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onQuickBookTable) {
                        onQuickBookTable(selectedTable);
                      } else {
                        onSelectTable(selectedTable);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gold text-black hover:brightness-110 text-xs font-bold uppercase tracking-wider shadow-lg shadow-gold/30 transition-all flex items-center gap-1.5 w-full sm:w-auto justify-center"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Bu Masaya Rezervasyon Al</span>
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* FRIENDLY CUSTOMER WARNING DIALOG WHEN CLICKING AN OCCUPIED TABLE */}
      {occupiedWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn">
          <div className="luxury-card max-w-md w-full rounded-3xl p-6 sm:p-7 border-2 border-amber-500/70 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center shadow-lg">
              <AlertCircle className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold font-serif text-white">
                Bu Masa Maalesef Doludur
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                <strong className="text-gold font-bold">{occupiedWarning.number}</strong> ({occupiedWarning.capacity} Kişilik), 
                seçtiğiniz <strong className="text-white font-mono">{selectedDate}</strong> tarihinde başka bir misafirimiz tarafından rezerve edilmiştir.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-left space-y-1">
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Nasıl Masa Seçebilirsiniz?</span>
              </div>
              <p className="text-[11px] text-gray-300">
                Kroki üzerinde <strong className="text-emerald-400">yeşil çerçeveli ve &ldquo;Boş&rdquo;</strong> olarak gösterilen masalardan dilediğinize tıklayarak rezervasyonunuza devam edebilirsiniz.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOccupiedWarning(null)}
              className="w-full py-3 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/20 transition-all"
            >
              Anladım, Boş Masalardan Seçeceğim
            </button>
          </div>
        </div>
      )}

      {/* CAPACITY WARNING & TABLE MERGE MODAL */}
      {capacityModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn">
          <div className="luxury-card max-w-lg w-full rounded-3xl p-6 sm:p-7 border-2 border-gold/70 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-meyhane-border/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-serif text-white">
                    Kapasite ve Masa Birleştirme
                  </h3>
                  <p className="text-[11px] text-gold font-medium">
                    {guestCount} Kişilik Rezervasyon Talebi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCapacityModal(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Message Card */}
            <div className="p-3.5 rounded-2xl bg-amber-950/25 border border-amber-500/40 text-xs space-y-1">
              <div className="text-amber-300 font-bold flex items-center gap-1.5">
                <span>⚠️ Misafir Sayınız Bu Masa İçin Fazladır</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Seçtiğiniz <strong className="text-white font-serif">{capacityModal.targetTable.number}</strong> masası <strong className="text-gold font-bold">{capacityModal.targetTable.capacity} kişiliktir</strong>. 
                Sizin grup rezervasyonunuz ise <strong className="text-gold font-bold">{guestCount} kişidir</strong>.
              </p>
            </div>

            {/* Mergeable Tables Option */}
            {capacityModal.availableAdjacent.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-gold font-serif flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sistemde Birleştirmeye Uygun Komşu Masalar:</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Aşağıdaki komşu masaları seçerek masaları birleştirebilir ve grubunuz için uygun oturum alanı oluşturabilirsiniz:
                </p>

                <div className="space-y-2 pt-1">
                  {capacityModal.availableAdjacent.map((adj) => {
                    const mergedTotal = capacityModal.targetTable.capacity + adj.capacity;
                    const isEnough = mergedTotal >= (guestCount || 1);

                    return (
                      <button
                        key={adj.id}
                        type="button"
                        onClick={() => {
                          const mergedTable: TableItem = {
                            ...capacityModal.targetTable,
                            id: `${capacityModal.targetTable.id}+${adj.id}`,
                            number: `${capacityModal.targetTable.number} + ${adj.number}`,
                            capacity: mergedTotal,
                          };
                          setSelectedTable(mergedTable);
                          onSelectTable(mergedTable);
                          setSelectionSuccessFeedback(true);
                          setCapacityModal(null);
                          setTimeout(() => setSelectionSuccessFeedback(false), 3000);
                        }}
                        className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between text-left group ${
                          isEnough
                            ? 'bg-emerald-950/30 hover:bg-emerald-950/60 border-emerald-500/50 hover:border-emerald-400'
                            : 'bg-white/5 hover:bg-white/10 border-meyhane-border hover:border-gold/50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-white group-hover:text-gold flex items-center gap-2">
                            <span>{capacityModal.targetTable.number} + {adj.number} Masalarını Birleştir</span>
                            {isEnough && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                                ✓ {guestCount} Kişi İçin Uygun
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {capacityModal.targetTable.capacity} Kişi + {adj.capacity} Kişi = <strong className="text-white">{mergedTotal} Kişilik Kapasite</strong>
                          </div>
                        </div>

                        <span className="px-3 py-1.5 rounded-xl bg-gold text-black text-xs font-bold group-hover:brightness-110 flex items-center gap-1 shadow-md">
                          <span>Birleştir &amp; Seç</span>
                          <span>➔</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-white/5 border border-meyhane-border text-xs text-gray-300 space-y-1">
                <p className="text-amber-200/90 font-medium">
                  ⚠️ Bu masanın komşu birleştirilebilir masaları seçili tarihte doludur veya bulunmamaktadır.
                </p>
                <p className="text-[11px] text-gray-400">
                  Lütfen grubunuz için daha yüksek kapasiteli alternatif bir masa tercih ediniz.
                </p>
              </div>
            )}

            {/* Alternative Large Tables Option */}
            {capacityModal.alternativeLargeTables.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-meyhane-border/60">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-300 font-serif">
                  Veya Grubunuz ({guestCount} Kişi) İçin Tek Geniş Masalar:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {capacityModal.alternativeLargeTables.slice(0, 4).map((alt) => (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => {
                        setSelectedTable(alt);
                        onSelectTable(alt);
                        setSelectionSuccessFeedback(true);
                        setCapacityModal(null);
                        setTimeout(() => setSelectionSuccessFeedback(false), 3000);
                      }}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-gold/15 border border-meyhane-border hover:border-gold/60 text-left transition-all group"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-gold flex items-center justify-between">
                        <span>{alt.number}</span>
                        <span className="text-[10px] text-gold font-semibold">{alt.capacity} Kişi</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {alt.sectionId === 'vip_sahne' ? 'VIP Sahne' : alt.sectionId === 'loca' ? 'Özel Loca' : 'Orta Salon'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-meyhane-border/70 text-xs">
              <button
                type="button"
                onClick={() => setCapacityModal(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTable(capacityModal.targetTable);
                  onSelectTable(capacityModal.targetTable);
                  setSelectionSuccessFeedback(true);
                  setCapacityModal(null);
                  setTimeout(() => setSelectionSuccessFeedback(false), 3000);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white text-[11px] transition-colors"
                title="Kapasite yetersizliğine rağmen yine de bu masayı seç"
              >
                Yine de Sadece {capacityModal.targetTable.number} ({capacityModal.targetTable.capacity} Kişi) Masasını Seç
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
