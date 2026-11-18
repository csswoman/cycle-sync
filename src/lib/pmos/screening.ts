/**
 * Periodic check-ups for people with PMOS, based on the 2023 International Evidence-based
 * Guideline for PCOS: glycaemic status (HbA1c / fasting plasma glucose / OGTT) every 1–3 years
 * depending on diabetes risk, lipid profile at diagnosis and then according to cardiovascular
 * risk, and blood pressure every year. Reminders only; the doctor decides.
 *
 * Only laboratory results count for glucose. A finger-prick reading from a home meter is useful
 * for daily tracking but is not a screening test, so it never postpones the reminder.
 */
import type { PMOSOverviewData } from '@/hooks/usePMOSOverview';
import { bloodPressureCategory } from './metrics';
import { isOnMetformin } from './metformin';

export type ScreeningKey = 'glucose' | 'lipids' | 'blood_pressure' | 'vitamin_b12';

export interface ScreeningItem {
  key: ScreeningKey;
  /** Latest date found, or null when never logged. */
  last: string | null;
  /** Date when the next check is suggested. */
  due: string | null;
  /** 'soon' = due within SOON_DAYS. */
  status: 'never' | 'due' | 'soon' | 'ok';
  /** Glucose only: with risk factors the guideline prefers a glucose tolerance test (OGTT). */
  preferOgtt?: boolean;
  /** Glucose only: risk factors behind the interval (empty = low risk, every 3 years). */
  riskFactors?: DiabetesRiskFactor[];
}

export const SCREENING_MONTHS: Record<ScreeningKey, number> = {
  glucose: 12,
  lipids: 24,
  blood_pressure: 12,
  vitamin_b12: 12,
};
/** Glucose interval when no diabetes risk factor is known (upper end of the guideline's 1–3 years). */
export const GLUCOSE_LOW_RISK_MONTHS = 36;
export const SOON_DAYS = 30;
/** BMI from which the guideline counts weight as a diabetes risk factor (23 in Asian populations, not asked by the app). */
export const BMI_RISK = 25;

/** Lab markers that count as a glucose screening test. */
export const GLUCOSE_LAB_MARKERS = ['hba1c', 'fasting_glucose', 'glucose_2h'] as const;

export type DiabetesRiskFactor = 'bmi' | 'high_blood_pressure' | 'prediabetes' | 'unknown_weight';

export interface DiabetesRiskInput {
  bmi: number | null;
  /** Latest blood pressure reading is stage 1 or higher. */
  highBloodPressure: boolean;
}

export interface ScreeningInput {
  labs: { date: string; marker: string; value?: number }[];
  bloodPressureDates: string[];
  onMetformin: boolean;
  /** Without it, risk is unknown and glucose stays yearly. */
  risk?: DiabetesRiskInput;
}

function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1 + months, d);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

const latestValue = (labs: ScreeningInput['labs'], marker: string): number | null => {
  const rows = labs.filter((l) => l.marker === marker && l.value != null).sort((a, b) => a.date.localeCompare(b.date));
  return rows.length ? (rows[rows.length - 1].value as number) : null;
};

/**
 * Diabetes risk factors the app can see. Unknown weight counts as a factor so the reminder stays
 * yearly until there is enough data to relax it. Family history, past gestational diabetes and
 * ethnicity also count in the guideline but are not asked.
 */
export function diabetesRiskFactors(labs: ScreeningInput['labs'], risk?: DiabetesRiskInput): DiabetesRiskFactor[] {
  const out: DiabetesRiskFactor[] = [];
  const hba1c = latestValue(labs, 'hba1c');
  const fasting = latestValue(labs, 'fasting_glucose');
  const ogtt = latestValue(labs, 'glucose_2h');
  if ((hba1c != null && hba1c >= 5.7) || (fasting != null && fasting >= 100) || (ogtt != null && ogtt >= 140)) out.push('prediabetes');
  if (!risk || risk.bmi == null) out.push('unknown_weight');
  else if (risk.bmi >= BMI_RISK) out.push('bmi');
  if (risk?.highBloodPressure) out.push('high_blood_pressure');
  return out;
}

