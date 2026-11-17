/**
 * Body signs that help confirm ovulation after the fact: basal body temperature (BBT) and
 * cervical mucus. This is reference information, never a contraceptive method or a diagnosis.
 *
 * Temperature shift: the "three over six" rule (Barrett & Marshall 1969, used by symptothermal
 * methods such as Sensiplan). A coverline is drawn at the highest of six consecutive valid
 * readings; three consecutive readings above it, the third at least 0.2 °C higher, confirm that
 * ovulation happened, usually on the day of the last low reading or the day before.
 * With PMOS, cycles without ovulation are common and then the chart stays flat (monophasic).
 */

export type CervicalMucus = 'dry' | 'sticky' | 'creamy' | 'watery' | 'eggwhite';

export const MUCUS_ORDER: CervicalMucus[] = ['dry', 'sticky', 'creamy', 'watery', 'eggwhite'];

/** Watery and egg-white mucus are the most fertile types: ovulation is usually close. */
export function isFertileMucus(m: CervicalMucus | null | undefined): boolean {
  return m === 'watery' || m === 'eggwhite';
}

export interface CycleSign {
  date: string; // YYYY-MM-DD
  spotting: boolean;
  bbtCelsius: number | null;
  bbtDisturbed: boolean;
  cervicalMucus: CervicalMucus | null;
  sexCount: number;
  sexProtection: 'protected' | 'unprotected' | null;
  notes: string | null;
  /** Ovulation (LH) strip result. */
  lhTest?: 'negative' | 'positive' | null;
  /** Pregnancy test result. */
  pregnancyTest?: 'negative' | 'positive' | null;
  /** Bleeding intensity for a period day. */
  flow?: 'light' | 'medium' | 'heavy' | 'very_heavy' | null;
  clots?: boolean;
  pain?: number | null;
}

export function emptySign(date: string): CycleSign {
  return {
    date, spotting: false, bbtCelsius: null, bbtDisturbed: false,
    cervicalMucus: null, sexCount: 0, sexProtection: null, notes: null, lhTest: null, pregnancyTest: null, flow: null, clots: false, pain: null,
  };
}

/** True when the row carries no information and can be deleted instead of stored. */
export function isEmptySign(s: CycleSign): boolean {
  return !s.spotting && s.bbtCelsius == null && !s.cervicalMucus && s.sexCount === 0 && !s.notes && !s.lhTest && !s.pregnancyTest && !s.flow && !s.clots && s.pain == null;
}

export const BBT_LOW_READINGS = 6;
export const BBT_HIGH_READINGS = 3;
export const BBT_MIN_RISE = 0.2;
/** With this many valid readings and no shift the cycle looks monophasic (no ovulation detected). */
export const MONOPHASIC_MIN_READINGS = 20;

export interface TemperatureShift {
  /** Estimated ovulation day: the last low reading before the rise. */
  ovulationDate: string;
  coverline: number;
  firstHighDate: string;
  /** Day of the third high reading, when the shift became confirmed. */
  confirmedDate: string;
}

export interface BBTReading {
  date: string;
  celsius: number;
  disturbed?: boolean;
}

/**
 * Finds the first temperature shift in the readings of one cycle. Disturbed readings are skipped,
 * as the method says. Returns null when there is no confirmed shift yet.
 */
export function detectTemperatureShift(readings: BBTReading[]): TemperatureShift | null {
  const valid = readings
    .filter((r) => !r.disturbed && Number.isFinite(r.celsius))
    .sort((a, b) => a.date.localeCompare(b.date));

  for (let i = BBT_LOW_READINGS; i + BBT_HIGH_READINGS <= valid.length; i++) {
    const low = valid.slice(i - BBT_LOW_READINGS, i);
    const coverline = Math.max(...low.map((r) => r.celsius));
    const high = valid.slice(i, i + BBT_HIGH_READINGS);
    const allAbove = high.every((r) => r.celsius > coverline);
    // Rounded to avoid 36.6 + 0.2 = 36.800000000000004 rejecting an exact 0.2 rise.
    const thirdRise = Math.round((high[BBT_HIGH_READINGS - 1].celsius - coverline) * 100) / 100;
    if (allAbove && thirdRise >= BBT_MIN_RISE) {
      return {
        ovulationDate: low[low.length - 1].date,
        coverline,
        firstHighDate: high[0].date,
        confirmedDate: high[BBT_HIGH_READINGS - 1].date,
      };
    }
  }
  return null;
}

export type BBTPattern = 'notEnough' | 'shift' | 'monophasic' | 'waiting';

export function bbtPattern(readings: BBTReading[]): BBTPattern {
  const valid = readings.filter((r) => !r.disturbed).length;
  if (detectTemperatureShift(readings)) return 'shift';
  if (valid < BBT_LOW_READINGS + BBT_HIGH_READINGS) return 'notEnough';
  return valid >= MONOPHASIC_MIN_READINGS ? 'monophasic' : 'waiting';
}

/** Readings from the cycle that starts on cycleStart (inclusive) and ends before nextStart. */
export function readingsInCycle(signs: CycleSign[], cycleStart: string, nextStart?: string): BBTReading[] {
  return signs
    .filter((s) => s.bbtCelsius != null && s.date >= cycleStart && (!nextStart || s.date < nextStart))
    .map((s) => ({ date: s.date, celsius: s.bbtCelsius as number, disturbed: s.bbtDisturbed }));
}

/** Parses user input such as "36,55" or "97.7" (°F is converted). Returns null when not plausible. */
export function parseTemperature(input: string): number | null {
  const n = Number(input.trim().replace(',', '.'));
  if (!Number.isFinite(n) || input.trim() === '') return null;
  const celsius = n > 90 ? (n - 32) * (5 / 9) : n;
  if (celsius < 34 || celsius > 40) return null;
  return Math.round(celsius * 100) / 100;
}
