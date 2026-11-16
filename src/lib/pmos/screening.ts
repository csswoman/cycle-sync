/**
 * Periodic check-ups for people with PMOS, based on the 2023 International Evidence-based
 * Guideline for PCOS: glycaemic status (HbA1c / fasting glucose / OGTT) every 1–3 years depending
 * on risk, lipid profile at diagnosis and then according to cardiovascular risk, and blood
 * pressure every year. The app uses the shorter interval as a gentle reminder; the doctor decides.
 */
export type ScreeningKey = 'glucose' | 'lipids' | 'blood_pressure' | 'vitamin_b12';

export interface ScreeningItem {
  key: ScreeningKey;
  /** Latest date found, or null when never logged. */
  last: string | null;
  /** Date when the next check is suggested. */
  due: string | null;
  status: 'never' | 'due' | 'ok';
}

export const SCREENING_MONTHS: Record<ScreeningKey, number> = {
  glucose: 12,
  lipids: 24,
  blood_pressure: 12,
  vitamin_b12: 12,
};

function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1 + months, d);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export interface ScreeningInput {
  labs: { date: string; marker: string }[];
  /** Dates with a fasting glucose reading from the body metrics log. */
  fastingGlucoseDates: string[];
  bloodPressureDates: string[];
  onMetformin: boolean;
}

const MARKERS: Record<Exclude<ScreeningKey, 'blood_pressure'>, string[]> = {
  glucose: ['hba1c', 'fasting_glucose', 'glucose_2h'],
  lipids: ['total_cholesterol', 'ldl', 'hdl', 'triglycerides'],
  vitamin_b12: ['vitamin_b12'],
};

export function screeningPlan(input: ScreeningInput, today: string): ScreeningItem[] {
  const latest = (dates: string[]) => (dates.length ? [...dates].sort().at(-1)! : null);
  const labDates = (markers: string[]) => input.labs.filter((l) => markers.includes(l.marker)).map((l) => l.date);

  const lastBy: Record<ScreeningKey, string | null> = {
    glucose: latest([...labDates(MARKERS.glucose), ...input.fastingGlucoseDates]),
    lipids: latest(labDates(MARKERS.lipids)),
    blood_pressure: latest(input.bloodPressureDates),
    vitamin_b12: latest(labDates(MARKERS.vitamin_b12)),
  };

  const keys: ScreeningKey[] = ['glucose', 'lipids', 'blood_pressure'];
  if (input.onMetformin) keys.push('vitamin_b12');

  return keys.map((key) => {
    const last = lastBy[key];
    if (!last) return { key, last: null, due: null, status: 'never' as const };
    const due = addMonths(last, SCREENING_MONTHS[key]);
    return { key, last, due, status: due <= today ? ('due' as const) : ('ok' as const) };
  });
}
