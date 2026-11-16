/** Pure scheduling helpers for medications (no React, no Supabase). */

export type InstructionKey =
  | 'fasting'
  | 'before_meal'
  | 'with_breakfast'
  | 'after_breakfast'
  | 'with_lunch'
  | 'after_lunch'
  | 'with_dinner'
  | 'after_dinner'
  | 'with_food'
  | 'bedtime';

export const INSTRUCTIONS: { key: InstructionKey; es: string; en: string; time?: string }[] = [
  { key: 'fasting', es: 'En ayunas', en: 'On an empty stomach', time: '07:00' },
  { key: 'with_breakfast', es: 'Con el desayuno', en: 'With breakfast', time: '08:00' },
  { key: 'after_breakfast', es: 'Después del desayuno', en: 'After breakfast', time: '08:30' },
  { key: 'with_lunch', es: 'Con el almuerzo', en: 'With lunch', time: '14:00' },
  { key: 'after_lunch', es: 'Después del almuerzo', en: 'After lunch', time: '14:30' },
  { key: 'with_dinner', es: 'Con la cena', en: 'With dinner', time: '20:00' },
  { key: 'after_dinner', es: 'Después de la cena', en: 'After dinner', time: '20:30' },
  { key: 'before_meal', es: 'Antes de comer', en: 'Before a meal' },
  { key: 'with_food', es: 'Con comida', en: 'With food' },
  { key: 'bedtime', es: 'Antes de dormir', en: 'At bedtime', time: '22:30' },
];

export function instructionLabel(key: string | null | undefined, lang: 'es' | 'en'): string | null {
  if (!key) return null;
  const found = INSTRUCTIONS.find((i) => i.key === key);
  return found ? found[lang] : null;
}

export interface SchedulableMedication {
  id: string;
  times: string[];
  /** 0 = Sunday … 6 = Saturday; null/empty = every day. */
  days_of_week?: number[] | null;
  /** 'YYYY-MM-DD'; doses before this date are not expected. */
  start_date?: string | null;
  created_at?: string | null;
  /** Pill pack: days with active pills followed by break days, repeating from pack_start_date. */
  pack_active_days?: number | null;
  pack_break_days?: number | null;
  pack_start_date?: string | null;
}

export interface DoseLog {
  medication_id: string;
  date: string;
  scheduled_time: string;
  taken: boolean;
  taken_at?: string | null;
}

/** Parses 'YYYY-MM-DD' as a local date (avoids the UTC shift of `new Date(str)`). */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toLocalISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** First day the medication is expected to be taken. */
export function medicationStart(med: SchedulableMedication): string | null {
  if (med.start_date) return med.start_date;
  if (med.created_at) return toLocalISO(new Date(med.created_at));
  return null;
}

const DAY_MS = 86_400_000;

function dayDiff(from: string, to: string): number {
  return Math.round((parseLocalDate(to).getTime() - parseLocalDate(from).getTime()) / DAY_MS);
}

export interface PackPosition {
  /** 1-based day inside the pack. */
  day: number;
  length: number;
  onBreak: boolean;
  /** Days until the next pack starts (1 = tomorrow). */
  daysToNextPack: number;
}

/** Where `date` falls inside a repeating pill pack, or null when the medication has no pack. */
export function packPosition(med: SchedulableMedication, date: string): PackPosition | null {
  if (!med.pack_active_days || !med.pack_start_date) return null;
  const length = med.pack_active_days + (med.pack_break_days ?? 0);
  const diff = dayDiff(med.pack_start_date, date);
  if (diff < 0) return null;
  const idx = diff % length;
  return { day: idx + 1, length, onBreak: idx >= med.pack_active_days, daysToNextPack: length - idx };
}

export function isScheduledOn(med: SchedulableMedication, date: string): boolean {
  if (med.times.length === 0) return false;
  const start = medicationStart(med);
  if (start && date < start) return false;
  if (med.pack_active_days && med.pack_start_date) {
    if (date < med.pack_start_date) return false;
    return !packPosition(med, date)!.onBreak;
  }
  const days = med.days_of_week;
  if (!days || days.length === 0 || days.length === 7) return true;
  return days.includes(parseLocalDate(date).getDay());
}

export interface Dose<M extends SchedulableMedication = SchedulableMedication> {
  med: M;
  time: string;
}

