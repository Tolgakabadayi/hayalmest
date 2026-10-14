import { STAGE_EVENTS, StageEvent } from '@/data/eventsData';
import { safeReadJson, safeWriteJson } from './safeStorage';

const EVENTS_FILE = 'events.json';

export function getEvents(): StageEvent[] {
  return safeReadJson<StageEvent[]>(EVENTS_FILE, STAGE_EVENTS);
}

export function saveEvent(eventData: Omit<StageEvent, 'id'>): StageEvent {
  const events = getEvents();
  const newEvent: StageEvent = {
    ...eventData,
    id: `event-${Date.now()}`
  };
  events.push(newEvent);
  safeWriteJson(EVENTS_FILE, events);
  return newEvent;
}

export function updateEvent(id: string, updates: Partial<StageEvent>): StageEvent | null {
  const events = getEvents();
  const index = events.findIndex(e => e.id === id);
  if (index === -1) return null;

  events[index] = { ...events[index], ...updates };
  safeWriteJson(EVENTS_FILE, events);
  return events[index];
}

export function deleteEvent(id: string): boolean {
  let events = getEvents();
  const initLen = events.length;
  events = events.filter(e => e.id !== id);
  if (events.length === initLen) return false;

  safeWriteJson(EVENTS_FILE, events);
  return true;
}
