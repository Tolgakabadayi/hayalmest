import { safeReadJson, safeWriteJson } from './safeStorage';

export type ServiceRequestType = 'waiter' | 'ice_water' | 'bill' | 'cutlery' | 'custom';

export interface ServiceRequest {
  id: string;
  tableId: string;
  tableName: string;
  sectionId?: string;
  sectionName?: string;
  type: ServiceRequestType;
  title: string;
  note?: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
}

const REQUESTS_FILE = 'serviceRequests.json';

export function getServiceRequests(): ServiceRequest[] {
  return safeReadJson<ServiceRequest[]>(REQUESTS_FILE, []);
}

export function addServiceRequest(requestData: Omit<ServiceRequest, 'id' | 'createdAt' | 'status'>): ServiceRequest {
  const requests = getServiceRequests();

  const newRequest: ServiceRequest = {
    ...requestData,
    id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  requests.unshift(newRequest);
  // Keep last 100 requests to avoid unbounded growth
  const trimmed = requests.slice(0, 100);
  safeWriteJson(REQUESTS_FILE, trimmed);
  return newRequest;
}

export function updateServiceRequestStatus(
  id: string,
  status: 'pending' | 'in_progress' | 'completed',
  completedBy?: string
): ServiceRequest | null {
  const requests = getServiceRequests();
  const index = requests.findIndex(r => r.id === id);
  if (index === -1) return null;

  requests[index] = {
    ...requests[index],
    status,
    completedAt: status === 'completed' ? new Date().toISOString() : requests[index].completedAt,
    completedBy: completedBy || requests[index].completedBy,
  };

  safeWriteJson(REQUESTS_FILE, requests);
  return requests[index];
}

export function deleteServiceRequest(id: string): boolean {
  let requests = getServiceRequests();
  const initialLen = requests.length;
  requests = requests.filter(r => r.id !== id);
  if (requests.length === initialLen) return false;

  safeWriteJson(REQUESTS_FILE, requests);
  return true;
}
