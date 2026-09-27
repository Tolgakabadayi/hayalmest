import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'users.json');

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: 'founder' | 'admin';
  permissions: string[];
  createdAt: string;
  createdBy: string;
}

export interface HostUser {
  id: string;
  name: string;
  pin: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
}

export interface UsersData {
  admins: AdminUser[];
  hosts: HostUser[];
}

function readUsers(): UsersData {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { admins: [], hosts: [] };
  }
}

function writeUsers(data: UsersData): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function getUsers(): UsersData {
  return readUsers();
}

export function authenticateAdmin(username: string, password: string): AdminUser | null {
  const data = readUsers();
  const admin = data.admins.find(a => a.username === username && a.password === password);
  return admin || null;
}

export function authenticateHost(pin: string): HostUser | null {
  const data = readUsers();
  const host = data.hosts.find(h => h.pin === pin && h.active);
  return host || null;
}

export function addAdmin(admin: Omit<AdminUser, 'id' | 'createdAt'>): AdminUser {
  const data = readUsers();
  const newAdmin: AdminUser = {
    ...admin,
    id: 'admin-' + Date.now(),
    createdAt: new Date().toISOString(),
  };
  data.admins.push(newAdmin);
  writeUsers(data);
  return newAdmin;
}

export function updateAdmin(id: string, updates: Partial<Omit<AdminUser, 'id' | 'createdAt'>>): AdminUser | null {
  const data = readUsers();
  const idx = data.admins.findIndex(a => a.id === id);
  if (idx === -1) return null;
  if (data.admins[idx].role === 'founder' && updates.role && updates.role !== 'founder') {
    updates.role = 'founder';
  }
  data.admins[idx] = { ...data.admins[idx], ...updates };
  writeUsers(data);
  return data.admins[idx];
}

export function deleteAdmin(id: string): boolean {
  const data = readUsers();
  const admin = data.admins.find(a => a.id === id);
  if (!admin || admin.role === 'founder') return false;
  data.admins = data.admins.filter(a => a.id !== id);
  writeUsers(data);
  return true;
}

export function addHost(host: Omit<HostUser, 'id' | 'createdAt'>): HostUser {
  const data = readUsers();
  const newHost: HostUser = {
    ...host,
    id: 'host-' + Date.now(),
    createdAt: new Date().toISOString(),
  };
  data.hosts.push(newHost);
  writeUsers(data);
  return newHost;
}

export function updateHost(id: string, updates: Partial<Omit<HostUser, 'id' | 'createdAt'>>): HostUser | null {
  const data = readUsers();
  const idx = data.hosts.findIndex(h => h.id === id);
  if (idx === -1) return null;
  data.hosts[idx] = { ...data.hosts[idx], ...updates };
  writeUsers(data);
  return data.hosts[idx];
}

export function deleteHost(id: string): boolean {
  const data = readUsers();
  data.hosts = data.hosts.filter(h => h.id !== id);
  writeUsers(data);
  return true;
}