/** All doses expected on a date, sorted by time. */
export function dosesOn<M extends SchedulableMedication>(meds: M[], date: string): Dose<M>[] {
  return meds
    .filter((m) => isScheduledOn(m, date))
    .flatMap((med) => med.times.map((time) => ({ med, time })))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function findLog(logs: DoseLog[], medId: string, date: string, time: string): DoseLog | undefined {
  return logs.find((l) => l.medication_id === medId && l.date === date && l.scheduled_time === time);
}

export type DoseStatus = 'taken' | 'upcoming' | 'due' | 'late' | 'missed';

const DUE_BEFORE_MIN = 30;
const LATE_AFTER_MIN = 60;

function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Status of one dose relative to `now`. */
export function doseStatus(taken: boolean, date: string, time: string, now: Date): DoseStatus {
  if (taken) return 'taken';
  const today = toLocalISO(now);
  if (date < today) return 'missed';
  if (date > today) return 'upcoming';
  const diff = now.getHours() * 60 + now.getMinutes() - minutesOf(time);
  if (diff < -DUE_BEFORE_MIN) return 'upcoming';
  if (diff <= LATE_AFTER_MIN) return 'due';
  return 'late';
}

export type DayStatus = 'none' | 'future' | 'full' | 'partial' | 'missed' | 'pending';

export interface DaySummary {
  status: DayStatus;
  taken: number;
  total: number;
}

/** Adherence summary for one calendar day. `today` is 'YYYY-MM-DD'. */
export function daySummary(meds: SchedulableMedication[], logs: DoseLog[], date: string, today: string): DaySummary {
  const doses = dosesOn(meds, date);
  const total = doses.length;
  const taken = doses.filter((d) => findLog(logs, d.med.id, date, d.time)?.taken).length;
  if (total === 0) return { status: 'none', taken, total };
  if (date > today) return { status: 'future', taken, total };
  if (taken === total) return { status: 'full', taken, total };
  if (date === today) return { status: taken > 0 ? 'partial' : 'pending', taken, total };
  return { status: taken > 0 ? 'partial' : 'missed', taken, total };
}

/** Taken / expected doses for past days and today within [from, to]. */
export function adherence(
  meds: SchedulableMedication[],
  logs: DoseLog[],
  from: string,
  to: string,
  today: string,
): { taken: number; total: number; pct: number | null } {
  let taken = 0;
  let total = 0;
  const end = to < today ? to : today;
  for (let d = parseLocalDate(from); toLocalISO(d) <= end; d.setDate(d.getDate() + 1)) {
    const s = daySummary(meds, logs, toLocalISO(d), today);
    taken += s.taken;
    total += s.total;
  }
  return { taken, total, pct: total ? Math.round((taken / total) * 100) : null };
}

/** Consecutive days (ending today or yesterday) on which every dose was taken. */
export function currentStreak(meds: SchedulableMedication[], logs: DoseLog[], today: string, maxDays = 62): number {
  let streak = 0;
  const d = parseLocalDate(today);
  for (let i = 0; i < maxDays; i++, d.setDate(d.getDate() - 1)) {
    const s = daySummary(meds, logs, toLocalISO(d), today);
    if (s.status === 'none') continue;
    if (s.status === 'full') { streak++; continue; }
    // Today still in progress does not break the streak.
    if (i === 0 && (s.status === 'pending' || s.status === 'partial')) continue;
    break;
  }
  return streak;
}

/**
 * How many days the remaining stock lasts, counting only scheduled days from `today`
 * (doses already taken today are already discounted from the stock). Null without stock data.
 */
export function daysOfStockLeft(
  med: SchedulableMedication & { stock?: number | null; units_per_dose?: number | null },
  today: string,
  takenToday = 0,
  horizon = 365,
): number | null {
  if (med.stock == null) return null;
  const perDose = med.units_per_dose && med.units_per_dose > 0 ? med.units_per_dose : 1;
  let units = Number(med.stock);
  const d = parseLocalDate(today);
  for (let i = 0; i < horizon; i++, d.setDate(d.getDate() + 1)) {
    const iso = toLocalISO(d);
    if (!isScheduledOn(med, iso)) continue;
    const doses = med.times.length - (i === 0 ? takenToday : 0);
    units -= doses * perDose;
    if (units < 0) return i;
  }
  return horizon;
}

/** Matrix of weeks (Monday first) for a month; null cells pad the edges. */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(toLocalISO(new Date(year, month, day)));
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