export function screeningPlan(input: ScreeningInput, today: string): ScreeningItem[] {
  const latest = (dates: string[]) => (dates.length ? [...dates].map((d) => d.slice(0, 10)).sort().at(-1)! : null);
  const labDates = (markers: readonly string[]) => input.labs.filter((l) => markers.includes(l.marker)).map((l) => l.date);

  const lastBy: Record<ScreeningKey, string | null> = {
    glucose: latest(labDates(GLUCOSE_LAB_MARKERS)),
    lipids: latest(labDates(['total_cholesterol', 'ldl', 'hdl', 'triglycerides'])),
    blood_pressure: latest(input.bloodPressureDates),
    vitamin_b12: latest(labDates(['vitamin_b12'])),
  };

  const factors = diabetesRiskFactors(input.labs, input.risk);
  const months: Record<ScreeningKey, number> = {
    ...SCREENING_MONTHS,
    glucose: factors.length ? SCREENING_MONTHS.glucose : GLUCOSE_LOW_RISK_MONTHS,
  };
  const preferOgtt = factors.some((f) => f !== 'unknown_weight');

  const keys: ScreeningKey[] = ['glucose', 'lipids', 'blood_pressure'];
  if (input.onMetformin) keys.push('vitamin_b12');

  return keys.map((key) => {
    const extra = key === 'glucose' ? { preferOgtt, riskFactors: factors } : {};
    const last = lastBy[key];
    if (!last) return { key, last: null, due: null, status: 'never' as const, ...extra };
    const due = addMonths(last, months[key]);
    const status = due <= today ? 'due' as const : addDays(today, SOON_DAYS) >= due ? 'soon' as const : 'ok' as const;
    return { key, last, due, status, ...extra };
  });
}

/** BMI from height (cm) and weight (kg), or null when either is missing. */
export function bmi(heightCm: number | null | undefined, weightKg: number | null | undefined): number | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  return weightKg / (heightCm / 100) ** 2;
}

/** Builds the screening input from the PMOS overview, so every card uses the same rules. */
export function screeningInputFromOverview(data: PMOSOverviewData): ScreeningInput {
  const bp = data.latestBloodPressure;
  return {
    labs: data.labs,
    bloodPressureDates: data.bloodPressureDates,
    onMetformin: isOnMetformin(data.medications),
    risk: {
      bmi: bmi(data.heightCm, data.latestWeightKg),
      highBloodPressure: !!bp && ['stage1', 'stage2'].includes(bloodPressureCategory(bp.systolic, bp.diastolic)),
    },
  };
}

/**
 * Extra glucose checks around conception and pregnancy, from the 2023 PCOS guideline:
 * a preconception glucose check when trying to conceive, and an oral glucose tolerance test
 * at the first visit and again between 24 and 28 weeks of an active pregnancy. Reminders only.
 * Only laboratory results count; the 24–28 week item needs a 2-hour (OGTT) value.
 */
export type GestationalGlucoseKey = 'preconception_glucose' | 'early_ogtt' | 'ogtt_24_28';
export interface GestationalGlucoseItem {
  key: GestationalGlucoseKey;
  done: boolean;
}
export function gestationalGlucosePlan(input: {
  goal: 'fertility' | string | null;
  gestationalWeeks: number | null;
  labs: { date: string; marker: string }[];
  /** Date the current pregnancy started, when there is one. */
  pregnancyStart: string | null;
  today: string;
}): GestationalGlucoseItem[] {
  const glucoseLabs = input.labs.filter((l) => (GLUCOSE_LAB_MARKERS as readonly string[]).includes(l.marker));
  const since = (from: string, marker?: string) =>
    glucoseLabs.some((l) => l.date.slice(0, 10) >= from.slice(0, 10) && (!marker || l.marker === marker));
  if (input.gestationalWeeks != null && input.pregnancyStart) {
    const items: GestationalGlucoseItem[] = [{ key: 'early_ogtt', done: since(input.pregnancyStart) }];
    if (input.gestationalWeeks >= 20) {
      items.push({ key: 'ogtt_24_28', done: since(addDays(input.pregnancyStart, 24 * 7), 'glucose_2h') });
    }
    return items;
  }
  if (input.goal === 'fertility') return [{ key: 'preconception_glucose', done: since(addMonths(input.today, -12)) }];
  return [];
}
