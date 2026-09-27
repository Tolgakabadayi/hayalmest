'use client';

import React, { useState, useRef } from 'react';
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
  Layers
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
  const [tables, setTables] = useState<TableItem[]>(initialTables);
  const [elements, setElements] = useState<VenueElement[]>(initialElements);
  const [selectedItem, setSelectedItem] = useState<{ type: 'table' | 'element'; id: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Asset templates
  const assetTemplates = [
    { type: 'vip', name: 'VIP Sahne Masası', sectionId: 'vip_sahne', capacity: 4, icon: Crown, color: 'border-amber-400 bg-amber-950/40 text-amber-200' },
    { type: 'salon', name: 'Standart Kare Masa', sectionId: 'salon', capacity: 4, icon: Wine, color: 'border-emerald-400 bg-emerald-950/40 text-emerald-200' },
    { type: 'group', name: 'Büyük Grup Masası', sectionId: 'salon', capacity: 10, icon: Users, color: 'border-blue-400 bg-blue-950/40 text-blue-200' },
    { type: 'loca', name: 'Özel Kutlama Locası', sectionId: 'loca', capacity: 12, icon: Sparkles, color: 'border-purple-400 bg-purple-950/40 text-purple-200' },
    { type: 'bahce', name: 'Bahçe / Teras Masası', sectionId: 'bahce', capacity: 4, icon: TreePine, color: 'border-teal-400 bg-teal-950/40 text-teal-200' },
  ];

  // Add new table from template
  const addTableFromTemplate = (template: typeof assetTemplates[0]) => {
    const newId = `t-${Date.now()}`;
    const nextNum = `${template.name.split(' ')[0]} ${tables.length + 1}`;

    const newTbl: TableItem = {
      id: newId,
      number: nextNum,
      sectionId: template.sectionId as any,
      capacity: template.capacity,
      minGuests: Math.max(1, Math.floor(template.capacity / 2)),
      adjacentWith: [],
      posX: 40 + Math.floor(Math.random() * 20),
      posY: 40 + Math.floor(Math.random() * 20),
    };

    setTables(prev => [...prev, newTbl]);
    setSelectedItem({ type: 'table', id: newId });
  };

  // Drag handlers
  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingId(id);
    setSelectedItem({ type: 'table', id });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const posX = Math.max(5, Math.min(95, Math.round((clientX / rect.width) * 100)));
    const posY = Math.max(5, Math.min(95, Math.round((clientY / rect.height) * 100)));

    setTables(prev => prev.map(t => t.id === draggingId ? { ...t, posX, posY } : t));
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // Delete selected item
  const handleDeleteSelected = () => {
    if (!selectedItem) return;
    if (selectedItem.type === 'table') {
      setTables(prev => prev.filter(t => t.id !== selectedItem.id));
      setSelectedItem(null);
    }
  };

  // Save changes
  const handleSaveLayout = async () => {
    setIsSaving(true);
    setStatusMsg('');
    try {
      await onSave(tables, elements);
      setStatusMsg('✓ Salon planı başarıyla kaydedildi! Sitede anında yayına alındı.');
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      setStatusMsg('Hata: Kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (confirm('Varsayılan salon şablonuna dönmek istediğinize emin misiniz?')) {
      setTables(ALL_TABLES);
    }
  };

  const currentTable = selectedItem?.type === 'table' ? tables.find(t => t.id === selectedItem.id) : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Bar with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-meyhane-surface border border-meyhane-border">
        <div>
          <h2 className="text-base font-bold font-serif text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-gold" />
            <span>Sürükle - Bırak İnteraktif Salon Tasarımcısı</span>
          </h2>
          <p className="text-xs text-gray-400">
            Masaları tuval üzerinde farenizle sürükleyerek dilediğiniz yere yerleştirin, kapasitelerini ve isimlerini özelleştirin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Varsayılan Şablona Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sıfırla</span>
          </button>

          <button
            type="button"
            onClick={handleSaveLayout}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/25 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Kaydediliyor...' : 'Planı Kaydet'}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-medium animate-fadeIn">
          {statusMsg}
        </div>
      )}

      {/* Main Workspace Layout (Asset palette + Canvas + Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Asset Palette (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="luxury-card p-5 rounded-3xl border border-meyhane-border space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-gold font-serif border-b border-meyhane-border/70 pb-2 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Masa &amp; Varlık Ekle</span>
            </div>
            <p className="text-[11px] text-meyhane-muted">
              Eklemek istediğiniz masa tipine tıklayın; tuvalin ortasında belirecektir.
            </p>

            <div className="space-y-2 pt-1">
              {assetTemplates.map((template, idx) => {
                const IconComponent = template.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => addTableFromTemplate(template)}
                    className="w-full p-3 rounded-2xl bg-meyhane-bg/70 hover:bg-white/10 border border-meyhane-border hover:border-gold text-left flex items-center justify-between group transition-all"
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
          </div>
        </div>

        {/* CENTER: Canvas (6 cols) */}
        <div className="lg:col-span-6">
          <div 
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative rounded-3xl bg-[#090C10] border-2 border-meyhane-border/90 shadow-2xl overflow-hidden min-h-[560px] select-none cursor-crosshair"
          >
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29371a_1px,transparent_1px),linear-gradient(to_bottom,#1f29371a_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            {/* STAGE (Fixed / Styled Area at Top) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3/4 py-3 px-6 rounded-2xl bg-gradient-to-r from-gold/10 via-gold/30 to-gold/10 border-2 border-gold/60 text-gold text-center shadow-[0_0_25px_rgba(212,175,55,0.2)] pointer-events-none">
              <div className="flex items-center justify-center gap-2 text-xs font-bold font-serif uppercase tracking-[0.2em]">
                <Music className="w-4 h-4" />
                <span>CANLI FASIL &amp; MÜZİK SAHNESİ</span>
              </div>
            </div>

            {/* Bar & Wine Rack Indicators */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 py-8 px-2.5 rounded-xl bg-white/5 border border-meyhane-border text-[10px] text-gray-400 font-serif vertical-rl pointer-events-none">
              BAR ALANI
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 py-8 px-2.5 rounded-xl bg-white/5 border border-meyhane-border text-[10px] text-gray-400 font-serif vertical-rl pointer-events-none">
              ŞARAP KAVI
            </div>

            {/* DRAGGABLE TABLES */}
            {tables.map((table) => {
              const isSelected = selectedItem?.type === 'table' && selectedItem.id === table.id;
              const isVIP = table.sectionId === 'vip_sahne';
              const isLoca = table.sectionId === 'loca';
              const isBahce = table.sectionId === 'bahce';

              return (
                <div
                  key={table.id}
                  onMouseDown={(e) => handleMouseDown(table.id, e)}
                  style={{
                    left: `${table.posX}%`,
                    top: `${table.posY}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute cursor-move p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center shadow-lg ${
                    isSelected
                      ? 'ring-4 ring-gold border-gold bg-gold text-black scale-110 z-30 shadow-2xl'
                      : isVIP
                      ? 'border-amber-400/80 bg-amber-950/70 text-amber-200 z-10'
                      : isLoca
                      ? 'border-purple-400/80 bg-purple-950/70 text-purple-200 z-10'
                      : isBahce
                      ? 'border-teal-400/80 bg-teal-950/70 text-teal-200 z-10'
                      : 'border-emerald-500/70 bg-meyhane-surface/90 text-white z-10'
                  }`}
                >
                  <div className="text-[11px] font-bold font-serif whitespace-nowrap">
                    {table.number}
                  </div>
                  <div className="text-[9px] opacity-80 whitespace-nowrap">
                    {table.capacity}p
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Inspector & Properties (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="luxury-card p-5 rounded-3xl border border-meyhane-border space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-gold font-serif border-b border-meyhane-border/70 pb-2">
              Masa Özellikleri &amp; Ayarları
            </div>

            {currentTable ? (
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Masa Adı / No</label>
                  <input
                    type="text"
                    value={currentTable.number}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTables(prev => prev.map(t => t.id === currentTable.id ? { ...t, number: val } : t));
                    }}
                    className="w-full bg-meyhane-bg border border-meyhane-border p-2.5 rounded-xl text-white focus:border-gold focus:outline-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold">Kapasite</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={currentTable.capacity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setTables(prev => prev.map(t => t.id === currentTable.id ? { ...t, capacity: val } : t));
                      }}
                      className="w-full bg-meyhane-bg border border-meyhane-border p-2 rounded-xl text-white font-bold text-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold">Min Kişi</label>
                    <input
                      type="number"
                      min={1}
                      value={currentTable.minGuests}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setTables(prev => prev.map(t => t.id === currentTable.id ? { ...t, minGuests: val } : t));
                      }}
                      className="w-full bg-meyhane-bg border border-meyhane-border p-2 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Salon Bölgesi</label>
                  <select
                    value={currentTable.sectionId}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setTables(prev => prev.map(t => t.id === currentTable.id ? { ...t, sectionId: val } : t));
                    }}
                    className="w-full bg-meyhane-bg border border-meyhane-border p-2 rounded-xl text-white focus:border-gold focus:outline-none"
                  >
                    <option value="vip_sahne">VIP Sahne Önü</option>
                    <option value="salon">Orta Salon</option>
                    <option value="bahce">Bahçe &amp; Teras</option>
                    <option value="loca">Özel Loca</option>
                  </select>
                </div>

                {/* Adjacent tables connection for smart merge */}
                <div className="space-y-1 pt-1">
                  <label className="text-gray-300 font-semibold">Birleştirilebilir Komşular</label>
                  <div className="max-h-32 overflow-y-auto space-y-1 p-2 rounded-xl bg-meyhane-bg border border-meyhane-border">
                    {tables.filter(t => t.id !== currentTable.id).map(other => {
                      const isChecked = currentTable.adjacentWith.includes(other.id);
                      return (
                        <label key={other.id} className="flex items-center gap-2 text-[11px] text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
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
                    onClick={handleDeleteSelected}
                    className="w-full py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/40 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Bu Masayı Sil</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-meyhane-muted text-xs">
                Düzenlemek için tuval üzerindeki herhangi bir masaya tıklayın.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
