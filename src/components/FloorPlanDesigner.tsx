'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Minimize2,
  DoorOpen,
  DoorClosed,
  CreditCard,
  Utensils,
  Building2,
  Compass,
  Sliders,
  ShieldCheck,
  Eye,
  X,
  ChevronRight,
  Info
} from 'lucide-react';
import { TableItem, TableSection, ALL_TABLES, VENUE_SECTIONS } from '@/data/tablesData';
import { VenueElement } from '@/lib/tablesStorage';

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
  // State
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

  // Selection state
  const [selectedItem, setSelectedItem] = useState<{ type: 'table' | 'element'; id: string } | null>(null);

  // Left sidebar category tab
  const [activeAssetTab, setActiveAssetTab] = useState<'tables' | 'architectural' | 'custom'>('tables');

  // Zoom state (default: 0.85 = 85%, range: 0.4 to 2.0)
  const [zoom, setZoom] = useState(0.85);

  // Dragging state
  const [dragging, setDragging] = useState<{ type: 'table' | 'element'; id: string } | null>(null);

  // Save feedback state
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Refs for scrolling and canvas coordinate calculations
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasInnerRef = useRef<HTMLDivElement>(null);

  // Virtual Canvas dimensions (Generous resolution to support up to 200 tables comfortably!)
  const VIRTUAL_WIDTH = 2200;
  const VIRTUAL_HEIGHT = 1400;

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
    };

    setTables(prev => [...prev, newTbl]);
    setSelectedItem({ type: 'table', id: newId });
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
    };

    setTables(prev => [...prev, newTbl]);
    setSelectedItem({ type: 'table', id: newId });
    setQuickTableNum('');
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
  };

  // Drag Handlers with Zoom compensation
  const handleMouseDownItem = (type: 'table' | 'element', id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem({ type, id });
    if (isLocked) return;
    setDragging({ type, id });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!dragging || isLocked || !canvasInnerRef.current) return;

    const rect = canvasInnerRef.current.getBoundingClientRect();
    // Compensate for zoom scale
    const unscaledX = (e.clientX - rect.left) / zoom;
    const unscaledY = (e.clientY - rect.top) / zoom;

    const posX = Math.max(1, Math.min(99, Math.round((unscaledX / VIRTUAL_WIDTH) * 100)));
    const posY = Math.max(1, Math.min(99, Math.round((unscaledY / VIRTUAL_HEIGHT) * 100)));

    if (dragging.type === 'table') {
      setTables(prev => prev.map(t => t.id === dragging.id ? { ...t, posX, posY } : t));
    } else {
      setElements(prev => prev.map(el => el.id === dragging.id ? { ...el, posX, posY } : el));
    }
  };

  const handleCanvasMouseUp = () => {
    setDragging(null);
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

  // Quick Zoom Functions
  const handleZoomIn = () => setZoom(prev => Math.min(2.0, Number((prev + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom(prev => Math.max(0.4, Number((prev - 0.15).toFixed(2))));
  const handleResetZoom = () => setZoom(1.0);
  const handleFitScreen = () => setZoom(0.55);

  // Quick Scroll to Zone in 2200px hall
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

  // Reset to default
  const handleResetToDefault = () => {
    if (confirm('Varsayılan salon şablonuna ve mimari krokiye dönmek istediğinize emin misiniz?')) {
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
    }
  };

  const currentTable = selectedItem?.type === 'table' ? tables.find(t => t.id === selectedItem.id) : null;
  const currentElement = selectedItem?.type === 'element' ? elements.find(el => el.id === selectedItem.id) : null;

  // Total venue capacity
  const totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Bar with actions, counters & lock button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-meyhane-surface border border-meyhane-border shadow-xl">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold font-serif text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-gold" />
              <span>Sürükle - Bırak Salon &amp; Kroki Tasarımcısı</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-gold/15 text-gold text-xs font-semibold border border-gold/30">
              {tables.length} Masa • {totalCapacity} Kişi Kapasite • {elements.length} Mimari Öğe
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Masaları, sahneyi, barı, WC&apos;yi ve kapıları kroki çizer gibi yerleştirin. Büyük salonlar için yakınlaştırıp uzaklaştırın ve tasarımı kilitleyin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Lock / Unlock Toggle Button */}
          <button
            type="button"
            onClick={() => setIsLocked(!isLocked)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              isLocked
                ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-500/60 shadow-lg shadow-amber-500/15 ring-2 ring-amber-500/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/15 hover:border-gold'
            }`}
            title={isLocked ? "Tasarım Kilitli: Masalar ve mimari öğeler kazara kaydırılamaz. Kilidi açmak için tıklayın." : "Tasarımı kilitleyerek kazara taşınmasını engelleyin."}
          >
            {isLocked ? (
              <>
                <Lock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>🔒 Tasarım Kilitli</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 text-gray-400" />
                <span>Tasarımı Kilitle</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Varsayılan Şablona Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sıfırla</span>
          </button>

          <button
            type="button"
            onClick={handleSaveLayout}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/25 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Kaydediliyor...' : 'Planı Kaydet'}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-medium animate-fadeIn flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Main Workspace Layout (Left: Palette, Center: Infinite/Zoomable Canvas, Right: Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: Asset Palette (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="luxury-card p-5 rounded-3xl border border-meyhane-border space-y-4 shadow-xl">
            
            {/* Category Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-meyhane-bg border border-meyhane-border text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveAssetTab('tables')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${
                  activeAssetTab === 'tables' ? 'bg-gold text-black shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Masalar
              </button>
              <button
                type="button"
                onClick={() => setActiveAssetTab('architectural')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${
                  activeAssetTab === 'architectural' ? 'bg-gold text-black shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Mimari &amp; Kroki
              </button>
              <button
                type="button"
                onClick={() => setActiveAssetTab('custom')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${
                  activeAssetTab === 'custom' ? 'bg-gold text-black shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                + Özel Çiz
              </button>
            </div>

            {/* TAB 1: MASALAR */}
            {activeAssetTab === 'tables' && (
              <div className="space-y-3 animate-fadeIn">
                <p className="text-[11px] text-meyhane-muted">
                  Şablona tıklayarak salona anında yeni masa ekleyin veya özel masa oluşturun:
                </p>

                {/* Templates */}
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
                  Kendi özel alanınızı çizin (DJ kabini, sigara balkonu, vestiyer, protokol kapısı vb.):
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
        </div>

        {/* CENTER PANEL: Large Virtual Zoomable Canvas (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          
          {/* Zoom & Navigation Toolbar */}
          <div className="p-3 rounded-2xl bg-meyhane-surface/90 border border-meyhane-border flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
            
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
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[11px] transition-colors"
                title="Normal Boyuta Getir (%100)"
              >
                %100
              </button>
              <button
                type="button"
                onClick={handleFitScreen}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[11px] transition-colors flex items-center gap-1"
                title="Tüm Salonu Ekrana Sığdır"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Sığdır</span>
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

          {/* Canvas Scroll Viewport Container */}
          <div
            ref={scrollContainerRef}
            className="relative rounded-3xl bg-[#07090D] border-2 border-meyhane-border/90 shadow-2xl overflow-auto max-h-[640px] select-none scrollbar-thin scrollbar-thumb-gold/30 scrollbar-track-transparent"
          >
            {/* Scaled Wrapper to maintain native scroll dimensions */}
            <div
              style={{
                width: `${VIRTUAL_WIDTH * zoom}px`,
                height: `${VIRTUAL_HEIGHT * zoom}px`,
              }}
              className="relative"
            >
              {/* Virtual Infinite Canvas (2200px x 1400px transformed by zoom) */}
              <div
                ref={canvasInnerRef}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                style={{
                  width: `${VIRTUAL_WIDTH}px`,
                  height: `${VIRTUAL_HEIGHT}px`,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
                className={`relative bg-[#090C10] ${
                  isLocked ? 'cursor-default' : 'cursor-crosshair'
                }`}
              >
                {/* Architectural Blueprint Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293718_1px,transparent_1px),linear-gradient(to_bottom,#1f293718_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#d4af3708_1px,transparent_1px),linear-gradient(to_bottom,#d4af3708_1px,transparent_1px)] bg-[size:150px_150px] pointer-events-none" />

                {/* DYNAMIC ARCHITECTURAL & KROKI ELEMENTS (Sahne, Bar, WC, Kapılar, Kasa, Mutfak, Kolon vb.) */}
                {elements.map((el) => {
                  const isSelected = selectedItem?.type === 'element' && selectedItem.id === el.id;
                  const w = el.width || 12;
                  const h = el.height || 10;

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
                      onMouseDown={(e) => handleMouseDownItem('element', el.id, e)}
                      style={{
                        left: `${el.posX}%`,
                        top: `${el.posY}%`,
                        width: `${w}%`,
                        height: `${h}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className={`absolute rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all ${
                        isLocked ? 'cursor-pointer' : 'cursor-move'
                      } ${getElementStyle()} ${
                        isSelected
                          ? 'ring-4 ring-gold scale-105 z-30 shadow-2xl brightness-125'
                          : 'z-10 hover:brightness-110'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getElementIcon()}
                        <span className="text-xs font-bold font-serif uppercase tracking-wider truncate max-w-[90%]">
                          {el.name}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-75 uppercase font-mono tracking-widest">
                        {el.type === 'stage' ? '♫ Canlı Fasıl & Gala ♫' :
                         el.type === 'entrance' ? '➔ Ana Müşteri Girişi' :
                         el.type === 'exit' ? '➔ Acil Yangın Çıkışı' :
                         el.type === 'wc' ? 'Restroom' :
                         el.type === 'column' ? 'Taşıyıcı Engel' : 'Kroki Alanı'}
                      </span>
                    </div>
                  );
                })}

                {/* DRAGGABLE TABLES (UP TO 200 TABLES) */}
                {tables.map((table) => {
                  const isSelected = selectedItem?.type === 'table' && selectedItem.id === table.id;
                  const isVIP = table.sectionId === 'vip_sahne';
                  const isLoca = table.sectionId === 'loca';
                  const isBahce = table.sectionId === 'bahce';

                  return (
                    <div
                      key={table.id}
                      onMouseDown={(e) => handleMouseDownItem('table', table.id, e)}
                      style={{
                        left: `${table.posX}%`,
                        top: `${table.posY}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className={`absolute p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center shadow-lg ${
                        isLocked ? 'cursor-pointer' : 'cursor-move'
                      } ${
                        isSelected
                          ? 'ring-4 ring-gold border-gold bg-gold text-black scale-110 z-30 shadow-2xl font-bold'
                          : isVIP
                          ? 'border-amber-400/80 bg-amber-950/80 text-amber-200 z-20 hover:scale-105'
                          : isLoca
                          ? 'border-purple-400/80 bg-purple-950/80 text-purple-200 z-20 hover:scale-105'
                          : isBahce
                          ? 'border-teal-400/80 bg-teal-950/80 text-teal-200 z-20 hover:scale-105'
                          : 'border-emerald-500/70 bg-[#10141D] text-white z-20 hover:scale-105 hover:border-gold'
                      }`}
                    >
                      <div className="text-xs font-bold font-serif whitespace-nowrap">
                        {table.number}
                      </div>
                      <div className="text-[10px] opacity-80 whitespace-nowrap">
                        {table.capacity}p
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Dynamic Inspector (Tables & Architectural Elements) (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="luxury-card p-5 rounded-3xl border border-meyhane-border space-y-4 shadow-xl">
            
            {/* INSPECTOR TITLE */}
            <div className="text-xs font-bold uppercase tracking-wider text-gold font-serif border-b border-meyhane-border/70 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-gold" />
                <span>
                  {selectedItem?.type === 'element'
                    ? 'Mimari Varlık Ayarları'
                    : selectedItem?.type === 'table'
                    ? 'Masa Özellikleri'
                    : 'Öğe Denetleyicisi'}
                </span>
              </div>
              {selectedItem && (
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 1. TABLE INSPECTOR */}
            {currentTable ? (
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

                <div className="pt-2">
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
            ) : currentElement ? (
              /* 2. ARCHITECTURAL ELEMENT INSPECTOR */
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
            ) : (
              /* 3. DEFAULT INSPECTOR STATE */
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
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
