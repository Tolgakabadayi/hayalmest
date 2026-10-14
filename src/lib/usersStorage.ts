import { safeReadJson, safeWriteJson } from './safeStorage';

const USERS_FILE = 'users.json';

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

const DEFAULT_USERS: UsersData = {
  admins: [
    {
      id: 'admin-1',
      username: 'kurucu',
      password: 'hayalmest2026',
      displayName: 'Kurucu Yönetici',
      role: 'founder',
      permissions: ['all'],
      createdAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'system'
    }
  ],
  hosts: [
    {
      id: 'host-1',
      name: 'Host Ahmet',
      pin: '1234',
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'system'
    }
  ]
};

function readUsers(): UsersData {
  return safeReadJson<UsersData>(USERS_FILE, DEFAULT_USERS);
}

function writeUsers(data: UsersData): void {
  safeWriteJson(USERS_FILE, data);
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
