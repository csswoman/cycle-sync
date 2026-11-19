/**
 * Reads the workout log (one row per exercise, video, quick check-in or session summary) into the
 * views of the training journal: days trained, streak, month calendar, grouped history and
 * personal records. Everything is derived from `workout_logs`, so it is the same on every device.
 */

import { isStrengthLog } from './weeklyActivity';

export type LogSource = 'free' | 'routine' | 'program' | 'video' | 'quick' | 'session';

export interface SetEntry { reps: number | null; weight: number | null }

export interface JournalLog {
  id: string;
  date: string; // YYYY-MM-DD
  exercise: string;
  sets: number | null;
  weightKg: number | null;
  durationMinutes: number | null;
  feeling: number;
  notes: string | null;
  source?: LogSource | null;
  refId?: string | null;
  refName?: string | null;
  sessionId?: string | null;
  setDetails?: SetEntry[] | null;
  createdAt?: string | null;
}

/** Origin of a log. Rows saved before the journal columns carry it in the note. */
export function logSource(log: Pick<JournalLog, 'source' | 'notes'>): LogSource {
  if (log.source) return log.source;
  const n = log.notes ?? '';
  if (n.startsWith('Sesión completada')) return 'session';
  if (n === 'Video guiado') return 'video';
  if (n === 'Registro rápido') return 'quick';
  if (n.includes(' — ')) return 'program';
  return 'free';
}

const pad = (n: number) => String(n).padStart(2, '0');
export const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayNumber = (iso: string) => Math.round(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000);
export const addDays = (iso: string, n: number) => {
  const d = new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + n);
  return isoDay(d);
};

/** Sets of an exercise: the structured column, or the note format "10 × 20 kg · 8 × 22.5 kg — Programa, Día". */
export function setsOf(log: Pick<JournalLog, 'setDetails' | 'notes'>): SetEntry[] | null {
  if (log.setDetails && log.setDetails.length > 0) return log.setDetails;
  if (!log.notes || !log.notes.includes(' — ')) return null;
  const parts = log.notes.split(' — ')[0].split(' · ');
  const sets = parts.map((part) => {
    const m = part.trim().match(/^(\d+|–)(?: × ([\d.,]+) kg)?$/);
    if (!m) return null;
    return { reps: m[1] === '–' ? null : Number(m[1]), weight: m[2] ? Number(m[2].replace(',', '.')) : null };
  });
  return sets.length > 0 && sets.every(Boolean) ? (sets as SetEntry[]) : null;
}

/** Sets of the most recent log of an exercise, to prefill the next session. Logs are newest first. */
export function lastSetsFor(logs: JournalLog[], exerciseName: string): SetEntry[] | null {
  const key = exerciseName.trim().toLowerCase();
  for (const log of logs) {
    if (log.exercise.trim().toLowerCase() !== key) continue;
    const sets = setsOf(log);
    if (sets) return sets;
  }
  return null;
}

export interface DayTotal {
  date: string;
  minutes: number;
  strength: boolean;
  /** Logged items that day (a session and its exercises count as one). */
  activities: number;
}

/** Per-day totals for the calendar and streak. */
export function dayTotals(logs: JournalLog[]): Map<string, DayTotal> {
  const out = new Map<string, DayTotal>();
  for (const day of groupHistory(logs)) {
    out.set(day.date, {
      date: day.date,
      minutes: day.minutes,
      strength: day.items.some((it) => it.strength),
      activities: day.items.length,
    });
  }
  return out;
}

export interface Streak { current: number; longest: number; totalDays: number }

/**
 * Consecutive days with activity. Today without activity yet does not break the streak: it counts
 * up to yesterday until the day is over.
 */
export function computeStreak(days: Iterable<string>, today: string): Streak {
  const sorted = Array.from(new Set(days)).filter((d) => d <= today).sort();
  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of sorted) {
    const n = dayNumber(d);
    run = prev != null && n - prev === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = n;
  }
  const last = sorted[sorted.length - 1];
  const gap = last ? dayNumber(today) - dayNumber(last) : Infinity;
  return { current: gap <= 1 ? run : 0, longest, totalDays: sorted.length };
}

export interface CalendarCell { date: string; inMonth: boolean }

/** Weeks (Monday first) covering a month. `month` is 0-based. */
export function monthGrid(year: number, month: number): CalendarCell[][] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((offset + daysInMonth) / 7);
  const grid: CalendarCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const row: CalendarCell[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + i);
      row.push({ date: isoDay(d), inMonth: d.getMonth() === month });
    }
    grid.push(row);
  }
  return grid;
}

