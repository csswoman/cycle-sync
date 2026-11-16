import { addDays, daysBetween, parseLocalDate, toISODate } from './cycleEngine';
/**
 * Bleeding intensity. Heavy bleeding after months without a period is the sign that matters most
 * for the endometrium, so it is flagged for a conversation with the doctor. Observation only.
 */
export type FlowLevel = 'light' | 'medium' | 'heavy' | 'very_heavy';
export const FLOW_LEVELS: FlowLevel[] = ['light', 'medium', 'heavy', 'very_heavy'];
export interface BleedingSign {
  date: string;
  flow?: FlowLevel | null;
  clots?: boolean | null;
  pain?: number | null;
}
export interface BleedingPeriod {
  start_date: string;
  end_date?: string | null;
}
/** A period needs this many heavy days to count as heavy bleeding. */
export const HEAVY_DAYS_MIN = 2;
/** Heavy bleeding after at least this many days without bleeding is flagged separately. */
export const HEAVY_GAP_DAYS = 90;
/** Period without an end date: look at this many days from its start. */
const OPEN_PERIOD_DAYS = 8;
/** Very heavy, or heavy with clots. */
export function isHeavyDay(s: BleedingSign): boolean {
  return s.flow === 'very_heavy' || (s.flow === 'heavy' && !!s.clots);
}
function periodEnd(p: BleedingPeriod): string {
  return p.end_date ? p.end_date.slice(0, 10) : toISODate(addDays(parseLocalDate(p.start_date), OPEN_PERIOD_DAYS - 1));
}
/** Heavy days (sorted) that fall inside the period. */
export function heavyBleedingDays(signs: BleedingSign[], period: BleedingPeriod): string[] {
  const start = period.start_date.slice(0, 10);
  const end = periodEnd(period);
  return signs
    .filter((s) => isHeavyDay(s) && s.date >= start && s.date <= end)
    .map((s) => s.date)
    .sort();
}
const isHeavyPeriod = (signs: BleedingSign[], p: BleedingPeriod) => heavyBleedingDays(signs, p).length >= HEAVY_DAYS_MIN;
/** The last `recent` periods with a heavy-bleeding pattern. */
export function heavyPeriods(periods: BleedingPeriod[], signs: BleedingSign[], recent = 3): BleedingPeriod[] {
  return [...periods]
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(-recent)
    .filter((p) => isHeavyPeriod(signs, p));
}
/** True when a heavy period started HEAVY_GAP_DAYS or more after the previous one ended. */
export function heavyAfterGap(periods: BleedingPeriod[], signs: BleedingSign[], recent = 3): boolean {
  const sorted = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date));
  return sorted.some((p, i) => {
    if (i === 0 || i < sorted.length - recent || !isHeavyPeriod(signs, p)) return false;
    const prev = sorted[i - 1];
    const prevLast = prev.end_date ? prev.end_date.slice(0, 10) : prev.start_date.slice(0, 10);
    return daysBetween(parseLocalDate(prevLast), parseLocalDate(p.start_date)) >= HEAVY_GAP_DAYS;
  });
}
/** Flow and pain recorded inside the period, one entry per day that has any. */
export function periodBleedingDays(signs: BleedingSign[], period: BleedingPeriod): BleedingSign[] {
  const start = period.start_date.slice(0, 10);
  const end = periodEnd(period);
  return signs
    .filter((s) => s.date >= start && s.date <= end && (s.flow || s.clots || s.pain != null))
    .sort((a, b) => a.date.localeCompare(b.date));
}
