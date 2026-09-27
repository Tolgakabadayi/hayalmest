import { ALL_TABLES, VENUE_SECTIONS, TableItem } from '@/data/tablesData';

let registeredTables: TableItem[] = [];

// Try to hydrate from localStorage in client environment
if (typeof window !== 'undefined') {
  try {
    const cached = localStorage.getItem('hayalmest_tables_cache');
    if (cached) {
      registeredTables = JSON.parse(cached);
    }
  } catch {}
}

export function setRegisteredTables(tables: TableItem[]) {
  if (Array.isArray(tables) && tables.length > 0) {
    registeredTables = tables;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hayalmest_tables_cache', JSON.stringify(tables));
      } catch {}
    }
  }
}

/**
 * Formats a raw tableId into a human-readable Turkish label.
 * Examples:
 * - "s-5+s-4" -> "16 + 15 (8 Kişilik Birleşik)"
 * - "t-1790509452076" -> "Standart 30 (4 Kişilik)"
 * - "bahce-auto" -> "Bahçe & Teras (Otomatik Masa)"
 * - "salon-auto" -> "Orta Salon (Otomatik Masa)"
 * - "vip_sahne-auto" -> "VIP Sahne Önü (Otomatik Masa)"
 * - "loca-auto" -> "Özel Loca (Otomatik Masa)"
 * - "v-1" -> "VIP-1 (4 Kişilik)"
 */
export function formatTableDisplay(
  tableId?: string, 
  fallbackSectionId?: string, 
  customTables?: TableItem[]
): string {
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

  const pool = (customTables && customTables.length > 0) 
    ? customTables 
    : (registeredTables.length > 0 ? registeredTables : ALL_TABLES);

  const findTable = (id: string): TableItem | undefined => {
    return pool.find(t => t.id === id) || ALL_TABLES.find(t => t.id === id);
  };

  // Handle joined / merged tables (e.g. "s-5+s-4", "v-1+v-2", "t-1+t-2")
  if (tableId.includes('+')) {
    const parts = tableId.split('+');
    const tableObjects = parts.map(id => findTable(id)).filter((t): t is TableItem => Boolean(t));

    if (tableObjects.length > 0) {
      const names = tableObjects.map(t => t.number || t.id).join(' + ');
      const totalCapacity = tableObjects.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
      return `${names} (${totalCapacity} Kişilik Birleşik)`;
    }
    return `${tableId} (Birleşik Masa)`;
  }

  // Handle single table
  const single = findTable(tableId);
  if (single) {
    return `${single.number} (${single.capacity} Kişilik)`;
  }

  return tableId;
}
