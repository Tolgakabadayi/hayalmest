'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Music, 
  Wine, 
  Users, 
  Crown, 
  TreePine, 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw, 
  Sparkles, 
  Move, 
  Check, 
  Layers,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  DoorOpen,
  DoorClosed,
  CreditCard,
  Utensils,
  Building2,
  Compass,
  Sliders,
  Eye,
  X,
  QrCode
} from 'lucide-react';
import { TableItem, TableSection, ALL_TABLES, VENUE_SECTIONS } from '@/data/tablesData';
import { VenueElement } from '@/lib/tablesStorage';
import TableQrCodeModal from '@/components/TableQrCodeModal';

interface FloorPlanDesignerProps {
  initialTables: TableItem[];
  initialElements: VenueElement[];
  onSave: (tables: TableItem[], elements: VenueElement[]) => Promise<void>;
}

export default function FloorPlanDesigner({
  initialTables,
  initialElements,
  onSave,
}: FloorPlanDesignerProps) {
  // Tables and Elements state
  const [tables, setTables] = useState<TableItem[]>(initialTables || []);
  const [elements, setElements] = useState<VenueElement[]>(
    initialElements && initialElements.length > 0
      ? initialElements
      : [
          { id: 'stage-1', type: 'stage', name: 'CANLI FASIL & MÜZİK SAHNESİ', posX: 50, posY: 8, width: 44, height: 9 },
          { id: 'bar-1', type: 'bar', name: 'Kokteyl & Rakı Barı', posX: 8, posY: 46, width: 10, height: 26 },
          { id: 'entrance-1', type: 'entrance', name: 'Ana Giriş Kapısı', posX: 50, posY: 95, width: 14, height: 6 },
          { id: 'exit-1', type: 'exit', name: 'Acil Çıkış Kapısı', posX: 92, posY: 94, width: 12, height: 6 },
          { id: 'wc-1', type: 'wc', name: 'Bay & Bayan WC', posX: 90, posY: 10, width: 12, height: 10 },
          { id: 'cashier-1', type: 'cashier', name: 'Kasa & Banko', posX: 36, posY: 90, width: 12, height: 6 },
          { id: 'wine-1', type: 'wine', name: 'Şarap Kavı', posX: 92, posY: 46, width: 10, height: 22 },
        ]
  );

  // Sync props when fetched from server
  useEffect(() => {
    if (initialTables?.length) setTables(initialTables);
  }, [initialTables]);

  useEffect(() => {
    if (initialElements?.length) setElements(initialElements);
  }, [initialElements]);

  // Lock design mode
  const [isLocked, setIsLocked] = useState(false);

  // Floating Add Asset Drawer (Varlık Ekleme Çekmecesi)
  const [showAddAssetDrawer, setShowAddAssetDrawer] = useState(false);

  // Radar expanded on hover / click
  const [isRadarHovered, setIsRadarHovered] = useState(false);

  // Selection state
  const [selectedItem, setSelectedItem] = useState<{ type: 'table' | 'element'; id: string } | null>(null);
  const [qrTableTarget, setQrTableTarget] = useState<TableItem | null>(null);

  // Hovered item for instant magnified tooltip
  const [hoveredTable, setHoveredTable] = useState<TableItem | null>(null);

  // Left sidebar category tab
  const [activeAssetTab, setActiveAssetTab] = useState<'tables' | 'architectural' | 'custom'>('tables');

  // Zoom state (default: 0.90 = 90%, range: 0.65 to 1.80)
  const [zoom, setZoom] = useState(0.90);

  // Mobile active tab: 'canvas' | 'assets' | 'inspector'
  const [mobileTab, setMobileTab] = useState<'canvas' | 'assets' | 'inspector'>('canvas');

  // Ultra-smooth 144 FPS Zero-Lag Drag Tracking with Pointer Events & Direct DOM transform
  const pointerDragState = useRef<{
    isDown: boolean;
    hasMoved: boolean;
    startX: number;
    startY: number;
    itemType: 'table' | 'element';
    itemId: string;
    initialPosX: number;
    initialPosY: number;
    currentPosX: number;
    currentPosY: number;
    offsetX: number;
    offsetY: number;
    targetEl: HTMLElement | null;
    containerRect: DOMRect | null;
  } | null>(null);

  // Pointer Resize state for dragging table and element corners
  const pointerResizeState = useRef<{
    isResizing: boolean;
    itemType: 'table' | 'element';
    itemId: string;
    startX: number;
    startY: number;
    initialWidthPct: number;
    initialHeightPct: number;
    targetEl: HTMLElement | null;
  } | null>(null);

  // Pan (Hand tool) state for canvas dragging
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);

  // Viewport box in the radar (Odaklanan Noktayı Ufak Bir Dikdörtgen İçerisinde Gösterme)
  const [viewportBox, setViewportBox] = useState({ x: 0, y: 0, w: 25, h: 25 });

  // Save feedback state
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Refs for scrolling and canvas coordinate calculations
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasInnerRef = useRef<HTMLDivElement>(null);

  // Generous Virtual Dimensions (Supports 200+ tables with great spacing)
  const VIRTUAL_WIDTH = 2400;
  const VIRTUAL_HEIGHT = 1500;

  // Custom asset creation form state
  const [customAssetName, setCustomAssetName] = useState('');
  const [customAssetType, setCustomAssetType] = useState<VenueElement['type']>('custom');
  const [customAssetWidth, setCustomAssetWidth] = useState(14);
  const [customAssetHeight, setCustomAssetHeight] = useState(10);
  const [customAssetColor, setCustomAssetColor] = useState('gold');

  // Quick Table templates
  const tableTemplates = [
    { type: 'vip', name: 'VIP Sahne Masası', sectionId: 'vip_sahne', capacity: 4, icon: Crown, color: 'border-amber-400 bg-amber-950/40 text-amber-200' },
    { type: 'salon', name: 'Standart Kare Masa', sectionId: 'salon', capacity: 4, icon: Wine, color: 'border-emerald-400 bg-emerald-950/40 text-emerald-200' },
    { type: 'group', name: 'Büyük Grup Masası', sectionId: 'salon', capacity: 10, icon: Users, color: 'border-blue-400 bg-blue-950/40 text-blue-200' },
    { type: 'loca', name: 'Özel Kutlama Locası', sectionId: 'loca', capacity: 12, icon: Sparkles, color: 'border-purple-400 bg-purple-950/40 text-purple-200' },
    { type: 'bahce', name: 'Bahçe / Teras Masası', sectionId: 'bahce', capacity: 4, icon: TreePine, color: 'border-teal-400 bg-teal-950/40 text-teal-200' },
  ];

  // Architectural Kroki Element templates
  const architecturalTemplates: { type: VenueElement['type']; name: string; icon: any; defaultW: number; defaultH: number; desc: string }[] = [
    { type: 'stage', name: 'Canlı Sahne & Müzik Alanı', icon: Music, defaultW: 44, defaultH: 10, desc: 'Fasıl, vokal ve canlı orkestra platformu' },
    { type: 'bar', name: 'Kokteyl & Rakı Barı', icon: Wine, defaultW: 10, defaultH: 26, desc: 'Hızlı içecek servisi ve bar tabureleri' },
    { type: 'entrance', name: 'Ana Giriş Kapısı', icon: DoorOpen, defaultW: 14, defaultH: 7, desc: 'Müşteri karşılama & giriş kapısı' },
    { type: 'exit', name: 'Acil Çıkış Kapısı', icon: DoorClosed, defaultW: 12, defaultH: 7, desc: 'Yangın ve acil çıkış tahliye kapısı' },
    { type: 'wc', name: 'Bay & Bayan Tuvaletler', icon: Users, defaultW: 14, defaultH: 11, desc: 'Restroom & lavabo bölgesi' },
    { type: 'cashier', name: 'Kasa & Karşılama Bankosu', icon: CreditCard, defaultW: 12, defaultH: 7, desc: 'Adisyon & ödeme noktası' },
    { type: 'kitchen', name: 'Mutfak & Servis Hattı', icon: Utensils, defaultW: 16, defaultH: 14, desc: 'Sıcak mezeler ve mutfak çıkışı' },
    { type: 'column', name: 'Taşıyıcı Kolon / Direk', icon: Building2, defaultW: 6, defaultH: 6, desc: 'Mimari kolon engeli' },
    { type: 'wine', name: 'Şarap Kavı & Mahzen', icon: Sparkles, defaultW: 10, defaultH: 22, desc: 'Özel şarap sergileme alanı' },
  ];

  // Quick Table Creation
  const [quickTableNum, setQuickTableNum] = useState('');
  const [quickTableCap, setQuickTableCap] = useState(4);
  const [quickTableSec, setQuickTableSec] = useState<'vip_sahne' | 'salon' | 'bahce' | 'loca'>('salon');

  // Add Table from Template
  const addTableFromTemplate = (template: typeof tableTemplates[0]) => {
    if (isLocked) {
      alert('Tasarım kilitli! Yeni masa eklemek için lütfen önce kilidi açın.');
      return;
    }
    const newId = `t-${Date.now()}`;
    const nextNum = `${template.name.split(' ')[0]} ${tables.length + 1}`;

    const newTbl: TableItem = {
      id: newId,
      number: nextNum,
      sectionId: template.sectionId as any,
      capacity: template.capacity,
      minGuests: Math.max(1, Math.floor(template.capacity / 2)),
      adjacentWith: [],
      posX: 45 + Math.floor(Math.random() * 10),
      posY: 45 + Math.floor(Math.random() * 10),
      width: template.type === 'loca' ? 8 : template.type === 'vip' ? 7 : 6,
      height: template.type === 'loca' ? 7 : 6,
    };

    setTables(prev => [...prev, newTbl]);
    setSelectedItem({ type: 'table', id: newId });
    setShowAddAssetDrawer(false);
    setMobileTab('canvas');
    setStatusMsg(`✓ "${nextNum}" tuvale eklendi! Sürükleyerek konumlandırabilirsiniz.`);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  // Add Custom Table
  const handleAddCustomTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert('Tasarım kilitli! Yeni masa eklemek için lütfen önce kilidi açın.');
      return;
    }
    const name = quickTableNum.trim() || `Masa ${tables.length + 1}`;
    const newId = `t-${Date.now()}`;

    const newTbl: TableItem = {
      id: newId,
      number: name,
      sectionId: quickTableSec,
      capacity: quickTableCap,
      minGuests: Math.max(1, Math.floor(quickTableCap / 2)),
      adjacentWith: [],
      posX: 45 + Math.floor(Math.random() * 10),
      posY: 45 + Math.floor(Math.random() * 10),
      width: quickTableSec === 'loca' ? 8 : quickTableSec === 'vip_sahne' ? 7 : 6,
      height: quickTableSec === 'loca' ? 7 : 6,
    };

    setTables(prev => [...prev, newTbl]);
    setSelectedItem({ type: 'table', id: newId });
    setQuickTableNum('');
    setShowAddAssetDrawer(false);
    setMobileTab('canvas');
    setStatusMsg(`✓ "${name}" tuvale eklendi! Sürükleyerek konumlandırabilirsiniz.`);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  // Add Architectural Element from Template
  const addArchitecturalElement = (item: typeof architecturalTemplates[0]) => {
    if (isLocked) {
      alert('Tasarım kilitli! Yeni mimari varlık eklemek için lütfen önce kilidi açın.');
      return;
    }
    const newId = `${item.type}-${Date.now()}`;
    const newElem: VenueElement = {
      id: newId,
      type: item.type,
      name: item.name,
      posX: 45 + Math.floor(Math.random() * 10),
      posY: 45 + Math.floor(Math.random() * 10),
      width: item.defaultW,
      height: item.defaultH,
    };

    setElements(prev => [...prev, newElem]);
    setSelectedItem({ type: 'element', id: newId });
    setShowAddAssetDrawer(false);
    setMobileTab('canvas');
    setStatusMsg(`✓ "${item.name}" mimari krokiye eklendi!`);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  // Add Custom Asset from Form
  const handleAddCustomAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert('Tasarım kilitli! Yeni varlık eklemek için lütfen önce kilidi açın.');
      return;
    }
    const name = customAssetName.trim() || 'Özel Mimari Bölme';
    const newId = `custom-${Date.now()}`;

    const newElem: VenueElement = {
      id: newId,
      type: customAssetType,
      name: name,
      posX: 48,
      posY: 48,
      width: customAssetWidth,
      height: customAssetHeight,
      color: customAssetColor,
    };

    setElements(prev => [...prev, newElem]);
    setSelectedItem({ type: 'element', id: newId });
    setCustomAssetName('');
    setShowAddAssetDrawer(false);
    setMobileTab('canvas');
    setStatusMsg(`✓ "${name}" tuvale eklendi!`);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  // Update Viewport Box in Radar
  const updateViewportBox = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const totalW = VIRTUAL_WIDTH * zoom;
    const totalH = VIRTUAL_HEIGHT * zoom;
    const clientW = el.clientWidth;
    const clientH = el.clientHeight;

    const x = Math.min(100, Math.max(0, (el.scrollLeft / totalW) * 100));
    const y = Math.min(100, Math.max(0, (el.scrollTop / totalH) * 100));
    const w = Math.min(100, Math.max(8, (clientW / totalW) * 100));
    const h = Math.min(100, Math.max(8, (clientH / totalH) * 100));

    setViewportBox({ x, y, w, h });
  }, [zoom]);

  // Update Radar Viewfinder on zoom change or mount
  useEffect(() => {
    updateViewportBox();
  }, [zoom, updateViewportBox]);

  // Mouse Wheel (Scroll) to Zoom In / Zoom Out smoothly
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent browser vertical page scroll while over canvas
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      setZoom(prev => Math.min(1.80, Math.max(0.20, Number((prev + delta).toFixed(2)))));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Hand Pan (Window-level mouse movement for silky-smooth drag navigation)
  useEffect(() => {
    const onWindowMouseMove = (e: MouseEvent) => {
      if (!isPanning || !panStartRef.current || !scrollContainerRef.current) return;
      const dx = e.clientX - panStartRef.current.startX;
      const dy = e.clientY - panStartRef.current.startY;
      scrollContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
      scrollContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
    };

    const onWindowMouseUp = () => {
      if (isPanning) {
        setIsPanning(false);
        panStartRef.current = null;
        updateViewportBox();
      }
    };

    if (isPanning) {
      window.addEventListener('mousemove', onWindowMouseMove);
      window.addEventListener('mouseup', onWindowMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [isPanning, updateViewportBox]);

  // ULTRA-SMOOTH 144 FPS POINTER EVENT DRAG & CLICK HANDLERS
  const handlePointerDownItem = (
    type: 'table' | 'element',
    id: string,
    currentPosX: number,
    currentPosY: number,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if ((e.target as HTMLElement).closest('[data-resize-handle="true"]')) return;
    e.stopPropagation();

    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch (_) {}

    const canvasEl = canvasInnerRef.current;
    const canvasRect = canvasEl ? canvasEl.getBoundingClientRect() : null;
    const targetRect = target.getBoundingClientRect();

    let offsetX = 0;
    let offsetY = 0;
    if (canvasRect) {
      const clickX = (e.clientX - canvasRect.left) / zoom;
      const clickY = (e.clientY - canvasRect.top) / zoom;
      const itemCenterX = (targetRect.left + targetRect.width / 2 - canvasRect.left) / zoom;
      const itemCenterY = (targetRect.top + targetRect.height / 2 - canvasRect.top) / zoom;
      offsetX = clickX - itemCenterX;
      offsetY = clickY - itemCenterY;
    }

    pointerDragState.current = {
      isDown: true,
      hasMoved: false,
      startX: e.clientX,
      startY: e.clientY,
      itemType: type,
      itemId: id,
      initialPosX: currentPosX,
      initialPosY: currentPosY,
      currentPosX: currentPosX,
      currentPosY: currentPosY,
      offsetX,
      offsetY,
      targetEl: target,
      containerRect: canvasRect,
    };
  };

  const handlePointerMoveItem = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerDragState.current;
    if (!state || !state.isDown || isLocked) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    const dist = Math.hypot(dx, dy);

    if (!state.hasMoved) {
      if (dist < 6) {
        // Below movement threshold: don't initiate drag yet
        return;
      }
      state.hasMoved = true;
      if (state.targetEl) {
        state.targetEl.classList.add('cursor-grabbing', 'shadow-2xl', 'z-50', 'opacity-95');
        state.targetEl.style.transition = 'none'; // Critical: kill CSS transition delay while dragging
      }
    }

    const canvasEl = canvasInnerRef.current;
    if (!canvasEl) return;
    const canvasRect = canvasEl.getBoundingClientRect();

    const unscaledX = (e.clientX - canvasRect.left) / zoom;
    const unscaledY = (e.clientY - canvasRect.top) / zoom;

    const targetX = unscaledX - state.offsetX;
    const targetY = unscaledY - state.offsetY;

    const newPosX = Math.max(1, Math.min(99, Math.round((targetX / VIRTUAL_WIDTH) * 100)));
    const newPosY = Math.max(1, Math.min(99, Math.round((targetY / VIRTUAL_HEIGHT) * 100)));

    state.currentPosX = newPosX;
    state.currentPosY = newPosY;

    // DIRECT DOM UPDATE: Instant 144 FPS positioning without React diff lag
    if (state.targetEl) {
      state.targetEl.style.left = `${newPosX}%`;
      state.targetEl.style.top = `${newPosY}%`;
    }
  };

  const handlePointerUpItem = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerDragState.current;
    if (!state || !state.isDown) return;

    const target = state.targetEl;
    if (target) {
      try {
        target.releasePointerCapture(e.pointerId);
      } catch (_) {}
      target.classList.remove('cursor-grabbing', 'shadow-2xl', 'z-50', 'opacity-95');
      target.style.transition = '';
    }

    if (!state.hasMoved) {
      // PURE CLICK / TAP: Open inspector properties!
      setSelectedItem({ type: state.itemType, id: state.itemId });
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setMobileTab('inspector');
      }
    } else {
      // DRAG OPERATION: Commit new coordinates to React state!
      // Do NOT open inspector when user dragged / repositioned the table
      const { itemType, itemId, currentPosX, currentPosY } = state;
      if (itemType === 'table') {
        setTables(prev => prev.map(t => t.id === itemId ? { ...t, posX: currentPosX, posY: currentPosY } : t));
      } else {
        setElements(prev => prev.map(el => el.id === itemId ? { ...el, posX: currentPosX, posY: currentPosY } : el));
      }
    }

    pointerDragState.current = null;
  };

  const handlePointerCancelItem = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerDragState.current;
    if (!state) return;
    const target = state.targetEl;
    if (target) {
      try {
        target.releasePointerCapture(e.pointerId);
      } catch (_) {}
      target.classList.remove('cursor-grabbing', 'shadow-2xl', 'z-50', 'opacity-95');
      target.style.transition = '';
      target.style.left = `${state.initialPosX}%`;
      target.style.top = `${state.initialPosY}%`;
    }
    pointerDragState.current = null;
  };

  // CORNER DRAG RESIZE HANDLERS (Ultra-smooth 144 FPS dynamic sizing for tables and architecture elements)
  const handlePointerDownResize = (
    type: 'table' | 'element',
    id: string,
    initialW: number,
    initialH: number,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (isLocked) return;
    e.stopPropagation();

    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch (_) {}

    pointerResizeState.current = {
      isResizing: true,
      itemType: type,
      itemId: id,
      startX: e.clientX,
      startY: e.clientY,
      initialWidthPct: initialW,
      initialHeightPct: initialH,
      targetEl: handleEl.parentElement as HTMLElement | null,
    };
  };

  const handlePointerMoveResize = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerResizeState.current;
    if (!state || !state.isResizing || isLocked) return;
    e.stopPropagation();

    const dx = (e.clientX - state.startX) / zoom;
    const dy = (e.clientY - state.startY) / zoom;

    const dWidthPct = (dx / VIRTUAL_WIDTH) * 100;
    const dHeightPct = (dy / VIRTUAL_HEIGHT) * 100;

    const minW = state.itemType === 'table' ? 3 : 4;
    const maxW = state.itemType === 'table' ? 40 : 80;
    const minH = 3;
    const maxH = state.itemType === 'table' ? 40 : 70;

    const newW = Math.max(minW, Math.min(maxW, Math.round(state.initialWidthPct + dWidthPct)));
    const newH = Math.max(minH, Math.min(maxH, Math.round(state.initialHeightPct + dHeightPct)));

    if (state.targetEl) {
      state.targetEl.style.width = `${newW}%`;
      state.targetEl.style.height = `${newH}%`;
    }
  };

  const handlePointerUpResize = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerResizeState.current;
    if (!state || !state.isResizing) return;
    e.stopPropagation();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const dx = (e.clientX - state.startX) / zoom;
    const dy = (e.clientY - state.startY) / zoom;

    const dWidthPct = (dx / VIRTUAL_WIDTH) * 100;
    const dHeightPct = (dy / VIRTUAL_HEIGHT) * 100;

    const minW = state.itemType === 'table' ? 3 : 4;
    const maxW = state.itemType === 'table' ? 40 : 80;
    const minH = 3;
    const maxH = state.itemType === 'table' ? 40 : 70;

    const finalW = Math.max(minW, Math.min(maxW, Math.round(state.initialWidthPct + dWidthPct)));
    const finalH = Math.max(minH, Math.min(maxH, Math.round(state.initialHeightPct + dHeightPct)));

    if (state.itemType === 'table') {
      setTables(prev => prev.map(t => t.id === state.itemId ? { ...t, width: finalW, height: finalH } : t));
    } else {
      setElements(prev => prev.map(el => el.id === state.itemId ? { ...el, width: finalW, height: finalH } : el));
    }

    pointerResizeState.current = null;
  };

  // Pan Handlers for the empty canvas background (Hand Tool / Drag-to-Scroll)
  const handleViewportMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't pan if clicking an interactive table, element or resize handle
    if (target.closest('[data-drag-item="true"]') || target.closest('[data-resize-handle="true"]')) {
      return;
    }
    setIsPanning(true);
    if (scrollContainerRef.current) {
      panStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: scrollContainerRef.current.scrollLeft,
        scrollTop: scrollContainerRef.current.scrollTop,
      };
    }
  };

  // Touch Pan for Mobile Canvas Background
  const handleViewportTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-drag-item="true"]') || e.touches.length !== 1) {
      return;
    }
    const touch = e.touches[0];
    if (scrollContainerRef.current) {
      panStartRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        scrollLeft: scrollContainerRef.current.scrollLeft,
        scrollTop: scrollContainerRef.current.scrollTop,
      };
    }
  };

  const handleViewportTouchMove = (e: React.TouchEvent) => {
    if (!panStartRef.current || !scrollContainerRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - panStartRef.current.startX;
    const dy = touch.clientY - panStartRef.current.startY;
    scrollContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
    scrollContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handleViewportTouchEnd = () => {
    panStartRef.current = null;
    updateViewportBox();
  };

  // Delete Handlers
  const handleDeleteSelected = () => {
    if (!selectedItem) return;
    if (isLocked) {
      alert('Tasarım kilitli! Silme işlemi yapmak için lütfen önce kilidi açın.');
      return;
    }

    if (selectedItem.type === 'table') {
      const target = tables.find(t => t.id === selectedItem.id);
      if (confirm(`"${target?.number || 'Bu masa'}" silinsin mi?`)) {
        setTables(prev => prev.filter(t => t.id !== selectedItem.id));
        setSelectedItem(null);
      }
    } else {
      const target = elements.find(el => el.id === selectedItem.id);
      if (confirm(`"${target?.name || 'Bu mimari varlık'}" silinsin mi?`)) {
        setElements(prev => prev.filter(el => el.id !== selectedItem.id));
        setSelectedItem(null);
      }
    }
  };

  // Zoom Functions (Clamped between 0.20 and 1.80)
  const handleZoomIn = () => setZoom(prev => Math.min(1.80, Number((prev + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom(prev => Math.max(0.20, Number((prev - 0.15).toFixed(2))));
  const handleResetZoom = () => setZoom(0.85);
  const handleFitScreen = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const scaleX = (container.clientWidth - 48) / VIRTUAL_WIDTH;
      const scaleY = (container.clientHeight - 48) / VIRTUAL_HEIGHT;
      const fit = Math.min(scaleX, scaleY);
      const clamped = Math.min(1.40, Math.max(0.20, Number(fit.toFixed(2))));
      setZoom(clamped);
      container.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    } else {
      setZoom(0.35);
    }
  };

  // Quick Scroll to Zone in 2400px hall
  const scrollToZone = (xPct: number, yPct: number) => {
    if (!scrollContainerRef.current) return;
    const targetX = (VIRTUAL_WIDTH * zoom * xPct) / 100 - scrollContainerRef.current.clientWidth / 2;
    const targetY = (VIRTUAL_HEIGHT * zoom * yPct) / 100 - scrollContainerRef.current.clientHeight / 2;
    scrollContainerRef.current.scrollTo({
      left: Math.max(0, targetX),
      top: Math.max(0, targetY),
      behavior: 'smooth',
    });
    setTimeout(updateViewportBox, 150);
  };

  // Radar click to focus (Tıkla Odaklan)
  const handleRadarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickXPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const clickYPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    scrollToZone(clickXPct, clickYPct);
  };

  // Save changes
  const handleSaveLayout = async () => {
    setIsSaving(true);
    setStatusMsg('');
    try {
      await onSave(tables, elements);
      setStatusMsg('✓ Salon planı ve mimari kroki başarıyla kaydedildi! Sitede ve host masasında anında yayında.');
      setTimeout(() => setStatusMsg(''), 5000);
    } catch (err) {
      setStatusMsg('Hata: Kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  // Completely wipe / reset canvas (Komple Tuvali Sıfırla)
  const handleResetCanvas = () => {
    if (isLocked) {
      alert('Tasarım kilitli! Tuvali sıfırlamak için lütfen önce kilidi açın.');
      return;
    }
    if (confirm('DİKKAT: Tuvaldeki TÜM masaları ve mimari öğeleri (sahne, bar, kapılar, wc vb.) silip tuvali tamamen boşaltarak sıfırdan başlamak istediğinize emin misiniz?')) {
      setTables([]);
      setElements([]);
      setSelectedItem(null);
      setStatusMsg('✓ Tuval tamamen sıfırlandı. "+ Varlık Ekle" menüsünden mimari öğeleri ve masaları yerleştirmeye başlayabilirsiniz.');
      setTimeout(() => setStatusMsg(''), 6000);
    }
  };

  // Restore sample demo template (Örnek Şablonu Geri Yükle)
  const handleRestoreSampleTemplate = () => {
    if (isLocked) {
      alert('Tasarım kilitli! Şablon yüklemek için lütfen önce kilidi açın.');
      return;
    }
    if (confirm('Varsayılan 16 masalı örnek salon şablonunu ve mimari krokiyi geri yüklemek istediğinize emin misiniz?')) {
      setTables(ALL_TABLES);
      setElements([
        { id: 'stage-1', type: 'stage', name: 'CANLI FASIL & MÜZİK SAHNESİ', posX: 50, posY: 8, width: 44, height: 9 },
        { id: 'bar-1', type: 'bar', name: 'Kokteyl & Rakı Barı', posX: 8, posY: 46, width: 10, height: 26 },
        { id: 'entrance-1', type: 'entrance', name: 'Ana Giriş Kapısı', posX: 50, posY: 95, width: 14, height: 6 },
        { id: 'exit-1', type: 'exit', name: 'Acil Çıkış Kapısı', posX: 92, posY: 94, width: 12, height: 6 },
        { id: 'wc-1', type: 'wc', name: 'Bay & Bayan WC', posX: 90, posY: 10, width: 12, height: 10 },
        { id: 'cashier-1', type: 'cashier', name: 'Kasa & Banko', posX: 36, posY: 90, width: 12, height: 6 },
        { id: 'wine-1', type: 'wine', name: 'Şarap Kavı', posX: 92, posY: 46, width: 10, height: 22 },
      ]);
      setSelectedItem(null);
      setStatusMsg('✓ Örnek salon şablonu geri yüklendi.');
      setTimeout(() => setStatusMsg(''), 4000);
    }
  };

  const currentTable = selectedItem?.type === 'table' ? tables.find(t => t.id === selectedItem.id) : null;
  const currentElement = selectedItem?.type === 'element' ? elements.find(el => el.id === selectedItem.id) : null;

  // Total venue capacity
  const totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || 0), 0);

  // Dynamic Adaptive Text Scaling for readability at any zoom level
  const textScale = zoom < 1.0 ? Math.min(1.6, Number((1.0 / zoom).toFixed(2))) : 1.0;

  // Generous table card dimensions so they never become illegibly small or hard to click
  const tableMinW = Math.max(104, Math.round(104 * (zoom < 1.0 ? 1.0 / zoom : 1)));
  const tableMinH = Math.max(72, Math.round(72 * (zoom < 1.0 ? 1.0 / zoom : 1)));

  // RENDER INSPECTOR CONTENT (Used in both standard right column AND wide-mode floating drawer)
  const renderInspectorContent = () => {
    if (currentTable) {
      return (
        <div className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-gray-300 font-semibold">Masa Adı / No</label>
            <input
              type="text"
              disabled={isLocked}
              value={currentTable.number}
              onChange={(e) => {
                const val = e.target.value;
                setTables(prev => prev.map(t => t.id === currentTable.id ? { ...t, number: val } : t));
              }}
              className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none font-medium disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-gray-300 font-semibold">Kapasite</label>
              <input
                type="number"
                min={1}
                max={30}
                disabled={isLocked}
                value={currentTable.capacity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setTables(prev => prev.map(t => t.id === currentTable.id ? { ...t, capacity: val } : t));
                }}
                className="w-full bg-meyhane-bg border border-meyhane-border p-2 rounded-xl text-white font-bold text-gold disabled:opacity-60"
              />
            </div>
            <div className="space-y-1">
              <label className="text-gray-300 font-semibold">Min Kişi</label>
              <input
                type="number"
                min={1}
                disabled={isLocked}
                value={currentTable.minGuests}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setTables(prev => prev.map(t => t.id === currentTable.id ? { ...t, minGuests: val } : t));
                }}
                className="w-full bg-meyhane-bg border border-meyhane-border p-2 rounded-xl text-white disabled:opacity-60"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-gray-300 font-semibold">Salon Bölgesi</label>
            <select
              disabled={isLocked}
              value={currentTable.sectionId}
              onChange={(e) => {
                const val = e.target.value as any;
                setTables(prev => prev.map(t => t.id === currentTable.id ? { ...t, sectionId: val } : t));
              }}
              className="w-full bg-meyhane-bg border border-meyhane-border p-2 rounded-xl text-white focus:border-gold focus:outline-none disabled:opacity-60"
            >
              <option value="vip_sahne">VIP Sahne Önü</option>
              <option value="salon">Orta Salon</option>
              <option value="bahce">Bahçe &amp; Teras</option>
              <option value="loca">Özel Loca</option>
            </select>
          </div>

          {/* Table Dimensions (Genişlik & Yükseklik %) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-gray-300 text-[11px] font-semibold">Genişlik (%)</label>
              <input
                type="number"
                min={3}
                max={40}
                disabled={isLocked}
                value={currentTable.width || 6}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 6;
                  setTables(prev => prev.map(t => t.id === currentTable.id ? { ...t, width: val } : t));
                }}
                className="w-full bg-meyhane-bg border border-meyhane-border p-2 rounded-xl text-white font-bold disabled:opacity-60"
              />
            </div>
            <div className="space-y-1">
              <label className="text-gray-300 text-[11px] font-semibold">Yükseklik (%)</label>
              <input
                type="number"
                min={3}
                max={40}
                disabled={isLocked}
                value={currentTable.height || 6}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 6;
                  setTables(prev => prev.map(t => t.id === currentTable.id ? { ...t, height: val } : t));
                }}
                className="w-full bg-meyhane-bg border border-meyhane-border p-2 rounded-xl text-white font-bold disabled:opacity-60"
              />
            </div>
          </div>

          {/* Coordinate location */}
          <div className="p-2.5 rounded-xl bg-meyhane-bg border border-meyhane-border/70 flex items-center justify-between text-[11px] text-gray-400">
            <span>Tuval Konumu:</span>
            <span className="font-mono text-gold font-semibold">X: %{currentTable.posX} • Y: %{currentTable.posY}</span>
          </div>

          {/* Adjacent tables connection for smart merge */}
          <div className="space-y-1 pt-1">
            <label className="text-gray-300 font-semibold">Birleştirilebilir Komşular</label>
            <div className="max-h-28 overflow-y-auto space-y-1 p-2 rounded-xl bg-meyhane-bg border border-meyhane-border">
              {tables.filter(t => t.id !== currentTable.id).map(other => {
                const isChecked = currentTable.adjacentWith.includes(other.id);
                return (
                  <label key={other.id} className="flex items-center gap-2 text-[11px] text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isLocked}
                      checked={isChecked}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setTables(prev => prev.map(t => {
                          if (t.id === currentTable.id) {
                            const newAdj = checked
                              ? [...t.adjacentWith, other.id]
                              : t.adjacentWith.filter(x => x !== other.id);
                            return { ...t, adjacentWith: newAdj };
                          }
                          return t;
                        }));
                      }}
                      className="rounded text-gold focus:ring-gold"
                    />
                    <span>{other.number} ({other.capacity}p)</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => setQrTableTarget(currentTable)}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 hover:from-gold/30 hover:to-gold/20 text-gold border border-gold/40 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md group"
            >
              <QrCode className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
              <span>Masaya Özel Canlı QR Menü &amp; Kod</span>
            </button>

            <button
              type="button"
              disabled={isLocked}
              onClick={handleDeleteSelected}
              className="w-full py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/40 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Bu Masayı Sil</span>
            </button>
          </div>
        </div>
      );
    }

    if (currentElement) {
      return (
        <div className="space-y-3.5 text-xs animate-fadeIn">
          <div className="space-y-1">
            <label className="text-gray-300 font-semibold">Varlık / Kroki Başlığı</label>
            <input
              type="text"
              disabled={isLocked}
              value={currentElement.name}
              onChange={(e) => {
                const val = e.target.value;
                setElements(prev => prev.map(el => el.id === currentElement.id ? { ...el, name: val } : el));
              }}
              className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none font-medium disabled:opacity-60"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-300 font-semibold">Varlık Türü</label>
            <select
              disabled={isLocked}
              value={currentElement.type}
              onChange={(e) => {
                const val = e.target.value as any;
                setElements(prev => prev.map(el => el.id === currentElement.id ? { ...el, type: val } : el));
              }}
              className="w-full bg-meyhane-bg border border-meyhane-border p-2 rounded-xl text-white focus:border-gold focus:outline-none disabled:opacity-60"
            >
              <option value="stage">🎤 Canlı Sahne &amp; Fasıl Platformu</option>
              <option value="bar">🍸 Kokteyl &amp; Rakı Barı</option>
              <option value="entrance">🚪 Ana Müşteri Giriş Kapısı</option>
              <option value="exit">🚪 Acil Çıkış / Yangın Kapısı</option>
              <option value="wc">🚻 Bay &amp; Bayan WC</option>
              <option value="cashier">💳 Kasa &amp; Banko</option>
              <option value="kitchen">🍽️ Mutfak &amp; Servis</option>
              <option value="column">🏛️ Taşıyıcı Kolon / Direk</option>
              <option value="wine">🍷 Şarap Kavı</option>
              <option value="custom">✨ Özel Kroki Alanı</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-gray-300 text-[11px] font-semibold">Genişlik (%)</label>
              <input
                type="number"
                min={4}
                max={80}
                disabled={isLocked}
                value={currentElement.width || 12}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 6;
                  setElements(prev => prev.map(el => el.id === currentElement.id ? { ...el, width: val } : el));
                }}
                className="w-full bg-meyhane-bg border border-meyhane-border p-2 rounded-xl text-white font-bold disabled:opacity-60"
              />
            </div>
            <div className="space-y-1">
              <label className="text-gray-300 text-[11px] font-semibold">Yükseklik (%)</label>
              <input
                type="number"
                min={3}
                max={70}
                disabled={isLocked}
                value={currentElement.height || 10}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 5;
                  setElements(prev => prev.map(el => el.id === currentElement.id ? { ...el, height: val } : el));
                }}
                className="w-full bg-meyhane-bg border border-meyhane-border p-2 rounded-xl text-white font-bold disabled:opacity-60"
              />
            </div>
          </div>

          {/* Coordinate location */}
          <div className="p-2.5 rounded-xl bg-meyhane-bg border border-meyhane-border/70 flex items-center justify-between text-[11px] text-gray-400">
            <span>Tuval Konumu:</span>
            <span className="font-mono text-gold font-semibold">X: %{currentElement.posX} • Y: %{currentElement.posY}</span>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={isLocked}
              onClick={handleDeleteSelected}
              className="w-full py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/40 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Bu Varlığı Sil</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="py-8 text-center text-meyhane-muted text-xs space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-gold mx-auto flex items-center justify-center">
          <Eye className="w-6 h-6 opacity-70" />
        </div>
        <p>
          Düzenlemek için tuval üzerindeki herhangi bir <strong>masaya</strong> veya <strong>mimari öğeye</strong> (Sahne, Bar, WC, Kapı vb.) tıklayın.
        </p>
        <div className="pt-4 border-t border-meyhane-border/60 text-left space-y-2 text-[11px]">
          <div className="flex items-center justify-between text-gray-400">
            <span>Toplam Masa Sayısı:</span>
            <strong className="text-white">{tables.length}</strong>
          </div>
          <div className="flex items-center justify-between text-gray-400">
            <span>Toplam Kapasite:</span>
            <strong className="text-gold">{totalCapacity} Kişi</strong>
          </div>
          <div className="flex items-center justify-between text-gray-400">
            <span>Mimari Kroki Öğeleri:</span>
            <strong className="text-emerald-400">{elements.length} Öğe</strong>
          </div>
          <div className="flex items-center justify-between text-gray-400">
            <span>Düzenleme Durumu:</span>
            <strong className={isLocked ? 'text-amber-400' : 'text-emerald-400'}>
              {isLocked ? '🔒 Kilitli' : '🔓 Düzenlenebilir'}
            </strong>
          </div>
        </div>
      </div>
    );
  };

  // RENDER ASSET PALETTE CONTENT (Used in Left Panel, Wide Mode Drawer, and Mobile Tab)
  const renderAssetPaletteContent = () => (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-meyhane-bg border border-meyhane-border text-[11px] font-semibold">
        <button
          type="button"
          onClick={() => setActiveAssetTab('tables')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${
            activeAssetTab === 'tables' ? 'bg-gold text-black shadow-md font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          Masalar
        </button>
        <button
          type="button"
          onClick={() => setActiveAssetTab('architectural')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${
            activeAssetTab === 'architectural' ? 'bg-gold text-black shadow-md font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          Mimari
        </button>
        <button
          type="button"
          onClick={() => setActiveAssetTab('custom')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${
            activeAssetTab === 'custom' ? 'bg-gold text-black shadow-md font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          + Özel Çiz
        </button>
      </div>

      {/* TAB 1: MASALAR */}
      {activeAssetTab === 'tables' && (
        <div className="space-y-3 animate-fadeIn">
          <p className="text-[11px] text-meyhane-muted">
            Şablona tıklayarak salona anında yeni masa ekleyin:
          </p>

          <div className="space-y-2">
            {tableTemplates.map((template, idx) => {
              const IconComponent = template.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => addTableFromTemplate(template)}
                  disabled={isLocked}
                  className="w-full p-2.5 rounded-2xl bg-meyhane-bg/70 hover:bg-white/10 border border-meyhane-border hover:border-gold text-left flex items-center justify-between group transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-gold transition-colors">
                        {template.name}
                      </div>
                      <div className="text-[10px] text-meyhane-muted">
                        {template.capacity} Kişilik Kapasite
                      </div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-gray-500 group-hover:text-gold" />
                </button>
              );
            })}
          </div>

          {/* Quick Add Custom Table Form */}
          <form onSubmit={handleAddCustomTable} className="pt-3 border-t border-meyhane-border/70 space-y-2.5 text-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gold font-serif">
              Hızlı Masa Oluştur
            </div>
            <input
              type="text"
              value={quickTableNum}
              onChange={(e) => setQuickTableNum(e.target.value)}
              placeholder="Masa Adı / No (örn: Masa 48)"
              className="w-full bg-meyhane-bg border border-meyhane-border px-3 py-2 rounded-xl text-white text-xs focus:border-gold focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={1}
                max={30}
                value={quickTableCap}
                onChange={(e) => setQuickTableCap(parseInt(e.target.value) || 2)}
                placeholder="Kapasite"
                className="bg-meyhane-bg border border-meyhane-border px-3 py-2 rounded-xl text-white text-xs font-bold text-gold"
              />
              <select
                value={quickTableSec}
                onChange={(e) => setQuickTableSec(e.target.value as any)}
                className="bg-meyhane-bg border border-meyhane-border px-2 py-2 rounded-xl text-white text-[11px] focus:border-gold focus:outline-none"
              >
                <option value="vip_sahne">VIP Sahne</option>
                <option value="salon">Orta Salon</option>
                <option value="bahce">Bahçe</option>
                <option value="loca">Özel Loca</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isLocked}
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-gold hover:text-black border border-meyhane-border hover:border-gold text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Masayı Tuvale Ekle</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: MİMARİ & KROKİ ÖĞELERİ */}
      {activeAssetTab === 'architectural' && (
        <div className="space-y-3 animate-fadeIn">
          <p className="text-[11px] text-meyhane-muted">
            İşletmenizin krokisini çizer gibi Sahne, Bar, WC, Giriş ve Çıkış kapılarını ekleyin:
          </p>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {architecturalTemplates.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => addArchitecturalElement(item)}
                  disabled={isLocked}
                  className="w-full p-2.5 rounded-2xl bg-meyhane-bg/70 hover:bg-white/10 border border-meyhane-border hover:border-gold text-left flex items-center justify-between group transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-gold transition-colors">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-meyhane-muted line-clamp-1">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-gray-500 group-hover:text-gold flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ÖZEL VARLIK ÇİZ */}
      {activeAssetTab === 'custom' && (
        <form onSubmit={handleAddCustomAsset} className="space-y-3 animate-fadeIn text-xs">
          <p className="text-[11px] text-meyhane-muted">
            Kendi özel alanınızı çizin (DJ kabini, sigara balkonu, vestiyer vb.):
          </p>

          <div className="space-y-1">
            <label className="text-gray-300 font-semibold">Varlık / Alan Adı</label>
            <input
              type="text"
              required
              value={customAssetName}
              onChange={(e) => setCustomAssetName(e.target.value)}
              placeholder="örn: DJ Kabini &amp; Işık Masası"
              className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white text-xs focus:border-gold focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-300 font-semibold">Varlık Türü / Şekli</label>
            <select
              value={customAssetType}
              onChange={(e) => setCustomAssetType(e.target.value as any)}
              className="w-full bg-meyhane-bg border border-meyhane-border p-2 rounded-xl text-white text-xs focus:border-gold focus:outline-none"
            >
              <option value="custom">Özel Mimari Bölme</option>
              <option value="stage">Sahne / Podyum</option>
              <option value="bar">Bar Alanı</option>
              <option value="entrance">Giriş Kapısı</option>
              <option value="exit">Çıkış Kapısı</option>
              <option value="wc">WC / Tuvalet</option>
              <option value="cashier">Kasa / Banko</option>
              <option value="kitchen">Mutfak</option>
              <option value="column">Kolon / Direk</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-gray-300 text-[11px]">Genişlik (%)</label>
              <input
                type="number"
                min={4}
                max={70}
                value={customAssetWidth}
                onChange={(e) => setCustomAssetWidth(parseInt(e.target.value) || 10)}
                className="w-full bg-meyhane-bg border border-meyhane-border p-2 rounded-xl text-white text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-gray-300 text-[11px]">Yükseklik (%)</label>
              <input
                type="number"
                min={3}
                max={60}
                value={customAssetHeight}
                onChange={(e) => setCustomAssetHeight(parseInt(e.target.value) || 8)}
                className="w-full bg-meyhane-bg border border-meyhane-border p-2 rounded-xl text-white text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-gray-300 text-[11px]">Renk Teması</label>
            <div className="flex items-center gap-2">
              {[
                { id: 'gold', bg: 'bg-amber-500' },
                { id: 'emerald', bg: 'bg-emerald-500' },
                { id: 'blue', bg: 'bg-blue-500' },
                { id: 'purple', bg: 'bg-purple-500' },
                { id: 'red', bg: 'bg-red-500' },
                { id: 'gray', bg: 'bg-slate-500' },
              ].map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCustomAssetColor(c.id)}
                  className={`w-6 h-6 rounded-full ${c.bg} transition-all ${
                    customAssetColor === c.id ? 'ring-2 ring-white scale-125' : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLocked}
            className="w-full py-2.5 px-3 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Varlığı Tuvale Ekle</span>
          </button>
        </form>
      )}
    </div>
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      
      {/* Top Bar with actions, counters, view controls & lock button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-meyhane-surface border border-meyhane-border shadow-xl">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold font-serif text-white flex items-center gap-2">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
              <span>Salon &amp; Kroki Tasarımcısı</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-gold/15 text-gold text-xs font-semibold border border-gold/30 flex items-center gap-1.5">
              <strong className="text-white">{tables.length}</strong> Masa • 
              <strong className="text-white">{totalCapacity}</strong> Kapasite • 
              <strong className="text-emerald-400">{elements.length}</strong> Mimari
            </span>
          </div>
          <p className="text-[11px] text-gray-400 hidden sm:block">
            Boş tuvali fareyle tutup gezinebilir, mouse scroll ile zoom yapabilir ve masaları serbestçe taşıyabilirsiniz.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Asset Button (Toggles Floating Drawer) */}
          <button
            type="button"
            onClick={() => setShowAddAssetDrawer(prev => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              showAddAssetDrawer
                ? 'bg-gold text-black shadow-lg shadow-gold/30 ring-2 ring-gold'
                : 'bg-gold/20 text-gold border border-gold/40 hover:bg-gold hover:text-black'
            }`}
            title="Varlık &amp; Mimari Kroki Ekleme Çekmecesini Aç / Kapat"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Varlık Ekle</span>
          </button>

          {/* Lock / Unlock Toggle Button */}
          <button
            type="button"
            onClick={() => setIsLocked(!isLocked)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isLocked
                ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-500/60 shadow-md shadow-amber-500/15'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/15 hover:border-gold'
            }`}
            title={isLocked ? "Tasarım Kilitli: Masalar kazara kaydırılamaz. Kilidi açmak için tıklayın." : "Tasarımı kilitleyerek kazara taşınmasını engelleyin."}
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Kilitli</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-gray-400" />
                <span>Kilitle</span>
              </>
            )}
          </button>

          {/* Reset Entire Canvas Button (Komple Sıfırla) */}
          <button
            type="button"
            disabled={isLocked}
            onClick={handleResetCanvas}
            className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            title="Tuvaldeki TÜM masaları ve mimari öğeleri temizleyerek tuvali tamamen sıfırlar"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            <span>Tuvali Sıfırla</span>
          </button>

          {/* Restore Sample Template Button */}
          <button
            type="button"
            disabled={isLocked}
            onClick={handleRestoreSampleTemplate}
            className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gold border border-white/10 text-xs font-medium hidden sm:flex items-center gap-1 transition-colors disabled:opacity-40"
            title="Varsayılan 16 masalı örnek salon şablonunu geri yükle"
          >
            <Sparkles className="w-3 h-3 text-gold" />
            <span>Örnek Şablon</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-medium animate-fadeIn flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Mobile Navigation Tabs (visible only on mobile screens < lg) */}
      <div className="flex lg:hidden items-center gap-2 p-1.5 rounded-2xl bg-meyhane-surface border border-meyhane-border text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileTab('canvas')}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'canvas' ? 'bg-gold text-black font-bold shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tuval</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('assets')}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'assets' ? 'bg-gold text-black font-bold shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Varlık Ekle</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('inspector')}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all relative ${
            mobileTab === 'inspector' ? 'bg-gold text-black font-bold shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Özellikler</span>
          {selectedItem && (
            <span className="w-2 h-2 rounded-full bg-gold absolute top-2 right-2 animate-ping" />
          )}
        </button>
      </div>

      {/* Mobile Tab View: Assets */}
      {mobileTab === 'assets' && (
        <div className="block lg:hidden luxury-card p-5 rounded-3xl border border-meyhane-border space-y-4 shadow-xl">
          <div className="text-xs font-bold uppercase tracking-wider text-gold font-serif border-b border-meyhane-border/70 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-gold" />
              <span>Varlık &amp; Kroki Ekle</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileTab('canvas')}
              className="text-gray-400 hover:text-white text-[11px] underline"
            >
              Tuvale Dön
            </button>
          </div>
          {renderAssetPaletteContent()}
        </div>
      )}

      {/* Mobile Tab View: Inspector */}
      {mobileTab === 'inspector' && (
        <div className="block lg:hidden luxury-card p-5 rounded-3xl border border-meyhane-border space-y-4 shadow-xl">
          <div className="text-xs font-bold uppercase tracking-wider text-gold font-serif border-b border-meyhane-border/70 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-gold" />
              <span>
                {selectedItem?.type === 'element' ? 'Mimari Varlık Ayarları' : selectedItem?.type === 'table' ? 'Masa Özellikleri' : 'Öğe Denetleyicisi'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileTab('canvas')}
              className="text-gray-400 hover:text-white text-[11px] underline"
            >
              Tuvale Dön
            </button>
          </div>
          {renderInspectorContent()}
          <button
            type="button"
            onClick={() => setMobileTab('canvas')}
            className="w-full py-2.5 rounded-xl bg-gold text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
          >
            <Check className="w-4 h-4" />
            <span>Tamam &amp; Tuvale Dön</span>
          </button>
        </div>
      )}

      {/* Permanent Full-Width Designer Canvas Workspace */}
      <div className={`${mobileTab !== 'canvas' ? 'hidden lg:block ' : ''}w-full space-y-3 relative`}>
        
        {/* Zoom, Pan, View & Navigation Toolbar */}
        <div className="p-3 rounded-2xl bg-meyhane-surface/90 border border-meyhane-border flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
          
          {/* Add Asset Drawer Toggle Button */}
          <button
            type="button"
            onClick={() => setShowAddAssetDrawer(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              showAddAssetDrawer
                ? 'bg-gold text-black shadow-lg shadow-gold/30 ring-2 ring-gold'
                : 'bg-gold/15 text-gold border border-gold/30 hover:bg-gold hover:text-black'
            }`}
            title="Varlık &amp; Mimari Kroki Ekleme Çekmecesini Aç / Kapat"
          >
            <Plus className="w-4 h-4" />
            <span>+ Varlık Ekle</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 font-semibold mr-1 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-gold" />
              Ölçek:
            </span>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              title="Uzaklaştır (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-gold font-mono font-bold min-w-[50px] text-center">
              %{Math.round(zoom * 100)}
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              title="Yakınlaştır (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            {/* Presets */}
            <button
              type="button"
              onClick={() => setZoom(0.35)}
              className={`px-2 py-1 rounded-lg text-[11px] transition-colors ${
                zoom === 0.35 ? 'bg-gold text-black font-bold' : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
              title="Kuşbakışı Tam Salon Görünümü (%35)"
            >
              %35
            </button>
            <button
              type="button"
              onClick={() => setZoom(0.60)}
              className={`px-2 py-1 rounded-lg text-[11px] transition-colors ${
                zoom === 0.60 ? 'bg-gold text-black font-bold' : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
              title="Geniş Bakış (%60)"
            >
              %60
            </button>
            <button
              type="button"
              onClick={() => setZoom(0.85)}
              className={`px-2 py-1 rounded-lg text-[11px] transition-colors ${
                zoom === 0.85 ? 'bg-gold text-black font-bold' : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
              title="Dengeli Boyut (%85)"
            >
              %85
            </button>
            <button
              type="button"
              onClick={() => setZoom(1.10)}
              className={`px-2 py-1 rounded-lg text-[11px] transition-colors ${
                zoom === 1.10 ? 'bg-gold text-black font-bold' : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
              title="Büyük Görünüm (%110)"
            >
              %110
            </button>
            <button
              type="button"
              onClick={handleFitScreen}
              className="px-2 py-1 rounded-lg bg-gold/20 hover:bg-gold text-gold hover:text-black text-[11px] font-bold transition-colors flex items-center gap-1 border border-gold/40 shadow-sm"
              title="Tüm Salonu Ekrana Otomatik Tam Sığdır"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Tam Sığdır</span>
            </button>
          </div>

          {/* Quick Section Jump Navigator */}
          <div className="hidden sm:flex items-center gap-1 text-[10px]">
            <span className="text-gray-500 mr-1">Hızlı Git:</span>
            <button
              type="button"
              onClick={() => scrollToZone(50, 10)}
              className="px-2 py-1 rounded-md bg-white/5 hover:bg-gold/20 hover:text-gold text-gray-300 transition-colors"
            >
              🎤 Sahne
            </button>
            <button
              type="button"
              onClick={() => scrollToZone(50, 48)}
              className="px-2 py-1 rounded-md bg-white/5 hover:bg-gold/20 hover:text-gold text-gray-300 transition-colors"
            >
              🍷 Salon
            </button>
            <button
              type="button"
              onClick={() => scrollToZone(50, 72)}
              className="px-2 py-1 rounded-md bg-white/5 hover:bg-gold/20 hover:text-gold text-gray-300 transition-colors"
            >
              👑 Loca
            </button>
            <button
              type="button"
              onClick={() => scrollToZone(50, 94)}
              className="px-2 py-1 rounded-md bg-white/5 hover:bg-gold/20 hover:text-gold text-gray-300 transition-colors"
            >
              🚪 Giriş
            </button>
            <button
              type="button"
              onClick={() => scrollToZone(90, 15)}
              className="px-2 py-1 rounded-md bg-white/5 hover:bg-gold/20 hover:text-gold text-gray-300 transition-colors"
            >
              🚻 WC
            </button>
          </div>

        </div>

        {/* Locked Notification Banner */}
        {isLocked && (
          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2.5 animate-fadeIn shadow-md">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
            <span>
              <strong>Tasarım Kilitli:</strong> Masalar ve mimari öğeler kazara kaydırılmaması için sabitlendi. Detayları inceleyebilirsiniz, konum değiştirmek için yukarıdan kilidi açın.
            </span>
          </div>
        )}

        {/* VIEWPORT FRAME (Relative, holds scroll container AND fixed radar/tooltips) */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-meyhane-border/90 shadow-2xl">
          
          {/* Scroll Container (Captures mouse wheel zoom, hand pan navigation & mobile touch) */}
          <div
            ref={scrollContainerRef}
            onScroll={updateViewportBox}
            onMouseDown={handleViewportMouseDown}
            onTouchStart={handleViewportTouchStart}
            onTouchMove={handleViewportTouchMove}
            onTouchEnd={handleViewportTouchEnd}
            className={`relative bg-[#07090D] overflow-auto select-none scrollbar-thin scrollbar-thumb-gold/30 scrollbar-track-transparent h-[78vh] min-h-[640px] max-h-[920px] ${
              isPanning ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Centering Wrapper: centers canvas when smaller, freely scrollable without clipping when larger */}
            <div className="min-w-full min-h-full w-max h-max flex p-6 sm:p-10">
              {/* Scaled Wrapper with m-auto to auto-center */}
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

                  {/* DYNAMIC ARCHITECTURAL & KROKI ELEMENTS (Sahne, Bar, WC, Kapılar, Kasa, Mutfak, Kolon vb.) */}
                  {elements.map((el) => {
                    const isSelected = selectedItem?.type === 'element' && selectedItem.id === el.id;
                    const w = el.width || 12;
                    const h = el.height || 10;
                    const isVertical = h > w * 1.15;

                    // Render styles based on element type
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
                        data-drag-item="true"
                        onPointerDown={(e) => handlePointerDownItem('element', el.id, el.posX, el.posY, e)}
                        onPointerMove={handlePointerMoveItem}
                        onPointerUp={handlePointerUpItem}
                        onPointerCancel={handlePointerCancelItem}
                        style={{
                          left: `${el.posX}%`,
                          top: `${el.posY}%`,
                          width: `${w}%`,
                          height: `${h}%`,
                          transform: 'translate(-50%, -50%)',
                          willChange: 'transform, left, top',
                          touchAction: 'none',
                        }}
                        className={`absolute rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-center text-center select-none transition-[border-color,background-color,box-shadow] group ${
                          isLocked ? 'cursor-pointer' : 'cursor-grab'
                        } ${getElementStyle()} ${
                          isSelected
                            ? 'ring-4 ring-gold scale-105 z-30 shadow-2xl brightness-125'
                            : 'z-10 hover:brightness-110'
                        }`}
                      >
                        {isVertical ? (
                          <div className="flex flex-col items-center justify-center h-full w-full pointer-events-none select-none py-1">
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
                          <div className="flex flex-col items-center justify-center pointer-events-none select-none w-full px-1">
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

                        {/* Interactive Corner Resize Handle (↘) */}
                        {!isLocked && (isSelected || selectedItem === null) && (
                          <div
                            data-resize-handle="true"
                            onPointerDown={(e) => handlePointerDownResize('element', el.id, w, h, e)}
                            onPointerMove={handlePointerMoveResize}
                            onPointerUp={handlePointerUpResize}
                            className={`absolute bottom-0 right-0 w-5 h-5 bg-gold/90 hover:bg-gold text-black rounded-tl-lg flex items-center justify-center cursor-nwse-resize z-40 shadow-md select-none touch-none transition-all ${
                              isSelected ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'
                            }`}
                            title="Boyutlandırmak için köşeden çekin"
                          >
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M21 15v6h-6M21 21L12 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* DRAGGABLE TABLES WITH DYNAMIC PROMINENT LABELS & LARGE HITBOXES */}
                  {tables.map((table) => {
                    const isSelected = selectedItem?.type === 'table' && selectedItem.id === table.id;
                    const isVIP = table.sectionId === 'vip_sahne';
                    const isLoca = table.sectionId === 'loca';
                    const isBahce = table.sectionId === 'bahce';

                    const defaultW = isLoca ? 9 : isVIP ? 8 : 7.5;
                    const defaultH = isLoca ? 7.5 : 6.5;
                    const tableW = table.width || defaultW;
                    const tableH = table.height || defaultH;
                    const isVertical = tableH > tableW * 1.15;

                    return (
                      <div
                        key={table.id}
                        data-drag-item="true"
                        onPointerDown={(e) => handlePointerDownItem('table', table.id, table.posX, table.posY, e)}
                        onPointerMove={handlePointerMoveItem}
                        onPointerUp={handlePointerUpItem}
                        onPointerCancel={handlePointerCancelItem}
                        onMouseEnter={() => {
                          if (!pointerDragState.current?.isDown) setHoveredTable(table);
                        }}
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
                          touchAction: 'none',
                        }}
                        className={`absolute p-2 rounded-2xl border-2 flex flex-col items-center justify-center text-center shadow-lg select-none transition-[border-color,background-color,box-shadow] group ${
                          isLocked ? 'cursor-pointer' : 'cursor-grab'
                        } ${
                          isSelected
                            ? 'ring-4 ring-gold border-gold bg-gold text-black scale-110 z-30 shadow-2xl font-bold'
                            : isVIP
                            ? 'border-amber-400/80 bg-amber-950/85 text-amber-200 z-20 hover:scale-105'
                            : isLoca
                            ? 'border-purple-400/80 bg-purple-950/85 text-purple-200 z-20 hover:scale-105'
                            : isBahce
                            ? 'border-teal-400/80 bg-teal-950/85 text-teal-200 z-20 hover:scale-105'
                            : 'border-emerald-500/70 bg-[#0E131C] text-white z-20 hover:scale-105 hover:border-gold'
                        }`}
                      >
                        {isVertical ? (
                          <div className="flex flex-col items-center justify-center h-full w-full pointer-events-none select-none py-1">
                            <div 
                              style={{ 
                                writingMode: 'vertical-rl',
                                transform: 'rotate(180deg)', 
                              }}
                              className="text-xs sm:text-sm font-bold font-serif tracking-wide leading-none whitespace-nowrap"
                            >
                              {table.number}
                            </div>
                            <div 
                              style={{ 
                                writingMode: 'vertical-rl',
                                transform: 'rotate(180deg)', 
                              }}
                              className="text-[10px] opacity-90 font-medium tracking-tight mt-1.5 leading-none whitespace-nowrap"
                            >
                              {table.capacity} Kişi
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pointer-events-none select-none w-full px-1">
                            <div className="text-xs sm:text-sm font-bold font-serif leading-tight text-center break-words max-w-full">
                              {table.number}
                            </div>
                            <div className="text-[11px] opacity-90 leading-tight text-center mt-0.5 font-medium whitespace-nowrap">
                              {table.capacity} Kişi
                            </div>
                          </div>
                        )}

                        {/* Interactive Corner Resize Handle (↘) */}
                        {!isLocked && (isSelected || hoveredTable?.id === table.id) && (
                          <div
                            data-resize-handle="true"
                            onPointerDown={(e) => handlePointerDownResize('table', table.id, tableW, tableH, e)}
                            onPointerMove={handlePointerMoveResize}
                            onPointerUp={handlePointerUpResize}
                            className={`absolute bottom-0 right-0 w-5 h-5 bg-gold/90 hover:bg-gold text-black rounded-tl-lg flex items-center justify-center cursor-nwse-resize z-40 shadow-md select-none touch-none transition-all ${
                              isSelected ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'
                            }`}
                            title="Boyutlandırmak için köşeden çekin"
                          >
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M21 15v6h-6M21 21L12 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}

                </div>
              </div>
            </div>
          </div>

          {/* FLOATING HOVER MAGNIFIER BADGE */}
          {hoveredTable && !showAddAssetDrawer && (
            <div className="absolute top-4 left-4 z-30 p-3 rounded-2xl bg-black/90 border border-gold/70 shadow-2xl backdrop-blur-md text-xs animate-fadeIn flex items-center gap-3 pointer-events-none">
              <div className="w-8 h-8 rounded-xl bg-gold text-black font-bold flex items-center justify-center font-serif text-sm">
                {hoveredTable.capacity}p
              </div>
              <div>
                <div className="font-bold text-white text-sm">
                  {hoveredTable.number}
                </div>
                <div className="text-[11px] text-gold font-medium">
                  {hoveredTable.sectionId === 'vip_sahne' ? 'VIP Sahne Önü' :
                   hoveredTable.sectionId === 'salon' ? 'Orta Salon' :
                   hoveredTable.sectionId === 'loca' ? 'Özel Loca' : 'Bahçe / Teras'}
                  {' '}• {hoveredTable.capacity} Kişilik Kapasite
                </div>
              </div>
            </div>
          )}

          {/* FLOATING ADD ASSET DRAWER */}
          {showAddAssetDrawer && (
            <div className="absolute top-4 left-4 z-40 w-84 max-w-sm luxury-card rounded-3xl p-5 border-2 border-gold/60 shadow-2xl backdrop-blur-xl animate-fadeIn space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="text-xs font-bold uppercase tracking-wider text-gold font-serif border-b border-meyhane-border/70 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-gold" />
                  <span>Varlık &amp; Kroki Ekle</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddAssetDrawer(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                  title="Kapat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {renderAssetPaletteContent()}
            </div>
          )}

          {/* FLOATING INSPECTOR */}
          {selectedItem && (
            <div className="absolute top-4 right-4 z-40 w-84 max-w-sm luxury-card rounded-3xl p-5 border-2 border-gold/60 shadow-2xl backdrop-blur-xl animate-fadeIn space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="text-xs font-bold uppercase tracking-wider text-gold font-serif border-b border-meyhane-border/70 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-gold" />
                  <span>
                    {selectedItem.type === 'element' ? 'Mimari Varlık Ayarları' : 'Masa Özellikleri'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                  title="Kapat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {renderInspectorContent()}
            </div>
          )}

          {/* EXPANDABLE MINIMAP RADAR */}
          <div 
            onMouseEnter={() => setIsRadarHovered(true)}
            onMouseLeave={() => setIsRadarHovered(false)}
            className={`absolute bottom-4 right-4 z-40 transition-all duration-300 ease-out hidden md:block rounded-2xl bg-black/95 border-2 border-gold/50 backdrop-blur-md shadow-2xl p-2.5 ${
              isRadarHovered ? 'w-64' : 'w-36'
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-gray-300 font-bold mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gold">
                <Compass className="w-3.5 h-3.5" />
                <span>{isRadarHovered ? 'Salon Radarı & Odak' : 'Radar'}</span>
              </div>
              <span className="text-gold font-mono font-bold bg-gold/15 px-1.5 py-0.5 rounded text-[9px]">
                %{Math.round(zoom * 100)}
              </span>
            </div>

            {/* Interactive Radar Box */}
            <div 
              onClick={handleRadarClick}
              className={`w-full rounded-xl bg-[#07090E] border border-meyhane-border relative cursor-pointer overflow-hidden shadow-inner group transition-all duration-300 ${
                isRadarHovered ? 'h-40' : 'h-20'
              }`}
              title="Radara tıklayarak salonda istediğiniz bölgeye anında odaklanın"
            >
              {/* Grid lines in radar */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

              {/* Mini Landmarks */}
              <div className="absolute top-1 left-1/4 w-1/2 h-2.5 bg-gold/40 border border-gold/70 rounded flex items-center justify-center text-[7px] text-gold font-bold">
                SAHNE
              </div>
              <div className="absolute top-1/4 left-1 w-2.5 h-12 bg-emerald-500/40 border border-emerald-500/60 rounded" />
              <div className="absolute top-1/4 right-1 w-2.5 h-12 bg-purple-500/40 border border-purple-500/60 rounded" />
              <div className="absolute bottom-1 left-1/3 w-1/3 h-2 bg-emerald-400/40 border border-emerald-400/70 rounded flex items-center justify-center text-[6px] text-emerald-300 font-bold">
                GİRİŞ
              </div>
              <div className="absolute top-1 right-2 w-4 h-3 bg-indigo-500/40 border border-indigo-500/60 rounded flex items-center justify-center text-[6px] text-indigo-200 font-bold">
                WC
              </div>

              {/* Mini dots for all venue tables */}
              {tables.map((t) => (
                <div
                  key={t.id}
                  style={{ left: `${t.posX}%`, top: `${t.posY}%` }}
                  className={`absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                    t.sectionId === 'vip_sahne' ? 'bg-amber-400' :
                    t.sectionId === 'loca' ? 'bg-purple-400' :
                    t.sectionId === 'bahce' ? 'bg-teal-400' : 'bg-emerald-400'
                  }`}
                />
              ))}

              {/* VIEWFINDER RECTANGLE */}
              <div
                style={{
                  left: `${viewportBox.x}%`,
                  top: `${viewportBox.y}%`,
                  width: `${viewportBox.w}%`,
                  height: `${viewportBox.h}%`,
                }}
                className="absolute border-2 border-gold bg-gold/20 rounded shadow-[0_0_12px_rgba(212,175,55,0.7)] pointer-events-none transition-all duration-75 flex items-center justify-center"
              >
                <span className="text-[7px] font-black uppercase text-gold tracking-tight bg-black/85 px-1 py-0.5 rounded shadow">
                  Odak
                </span>
              </div>

              {/* Hover prompt */}
              <div className="absolute inset-0 bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-gold font-bold pointer-events-none">
                Tıkla &amp; Odaklan
              </div>
            </div>

            {isRadarHovered && (
              <div className="mt-1.5 flex items-center justify-between text-[9px] text-gray-400 animate-fadeIn">
                <span>Tıklayarak odaklanın</span>
                <span className="text-gray-500">2400 × 1500</span>
              </div>
            )}
          </div>

        </div>

        {/* BOTTOM ACTION BAR - Planı Kaydet & Hızlı İpuçları */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-meyhane-surface border border-meyhane-border flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-2.5 text-xs text-gray-400">
            <span className="flex items-center gap-1.5 text-gold font-bold">
              <Sparkles className="w-4 h-4 text-gold flex-shrink-0" />
              <span>İpucu:</span>
            </span>
            <span className="hidden sm:inline">
              Masaları ve mimari öğeleri taşımak için sürükleyin, boyutlandırmak için sağ-alt köşesinden (↘) çekin.
            </span>
            <span className="sm:hidden">
              Köşelerden çekerek boyutlandırın.
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {statusMsg && (
              <span className="text-emerald-400 text-xs font-semibold animate-pulse hidden md:inline">
                {statusMsg}
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveLayout}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/25 flex items-center gap-2 transition-all disabled:opacity-50 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Kaydediliyor...' : 'Salon Planını Kaydet'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table-specific QR Code Modal */}
      {qrTableTarget && (
        <TableQrCodeModal
          table={qrTableTarget}
          onClose={() => setQrTableTarget(null)}
        />
      )}

    </div>
  );
}
