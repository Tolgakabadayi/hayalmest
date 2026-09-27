import { ALL_TABLES, VENUE_SECTIONS } from '@/data/tablesData';

/**
 * Formats a raw tableId into a human-readable Turkish label.
 * Examples:
 * - "s-5+s-4" -> "Masa 16 + Masa 15 (8 Kişilik Birleşik)"
 * - "bahce-auto" -> "Bahçe & Teras (Otomatik Masa)"
 * - "salon-auto" -> "Orta Salon (Otomatik Masa)"
 * - "vip_sahne-auto" -> "VIP Sahne Önü (Otomatik Masa)"
 * - "loca-auto" -> "Özel Loca (Otomatik Masa)"
 * - "v-1" -> "VIP-1 (4 Kişilik)"
 */
export function formatTableDisplay(tableId?: string, fallbackSectionId?: string): string {
  if (!tableId || tableId === 'any') {
    if (fallbackSectionId) {
      const sec = VENUE_SECTIONS.find(s => s.id === fallbackSectionId);
      return sec ? `${sec.name} (Otomatik Masa)` : 'Otomatik Masa Ataması';
    }
    return 'Otomatik Masa Ataması';
  }

  // Handle auto assignment formats (e.g. "bahce-auto", "salon-auto")
  if (tableId.endsWith('-auto')) {
    const secId = tableId.replace('-auto', '');
    const sec = VENUE_SECTIONS.find(s => s.id === secId);
    return sec ? `${sec.name} (Otomatik Masa)` : 'Otomatik Masa';
  }

  // Handle joined / merged tables (e.g. "s-5+s-4", "v-1+v-2")
  if (tableId.includes('+')) {
    const parts = tableId.split('+');
    const tableObjects = parts.map(id => ALL_TABLES.find(t => t.id === id)).filter(Boolean);

    if (tableObjects.length > 0) {
      const names = tableObjects.map(t => t?.number || t?.id).join(' + ');
      const totalCapacity = tableObjects.reduce((acc, curr) => acc + (curr?.capacity || 0), 0);
      return `${names} (${totalCapacity} Kişilik Birleşik)`;
    }
    return `${tableId} (Birleşik Masa)`;
  }

  // Handle single table
  const single = ALL_TABLES.find(t => t.id === tableId);
  if (single) {
    return `${single.number} (${single.capacity} Kişilik)`;
  }

  return tableId;
}
