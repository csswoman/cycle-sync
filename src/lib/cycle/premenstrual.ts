import { addDays, parseLocalDate, toISODate } from './cycleEngine';

/** Days before a period that count as the premenstrual window. */
export const PREMENSTRUAL_DAYS = 7;
/** A symptom is a pattern when it shows up in this many of the cycles checked. */
export const PATTERN_MIN_CYCLES = 2;
/** Moods logged as low count as a premenstrual mood change. */
export const LOW_MOODS = ['Rough', 'Down'];
export const LOW_MOOD_KEY = 'Low mood';

export interface SymptomDay {
  date: string;
  symptoms?: string[] | null;
  mood?: string | null;
}

export interface PremenstrualPattern {
  /** Symptoms seen in the window of at least PATTERN_MIN_CYCLES cycles, most frequent first. */
  symptoms: { key: string; cycles: number }[];
  /** Cycles whose premenstrual window had at least one log. */
  cyclesChecked: number;
}

/**
 * Looks at the PREMENSTRUAL_DAYS before each of the last `recent` period starts and returns the
 * symptoms that repeat. A window with no logs is skipped, so missing data never counts as "no symptoms".
 */
export function premenstrualPattern(logs: SymptomDay[], periodStarts: string[], recent = 3): PremenstrualPattern {
  const starts = Array.from(new Set(periodStarts.map((s) => s.slice(0, 10)))).sort().slice(-recent);
  const byDate = new Map(logs.map((l) => [l.date.slice(0, 10), l]));
  const counts = new Map<string, number>();
  let cyclesChecked = 0;
  for (const start of starts) {
    const first = parseLocalDate(start);
    const seen = new Set<string>();
    let logged = false;
    for (let i = 1; i <= PREMENSTRUAL_DAYS; i++) {
      const log = byDate.get(toISODate(addDays(first, -i)));
      if (!log) continue;
      logged = true;
      for (const s of log.symptoms ?? []) seen.add(s);
      if (log.mood && LOW_MOODS.includes(log.mood)) seen.add(LOW_MOOD_KEY);
    }
    if (!logged) continue;
    cyclesChecked++;
    for (const s of seen) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  const symptoms = [...counts]
    .filter(([, n]) => n >= PATTERN_MIN_CYCLES)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, cycles]) => ({ key, cycles }));
  return { symptoms, cyclesChecked };
}
