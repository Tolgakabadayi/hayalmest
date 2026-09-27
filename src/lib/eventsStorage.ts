import fs from 'fs';
import path from 'path';
import { STAGE_EVENTS, StageEvent } from '@/data/eventsData';

const dataDir = path.join(process.cwd(), 'data');
const eventsFilePath = path.join(dataDir, 'events.json');

export function getEvents(): StageEvent[] {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(eventsFilePath)) {
    fs.writeFileSync(eventsFilePath, JSON.stringify(STAGE_EVENTS, null, 2), 'utf-8');
    return STAGE_EVENTS;
  }
  try {
    const raw = fs.readFileSync(eventsFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return STAGE_EVENTS;
  }
}

export function saveEvent(eventData: Omit<StageEvent, 'id'>): StageEvent {
  const events = getEvents();
  const newEvent: StageEvent = {
    ...eventData,
    id: `event-${Date.now()}`
  };
  events.push(newEvent);
  fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2), 'utf-8');
  return newEvent;
}

export function updateEvent(id: string, updates: Partial<StageEvent>): StageEvent | null {
  const events = getEvents();
  const index = events.findIndex(e => e.id === id);
  if (index === -1) return null;

  events[index] = { ...events[index], ...updates };
  fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2), 'utf-8');
  return events[index];
}

export function deleteEvent(id: string): boolean {
  let events = getEvents();
  const initLen = events.length;
  events = events.filter(e => e.id !== id);
  if (events.length === initLen) return false;

  fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2), 'utf-8');
  return true;
}
