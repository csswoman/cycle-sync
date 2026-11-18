import { bbtPattern, detectTemperatureShift, readingsInCycle, type BBTPattern, type CycleSign } from '@/lib/cycle/fertilitySigns';
import { activePregnancy, type Pregnancy } from '@/lib/cycle/pregnancy';
import { NO_PERIOD_DAYS, NORMAL_CYCLE_MAX } from '@/lib/cycle/cycleAnalysis';

const DAY_MS = 86_400_000;
const parse = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const diffDays = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / DAY_MS);

/** Between NORMAL_CYCLE_MAX and NO_PERIOD_DAYS: long enough to suggest a pregnancy test. */
export const VERY_LONG_GAP_DAYS = 60;
/** A luteal-phase progesterone at or above this (ng/mL) suggests ovulation happened. */
export const PROGESTERONE_OVULATION_NG_ML = 3;
/** Positive LH strips on this many days or more, spread over more than one surge, make LH unreliable for that cycle. */
export const LH_UNRELIABLE_DAYS = 3;
/** A single LH surge usually stays positive for at most this many consecutive days. */
const LH_SURGE_SPAN_DAYS = 3;

export type GapLevel = 'ok' | 'long' | 'very_long' | 'alert';

export interface PeriodGap {
  lastStart: string;
  /** Date the count starts from: the last period, or the end of a pregnancy after it. */
  from: string;
  since: 'period' | 'pregnancy_end';
  days: number;
  level: GapLevel;
  /** True when long gaps are expected (hormonal contraception, breastfeeding, perimenopause): level is always 'ok'. */
  expected: boolean;
}

/**
 * Days without a period and how worrying that is (2023 PCOS guideline thresholds).
 * During a pregnancy there is no count; after it ends the count starts from the end date, so
 * months without a period after a pregnancy still surface. With `gapsExpected` the days are
 * reported but never raised as a warning.
 */
export function periodGap(
  periodStarts: string[], today: string, pregnancies: Pregnancy[] = [], opts: { gapsExpected?: boolean } = {},
): PeriodGap | null {
  const starts = [...new Set(periodStarts.map((s) => s.slice(0, 10)))].filter((s) => s <= today).sort();
  if (!starts.length) return null;
  if (activePregnancy(pregnancies, today)) return null;
  const lastStart = starts[starts.length - 1];
  const endedAfter = pregnancies
    .filter((p) => p.end_date && p.start_date.slice(0, 10) >= lastStart && p.end_date.slice(0, 10) <= today)
    .map((p) => (p.end_date as string).slice(0, 10))
    .sort()
    .pop();
  const from = endedAfter ?? lastStart;
  const days = diffDays(from, today);
  const expected = !!opts.gapsExpected;
  const level: GapLevel = expected ? 'ok'
    : days > NO_PERIOD_DAYS ? 'alert' : days > VERY_LONG_GAP_DAYS ? 'very_long' : days > NORMAL_CYCLE_MAX ? 'long' : 'ok';
  return { lastStart, from, since: endedAfter ? 'pregnancy_end' : 'period', days, level, expected };
}

export type OvulationStatus = 'confirmed' | 'possible' | 'not_detected' | 'no_data' | 'in_progress';

export interface CycleOvulation {
  start: string;
  /** Start of the next cycle; undefined for the current one. */
  end?: string;
  length?: number;
  status: OvulationStatus;
  /** What confirmed it, when status is 'confirmed'. */
  confirmedBy?: 'bbt' | 'progesterone';
  ovulationDate?: string;
  lhPositive: boolean;
  /** Positive LH on several days spread beyond one surge: common with PMOS, so LH is not counted. */
  lhUnreliable: boolean;
  bbt: BBTPattern;
}

/** Progesterone lab results, ready for ovulationHistory. */
export function progesteroneOf(labs: { date: string; marker: string; value: number }[]): { date: string; value: number }[] {
  return labs.filter((l) => l.marker === 'progesterone').map((l) => ({ date: l.date.slice(0, 10), value: l.value }));
}

/** True when positive LH days in a cycle look like more than one surge or a high baseline. */
export function lhUnreliable(positiveDates: string[]): boolean {
  const days = [...new Set(positiveDates.map((d) => d.slice(0, 10)))].sort();
  if (days.length < LH_UNRELIABLE_DAYS) return false;
  return diffDays(days[0], days[days.length - 1]) > LH_SURGE_SPAN_DAYS;
}

/**
 * Ovulation evidence per cycle (newest first). A sustained basal temperature rise or a
 * progesterone of 3 ng/mL or more confirms it. A full monophasic chart outweighs a positive LH
 * strip, and a positive LH alone only makes it possible (with PMOS LH strips give false positives).
 */
export function ovulationHistory(
  periodStarts: string[], signs: CycleSign[], today: string, max = 6,
  progesterone: { date: string; value: number }[] = [],
): CycleOvulation[] {
  const starts = [...new Set(periodStarts.map((s) => s.slice(0, 10)))].filter((s) => s <= today).sort();
  const out: CycleOvulation[] = [];
  const inCycle = (date: string, start: string, end?: string) => date >= start && (!end || date < end);
  for (let i = starts.length - 1; i >= 0 && out.length < max; i--) {
    const start = starts[i];
    const end = starts[i + 1];
    const readings = readingsInCycle(signs, start, end);
    const shift = detectTemperatureShift(readings);
    const pattern = bbtPattern(readings);
    const lhDates = signs.filter((s) => s.lhTest === 'positive' && inCycle(s.date, start, end)).map((s) => s.date);
    const lhPositive = lhDates.length > 0;
    const unreliable = lhUnreliable(lhDates);
    const progesteroneOk = progesterone.some((p) => inCycle(p.date.slice(0, 10), start, end) && p.value >= PROGESTERONE_OVULATION_NG_ML);
    let status: OvulationStatus;
    let confirmedBy: CycleOvulation['confirmedBy'];
    if (shift) { status = 'confirmed'; confirmedBy = 'bbt'; }
    else if (progesteroneOk) { status = 'confirmed'; confirmedBy = 'progesterone'; }
    else if (pattern === 'monophasic') status = 'not_detected';
    else if (lhPositive && !unreliable) status = 'possible';
    else if (!end && (pattern === 'waiting' || pattern === 'notEnough') && readings.length > 0) status = 'in_progress';
    else if (end && pattern === 'waiting') status = 'not_detected';
    else status = 'no_data';
    out.push({
      start, end, length: end ? diffDays(start, end) : undefined, status, confirmedBy,
      ovulationDate: shift?.ovulationDate, lhPositive, lhUnreliable: unreliable, bbt: pattern,
    });
  }
  return out;
}

/** 'unknown' = no recent signs and cycles too irregular for a calendar estimate to mean anything. */
export type FertileLevel = 'high' | 'possible' | 'passed' | 'calendar' | 'unknown';
export interface FertileNow {
  level: FertileLevel;
  /** Signs that support the level, newest evidence first. */
  reasons: ('eggwhite_mucus' | 'watery_mucus' | 'lh_positive' | 'temperature_shift')[];
}
/**
 * "Buscando embarazo": the fertile window read from the body first. Fertile mucus or a positive LH
 * in the last 3 days point to a fertile time; a temperature rise says ovulation already happened.
 * Without any sign it falls back to the calendar estimate, unless cycles are irregular: then the
 * calendar says nothing useful and the level is 'unknown'.
 */
export function fertileNow(
  signs: CycleSign[], cycleStart: string | null, today: string, opts: { irregular?: boolean } = {},
): FertileNow {
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
  return { level: opts.irregular ? 'unknown' : 'calendar', reasons: [] };
}
