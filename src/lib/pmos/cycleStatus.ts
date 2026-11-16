import { bbtPattern, detectTemperatureShift, readingsInCycle, type BBTPattern, type CycleSign } from '@/lib/cycle/fertilitySigns';
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
export function periodGap(periodStarts: string[], today: string): PeriodGap | null {
  const starts = [...new Set(periodStarts.map((s) => s.slice(0, 10)))].filter((s) => s <= today).sort();
  if (!starts.length) return null;
  const lastStart = starts[starts.length - 1];
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
