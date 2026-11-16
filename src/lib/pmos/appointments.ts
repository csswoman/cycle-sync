import type { ScreeningItem, ScreeningKey } from './screening';
export interface Appointment {
  id: string;
  date: string;
  time: string | null;
  specialty: string | null;
  doctor: string | null;
  place: string | null;
  notes: string | null;
  summary: string | null;
}
const DAY_MS = 86_400_000;
const parse = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
/** Whole calendar days from `today` to `date`; negative when the date has passed. */
export function daysUntil(date: string, today: string): number {
  return Math.round((parse(date.slice(0, 10)).getTime() - parse(today).getTime()) / DAY_MS);
}
/** The soonest appointment that is today or later. */
export function nextAppointment<T extends { date: string; time?: string | null }>(list: T[], today: string): T | null {
  const upcoming = list.filter((a) => a.date.slice(0, 10) >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));
  return upcoming[0] ?? null;
}
/** The latest appointment that already happened, for the "after the visit" notes. */
export function lastPastAppointment<T extends { date: string }>(list: T[], today: string): T | null {
  const past = list.filter((a) => a.date.slice(0, 10) < today).sort((a, b) => b.date.localeCompare(a.date));
  return past[0] ?? null;
}
export const BANNER_DAYS = 3;
/** The dashboard banner shows from 3 days before the appointment until the day itself. */
export function showAppointmentBanner(date: string, today: string): boolean {
  const d = daysUntil(date, today);
  return d >= 0 && d <= BANNER_DAYS;
}
/** Screening checks that were never done or are overdue. */
export function overdueScreenings(plan: ScreeningItem[]): ScreeningKey[] {
  return plan.filter((p) => p.status !== 'ok').map((p) => p.key);
}
export interface BringList {
  screenings: ScreeningKey[];
  questions: string[];
}
export function bringList(plan: ScreeningItem[], questions: { question: string; done: boolean }[]): BringList {
  return { screenings: overdueScreenings(plan), questions: questions.filter((q) => !q.done).map((q) => q.question) };
}
