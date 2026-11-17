import { bbtPattern, detectTemperatureShift, readingsInCycle, type BBTPattern, type CycleSign } from '@/lib/cycle/fertilitySigns';
import { predictionsPaused, type Pregnancy } from '@/lib/cycle/pregnancy';
import { NO_PERIOD_DAYS, NORMAL_CYCLE_MAX } from '@/lib/cycle/cycleAnalysis';

const DAY_MS = 86_400_000;
const parse = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const diffDays = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / DAY_MS);

export type GapLevel = 'ok' | 'long' | 'very_long' | 'alert';

export interface PeriodGap {
  lastStart: string;
  days: number;
  level: GapLevel;
}

/** Days since the last period started and how worrying that is (2023 PCOS guideline thresholds). */
export function periodGap(periodStarts: string[], today: string, pregnancies: Pregnancy[] = []): PeriodGap | null {
  const starts = [...new Set(periodStarts.map((s) => s.slice(0, 10)))].filter((s) => s <= today).sort();
  if (!starts.length) return null;
  const lastStart = starts[starts.length - 1];
  // No late alert during a pregnancy, or after it until the next period is logged.
  if (predictionsPaused(lastStart, pregnancies, today)) return null;
  const days = diffDays(lastStart, today);
  const level: GapLevel = days > NO_PERIOD_DAYS ? 'alert' : days > 60 ? 'very_long' : days > NORMAL_CYCLE_MAX ? 'long' : 'ok';
  return { lastStart, days, level };
}

export type OvulationStatus = 'confirmed' | 'possible' | 'not_detected' | 'no_data' | 'in_progress';

export interface CycleOvulation {
  start: string;
  /** Start of the next cycle; undefined for the current one. */
  end?: string;
  length?: number;
  status: OvulationStatus;
  ovulationDate?: string;
  lhPositive: boolean;
  bbt: BBTPattern;
}

/**
 * Ovulation evidence per cycle (newest first). A sustained basal temperature rise confirms it;
 * a positive LH strip alone only makes it possible (with PMOS LH strips give false positives).
 */
export function ovulationHistory(periodStarts: string[], signs: CycleSign[], today: string, max = 6): CycleOvulation[] {
  const starts = [...new Set(periodStarts.map((s) => s.slice(0, 10)))].filter((s) => s <= today).sort();
  const out: CycleOvulation[] = [];
  for (let i = starts.length - 1; i >= 0 && out.length < max; i--) {
    const start = starts[i];
    const end = starts[i + 1];
    const readings = readingsInCycle(signs, start, end);
    const shift = detectTemperatureShift(readings);
    const pattern = bbtPattern(readings);
    const lhPositive = signs.some((s) => s.lhTest === 'positive' && s.date >= start && (!end || s.date < end));
    let status: OvulationStatus;
    if (shift) status = 'confirmed';
    else if (lhPositive) status = 'possible';
    else if (pattern === 'monophasic') status = 'not_detected';
    else if (!end && (pattern === 'waiting' || pattern === 'notEnough') && readings.length > 0) status = 'in_progress';
    else if (end && pattern === 'waiting') status = 'not_detected';
    else status = 'no_data';
    out.push({
      start, end, length: end ? diffDays(start, end) : undefined, status,
      ovulationDate: shift?.ovulationDate, lhPositive, bbt: pattern,
    });
  }
  return out;
}

export type FertileLevel = 'high' | 'possible' | 'passed' | 'calendar';
export interface FertileNow {
  level: FertileLevel;
  /** Signs that support the level, newest evidence first. */
  reasons: ('eggwhite_mucus' | 'watery_mucus' | 'lh_positive' | 'temperature_shift')[];
}
/**
 * "Buscando embarazo": the fertile window read from the body first. Fertile mucus or a positive LH
 * in the last 3 days point to a fertile time; a temperature rise says ovulation already happened.
 * Without any sign it falls back to the calendar estimate. With PMOS the calendar is the weakest
 * evidence, and a positive LH alone can be a false positive.
 */
export function fertileNow(signs: CycleSign[], cycleStart: string | null, today: string): FertileNow {
  const from = cycleStart && cycleStart <= today ? cycleStart : null;
  if (from) {
    const shift = detectTemperatureShift(readingsInCycle(signs, from));
    if (shift) return { level: 'passed', reasons: ['temperature_shift'] };
  }
  const recent = signs.filter((s) => s.date <= today && diffDays(s.date, today) <= 2 && (!from || s.date >= from));
  const reasons: FertileNow['reasons'] = [];
  if (recent.some((s) => s.cervicalMucus === 'eggwhite')) reasons.push('eggwhite_mucus');
  else if (recent.some((s) => s.cervicalMucus === 'watery')) reasons.push('watery_mucus');
  if (recent.some((s) => s.lhTest === 'positive')) reasons.push('lh_positive');
  if (reasons.length >= 2 || reasons.includes('eggwhite_mucus')) return { level: 'high', reasons };
  if (reasons.length) return { level: 'possible', reasons };
  return { level: 'calendar', reasons: [] };
}
