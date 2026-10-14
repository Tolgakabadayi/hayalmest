import { MENU_ITEMS, MenuItem } from '@/data/menuData';
import { safeReadJson, safeWriteJson } from './safeStorage';

const MENU_FILE = 'menu.json';

export function getMenuItems(): MenuItem[] {
  return safeReadJson<MenuItem[]>(MENU_FILE, MENU_ITEMS);
}

export function saveMenuItem(itemData: Omit<MenuItem, 'id'>): MenuItem {
  const items = getMenuItems();
  const newItem: MenuItem = {
    ...itemData,
    id: `item-${Date.now()}`
  };
  items.push(newItem);
  safeWriteJson(MENU_FILE, items);
  return newItem;
}

export function updateMenuItem(id: string, updates: Partial<MenuItem>): MenuItem | null {
  const items = getMenuItems();
  const index = items.findIndex(m => m.id === id);
  if (index === -1) return null;

  items[index] = { ...items[index], ...updates };
  safeWriteJson(MENU_FILE, items);
  return items[index];
}

export function deleteMenuItem(id: string): boolean {
  let items = getMenuItems();
  const initLen = items.length;
  items = items.filter(m => m.id !== id);
  if (items.length === initLen) return false;

  safeWriteJson(MENU_FILE, items);
  return true;
}
