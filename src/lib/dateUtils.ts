import { StageEvent } from '@/data/eventsData';

/**
 * Calculates the next upcoming occurrence date (YYYY-MM-DD) for a given event.
 * If the event has a specific dateStr (YYYY-MM-DD), it returns that if it's in the future.
 * Otherwise, it parses days like "Her Perşembe", "Her Çarşamba & Cuma", "Her Cumartesi", etc.
 * and finds the closest date matching one of those days starting from today.
 */
export function getNextEventDate(event?: StageEvent | null, baseDate = new Date()): string {
  if (!event) {
    return baseDate.toISOString().split('T')[0];
  }

  // If dateStr is an actual date in format YYYY-MM-DD
  if (event.dateStr && /^\d{4}-\d{2}-\d{2}$/.test(event.dateStr)) {
    return event.dateStr;
  }

  const dayMap: { [key: string]: number } = {
    'pazar': 0,
    'pazartesi': 1,
    'salı': 2,
    'sali': 2,
    'çarşamba': 3,
    'carsamba': 3,
    'perşembe': 4,
    'persembe': 4,
    'cuma': 5,
    'cumartesi': 6,
  };

  const textToSearch = `${event.day || ''} ${event.title || ''} ${event.dateStr || ''}`.toLowerCase();
  const targetDays: number[] = [];

  for (const [name, dayNum] of Object.entries(dayMap)) {
    if (textToSearch.includes(name) && !targetDays.includes(dayNum)) {
      targetDays.push(dayNum);
    }
  }

  // If no specific days found, default to today
  if (targetDays.length === 0) {
    return baseDate.toISOString().split('T')[0];
  }

  // Find the closest upcoming day starting from today
  const candidate = new Date(baseDate);
  for (let offset = 0; offset < 14; offset++) {
    const d = new Date(candidate);
    d.setDate(candidate.getDate() + offset);
    if (targetDays.includes(d.getDay())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return baseDate.toISOString().split('T')[0];
}