export interface HistoryItem {
  /** Id of the main row (the session row when there is one). */
  id: string;
  title: string;
  source: LogSource;
  /** Session summary row, when the item is a session. */
  session: JournalLog | null;
  /** Exercises of the item (the row itself for a single log). */
  exercises: JournalLog[];
  minutes: number;
  strength: boolean;
  feeling: number | null;
  /** Ids to delete to remove the whole item. */
  ids: string[];
}

export interface HistoryDay { date: string; minutes: number; items: HistoryItem[] }

const byCreated = (a: JournalLog, b: JournalLog) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '');

/**
 * Days (newest first) with their sessions. Rows that share a session id form one item; older
 * program logs without one are attached to the only session saved that day.
 */
export function groupHistory(logs: JournalLog[]): HistoryDay[] {
  const byDate = new Map<string, JournalLog[]>();
  for (const log of logs) {
    const d = log.date.slice(0, 10);
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(log);
  }
  const days: HistoryDay[] = [];
  for (const [date, rows] of byDate) {
    const sorted = [...rows].sort(byCreated);
    const groups = new Map<string, JournalLog[]>();
    const singles: JournalLog[] = [];
    for (const r of sorted) {
      if (r.sessionId) {
        if (!groups.has(r.sessionId)) groups.set(r.sessionId, []);
        groups.get(r.sessionId)!.push(r);
      } else singles.push(r);
    }
    const legacySessions = singles.filter((r) => logSource(r) === 'session');
    const items: HistoryItem[] = [];
    const attach = legacySessions.length === 1 ? legacySessions[0] : null;
    const legacyChildren = attach ? singles.filter((r) => r !== attach && logSource(r) === 'program') : [];
    const used = new Set<JournalLog>(legacyChildren);

    const build = (session: JournalLog | null, exercises: JournalLog[]): HistoryItem => {
      const all = session ? [session, ...exercises] : exercises;
      const head = session ?? exercises[0];
      const feelings = all.map((r) => r.feeling).filter((f) => f >= 1);
      return {
        id: head.id,
        title: head.exercise,
        source: session ? (exercises[0] ? logSource(exercises[0]) : 'session') : logSource(head),
        session,
        exercises,
        minutes: all.reduce((s, r) => s + (r.durationMinutes ?? 0), 0),
        strength: all.some((r) => isStrengthLog(r)),
        feeling: session ? session.feeling : feelings[0] ?? null,
        ids: all.map((r) => r.id),
      };
    };

    for (const rows of groups.values()) {
      const session = rows.find((r) => logSource(r) === 'session') ?? null;
      items.push(build(session, rows.filter((r) => r !== session)));
    }
    for (const r of singles) {
      if (used.has(r)) continue;
      if (r === attach) items.push(build(r, legacyChildren));
      else if (logSource(r) === 'session') items.push(build(r, []));
      else items.push(build(null, [r]));
    }
    items.sort((a, b) => byCreated(b.session ?? b.exercises[0], a.session ?? a.exercises[0]));
    days.push({ date, minutes: items.reduce((s, it) => s + it.minutes, 0), items });
  }
  return days.sort((a, b) => b.date.localeCompare(a.date));
}

/** Ids of logs that beat the heaviest earlier weight for the same exercise (the first time never counts). */
export function personalRecords(logs: JournalLog[]): Set<string> {
  const chronological = [...logs]
    .filter((l) => l.weightKg != null && l.weightKg > 0)
    .sort((a, b) => a.date.localeCompare(b.date) || byCreated(a, b));
  const best = new Map<string, number>();
  const out = new Set<string>();
  for (const l of chronological) {
    const key = l.exercise.trim().toLowerCase();
    const prev = best.get(key);
    if (prev != null && l.weightKg! > prev) out.add(l.id);
    if (prev == null || l.weightKg! > prev) best.set(key, l.weightKg!);
  }
  return out;
}

/** The program day of the most recent program session: where "continue your program" starts. */
export function lastProgramRoutine(logs: JournalLog[]): { refId: string; date: string } | null {
  for (const l of logs) {
    if (logSource(l) === 'program' && l.refId) return { refId: l.refId, date: l.date };
  }
  return null;
}

/** Most recent day each saved routine was trained. */
export function lastDoneByRoutine(logs: JournalLog[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of logs) {
    if (logSource(l) === 'routine' && l.refId && !(l.refId in out)) out[l.refId] = l.date;
  }
  return out;
}
