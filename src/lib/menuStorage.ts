import fs from 'fs';
import path from 'path';
import { MENU_ITEMS, MenuItem } from '@/data/menuData';

const dataDir = path.join(process.cwd(), 'data');
const menuFilePath = path.join(dataDir, 'menu.json');

export function getMenuItems(): MenuItem[] {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(menuFilePath)) {
    fs.writeFileSync(menuFilePath, JSON.stringify(MENU_ITEMS, null, 2), 'utf-8');
    return MENU_ITEMS;
  }
  try {
    const raw = fs.readFileSync(menuFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return MENU_ITEMS;
  }
}

export function saveMenuItem(itemData: Omit<MenuItem, 'id'>): MenuItem {
  const items = getMenuItems();
  const newItem: MenuItem = {
    ...itemData,
    id: `item-${Date.now()}`
  };
  items.push(newItem);
  fs.writeFileSync(menuFilePath, JSON.stringify(items, null, 2), 'utf-8');
  return newItem;
}

export function updateMenuItem(id: string, updates: Partial<MenuItem>): MenuItem | null {
  const items = getMenuItems();
  const index = items.findIndex(m => m.id === id);
  if (index === -1) return null;

  items[index] = { ...items[index], ...updates };
  fs.writeFileSync(menuFilePath, JSON.stringify(items, null, 2), 'utf-8');
  return items[index];
}

export function deleteMenuItem(id: string): boolean {
  let items = getMenuItems();
  const initLen = items.length;
  items = items.filter(m => m.id !== id);
  if (items.length === initLen) return false;

  fs.writeFileSync(menuFilePath, JSON.stringify(items, null, 2), 'utf-8');
  return true;
}
