import fs from 'fs';
import path from 'path';
import { ALL_TABLES, TableItem } from '@/data/tablesData';

export interface VenueElement {
  id: string;
  type: 'stage' | 'bar' | 'wine' | 'entrance' | 'custom';
  name: string;
  posX: number;
  posY: number;
  width?: number;
  height?: number;
}

const dataDir = path.join(process.cwd(), 'data');
const tablesFilePath = path.join(dataDir, 'tables.json');
const elementsFilePath = path.join(dataDir, 'venueElements.json');

const DEFAULT_VENUE_ELEMENTS: VenueElement[] = [
  { id: 'stage-1', type: 'stage', name: 'CANLI FASIL & MÜZİK SAHNESİ', posX: 50, posY: 10, width: 60, height: 12 },
  { id: 'bar-1', type: 'bar', name: 'Kokteyl & Rakı Barı', posX: 10, posY: 50, width: 14, height: 22 },
  { id: 'wine-1', type: 'wine', name: 'Şarap Kavı & Karşılama', posX: 90, posY: 50, width: 14, height: 22 },
];

export function getStoredTables(): TableItem[] {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(tablesFilePath)) {
    fs.writeFileSync(tablesFilePath, JSON.stringify(ALL_TABLES, null, 2), 'utf-8');
    return ALL_TABLES;
  }
  try {
    const raw = fs.readFileSync(tablesFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return ALL_TABLES;
  }
}

export function getStoredVenueElements(): VenueElement[] {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(elementsFilePath)) {
    fs.writeFileSync(elementsFilePath, JSON.stringify(DEFAULT_VENUE_ELEMENTS, null, 2), 'utf-8');
    return DEFAULT_VENUE_ELEMENTS;
  }
  try {
    const raw = fs.readFileSync(elementsFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return DEFAULT_VENUE_ELEMENTS;
  }
}

export function saveVenueLayout(tables: TableItem[], elements?: VenueElement[]): boolean {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  try {
    fs.writeFileSync(tablesFilePath, JSON.stringify(tables, null, 2), 'utf-8');
    if (elements) {
      fs.writeFileSync(elementsFilePath, JSON.stringify(elements, null, 2), 'utf-8');
    }
    return true;
  } catch (err) {
    console.error('Error saving venue layout:', err);
    return false;
  }
}

export function saveTable(tableData: Omit<TableItem, 'id'> & { id?: string }): TableItem {
  const tables = getStoredTables();
  const id = tableData.id || `table-${Date.now()}`;
  const newTable: TableItem = {
    ...tableData,
    id,
    adjacentWith: tableData.adjacentWith || []
  };
  tables.push(newTable);
  saveVenueLayout(tables);
  return newTable;
}

export function updateTable(id: string, updates: Partial<TableItem>): TableItem | null {
  const tables = getStoredTables();
  const idx = tables.findIndex(t => t.id === id);
  if (idx === -1) return null;

  tables[idx] = { ...tables[idx], ...updates };
  saveVenueLayout(tables);
  return tables[idx];
}

export function deleteTable(id: string): boolean {
  let tables = getStoredTables();
  const initLen = tables.length;
  tables = tables.filter(t => t.id !== id);
  if (tables.length === initLen) return false;

  saveVenueLayout(tables);
  return true;
}
