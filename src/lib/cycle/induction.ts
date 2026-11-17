import type { CycleSign } from './fertilitySigns';
const DAY_MS = 86_400_000;
const parse = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export interface InductionRow {
  date: string;
  cycleDay: number;
  /** The induction drug is scheduled this day. */
  scheduled: boolean;
  /** The user marked the dose as taken (any dose that day). */
  taken: boolean;
  bbtCelsius: number | null;
  lhTest: 'negative' | 'positive' | null;
  pregnancyTest: 'negative' | 'positive' | null;
}
/**
 * One row per cycle day with something to show (drug day, temperature, LH or pregnancy test), so
 * an induction cycle can be read on one screen. `takenDates` are the days with a taken dose.
 */
export function inductionCycleRows(
  cycleStart: string,
  today: string,
  inductionDays: number[],
  signs: CycleSign[],
  takenDates: string[],
): InductionRow[] {
  const start = parse(cycleStart);
  const end = parse(today);
  const last = Math.round((end.getTime() - start.getTime()) / DAY_MS);
  const rows: InductionRow[] = [];
  for (let i = 0; i <= Math.min(last, 60); i++) {
    const date = iso(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    const sign = signs.find((s) => s.date === date);
    const row: InductionRow = {
      date, cycleDay: i + 1,
      scheduled: inductionDays.includes(i + 1),
      taken: takenDates.includes(date),
      bbtCelsius: sign && !sign.bbtDisturbed ? sign.bbtCelsius : null,
      lhTest: sign?.lhTest ?? null,
      pregnancyTest: sign?.pregnancyTest ?? null,
    };
    if (row.scheduled || row.bbtCelsius != null || row.lhTest || row.pregnancyTest) rows.push(row);
  }
  return rows;
}
