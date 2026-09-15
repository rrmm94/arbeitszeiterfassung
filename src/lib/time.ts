// Alle "reinen Datumswerte" (ohne Uhrzeit) werden konsequent als UTC-Mitternacht
// gespeichert und gelesen, um Zeitzonen-Verschiebungen bei Vergleichen zu vermeiden.

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = Math.floor(mins % 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}`;
}

export function segmentMinutes(start: string, end: string): number {
  const diff = timeToMinutes(end) - timeToMinutes(start);
  return diff > 0 ? diff : 0;
}

export function minutesToHours(mins: number): number {
  return Math.round((mins / 60) * 100) / 100;
}

export function formatHours(hours: number): string {
  const sign = hours < 0 ? "-" : "";
  const abs = Math.abs(hours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}min`;
}

export function dateOnly(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

// Heutiges Kalenderdatum (in der Server-Zeitzone) als UTC-Mitternacht.
export function todayDateOnly(): Date {
  const now = new Date();
  return dateOnly(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function isoDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = date.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return dateOnly(y, m, d);
}

// ISO 8601 Kalenderwoche
export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

// Montag=1 ... Freitag=5, Samstag=6, Sonntag=7
export function isoWeekday(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

export function addDays(date: Date, days: number): Date {
  return dateOnly(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate() + days);
}

export function startOfDay(date: Date): Date {
  return dateOnly(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function sameDate(a: Date, b: Date): boolean {
  return isoDate(a) === isoDate(b);
}

export function dateInRange(date: Date, start: Date, end: Date): boolean {
  const t = startOfDay(date).getTime();
  return t >= startOfDay(start).getTime() && t <= startOfDay(end).getTime();
}
