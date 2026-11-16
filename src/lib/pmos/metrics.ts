// PMOS = Polyendocrine Metabolic Ovarian Syndrome (formerly PCOS).
export type GlucoseContext = 'fasting' | 'post_meal' | 'random';

export interface PMOSMetricEntry {
  id: string;
  user_id: string;
  date: string;
  glucose_mg_dl: number | null;
  glucose_context: GlucoseContext | null;
  insulin_uiu_ml: number | null;
  weight_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  systolic?: number | null;
  diastolic?: number | null;
}

/** Blood pressure category (ACC/AHA 2017) for a single reading. */
export function bloodPressureCategory(sys: number, dia: number): 'normal' | 'elevated' | 'stage1' | 'stage2' {
  if (sys >= 140 || dia >= 90) return 'stage2';
  if (sys >= 130 || dia >= 80) return 'stage1';
  if (sys >= 120) return 'elevated';
  return 'normal';
}

/** Waist-to-hip ratio, or null when either measure is missing. */
export function waistHipRatio(waistCm: number | null | undefined, hipCm: number | null | undefined): number | null {
  if (!waistCm || !hipCm || waistCm <= 0 || hipCm <= 0) return null;
  return waistCm / hipCm;
}

/** WHO threshold for increased metabolic risk in women. */
export const WHR_RISK_THRESHOLD = 0.85;

/** HOMA-IR = fasting glucose (mg/dL) x fasting insulin (uIU/mL) / 405. */
export function homaIr(fastingGlucoseMgDl: number | null | undefined, fastingInsulinUiuMl: number | null | undefined): number | null {
  if (!fastingGlucoseMgDl || fastingInsulinUiuMl == null || fastingGlucoseMgDl <= 0 || fastingInsulinUiuMl < 0) return null;
  return (fastingGlucoseMgDl * fastingInsulinUiuMl) / 405;
}

export type LabMarker =
  | 'testosterone' | 'lh' | 'fsh' | 'homa_ir' | 'tsh' | 'vitamin_d'
  | 'shbg' | 'amh' | 'prolactin' | 'hba1c' | 'fasting_glucose' | 'fasting_insulin'
  | 'total_cholesterol' | 'ldl' | 'hdl' | 'triglycerides' | 'vitamin_b12';

export type LabGroup = 'hormones' | 'metabolic' | 'lipids' | 'other';

export interface LabMarkerInfo {
  key: LabMarker;
  label: string;
  labelEs: string;
  unit: string;
  group: LabGroup;
  /** Typical adult-female reference range. Each lab publishes its own; that one takes priority. */
  low: number | null;
  high: number | null;
  noteEs?: string;
  noteEn?: string;
}

export const LAB_MARKERS: LabMarkerInfo[] = [
  { key: 'testosterone', label: 'Total testosterone', labelEs: 'Testosterona total', unit: 'ng/dL', group: 'hormones', low: 15, high: 70 },
  { key: 'shbg', label: 'SHBG', labelEs: 'SHBG', unit: 'nmol/L', group: 'hormones', low: 18, high: 144,
    noteEs: 'Con testosterona del mismo día se calcula el índice de andrógenos libres.', noteEn: 'With same-day testosterone the free androgen index is calculated.' },
  { key: 'lh', label: 'LH', labelEs: 'LH', unit: 'mIU/mL', group: 'hormones', low: 2, high: 15 },
  { key: 'fsh', label: 'FSH', labelEs: 'FSH', unit: 'mIU/mL', group: 'hormones', low: 3, high: 10 },
  { key: 'amh', label: 'AMH', labelEs: 'AMH (antimülleriana)', unit: 'ng/mL', group: 'hormones', low: 1, high: 4,
    noteEs: 'Cambia mucho con la edad. Un valor alto es frecuente con PMOS.', noteEn: 'Varies a lot with age. A high value is common with PMOS.' },
  { key: 'prolactin', label: 'Prolactin', labelEs: 'Prolactina', unit: 'ng/mL', group: 'hormones', low: 5, high: 25 },
  { key: 'tsh', label: 'TSH', labelEs: 'TSH (tiroides)', unit: 'mIU/L', group: 'hormones', low: 0.4, high: 4 },
  { key: 'fasting_glucose', label: 'Fasting glucose', labelEs: 'Glucosa en ayunas', unit: 'mg/dL', group: 'metabolic', low: 70, high: 99 },
  { key: 'fasting_insulin', label: 'Fasting insulin', labelEs: 'Insulina en ayunas', unit: 'µIU/mL', group: 'metabolic', low: 2, high: 20 },
  { key: 'homa_ir', label: 'HOMA-IR', labelEs: 'HOMA-IR', unit: '', group: 'metabolic', low: null, high: 2.5,
    noteEs: 'Se calcula solo si registras glucosa e insulina en ayunas del mismo día.', noteEn: 'Calculated automatically from same-day fasting glucose and insulin.' },
  { key: 'hba1c', label: 'HbA1c', labelEs: 'Hemoglobina glicosilada (HbA1c)', unit: '%', group: 'metabolic', low: null, high: 5.6,
    noteEs: '5.7–6.4 % se considera prediabetes; 6.5 % o más, diabetes.', noteEn: '5.7–6.4% is prediabetes; 6.5% or more, diabetes.' },
  { key: 'total_cholesterol', label: 'Total cholesterol', labelEs: 'Colesterol total', unit: 'mg/dL', group: 'lipids', low: null, high: 200 },
  { key: 'ldl', label: 'LDL', labelEs: 'Colesterol LDL', unit: 'mg/dL', group: 'lipids', low: null, high: 130 },
  { key: 'hdl', label: 'HDL', labelEs: 'Colesterol HDL', unit: 'mg/dL', group: 'lipids', low: 50, high: null },
  { key: 'triglycerides', label: 'Triglycerides', labelEs: 'Triglicéridos', unit: 'mg/dL', group: 'lipids', low: null, high: 150 },
  { key: 'vitamin_d', label: 'Vitamin D (25-OH)', labelEs: 'Vitamina D (25-OH)', unit: 'ng/mL', group: 'other', low: 30, high: 100 },
  { key: 'vitamin_b12', label: 'Vitamin B12', labelEs: 'Vitamina B12', unit: 'pg/mL', group: 'other', low: 200, high: 900,
    noteEs: 'Conviene revisarla si tomas metformina por mucho tiempo.', noteEn: 'Worth checking on long-term metformin.' },
];

/** Converts total testosterone from ng/dL to nmol/L. */
export const TESTOSTERONE_NGDL_TO_NMOL = 0.0347;

/**
 * Free androgen index = total testosterone (nmol/L) / SHBG (nmol/L) x 100.
 * Labs use different cut-offs; about 5 or more is commonly read as elevated in women.
 */
export function freeAndrogenIndex(testosteroneNgDl: number | null | undefined, shbgNmolL: number | null | undefined): number | null {
  if (!testosteroneNgDl || !shbgNmolL || testosteroneNgDl <= 0 || shbgNmolL <= 0) return null;
  return ((testosteroneNgDl * TESTOSTERONE_NGDL_TO_NMOL) / shbgNmolL) * 100;
}
export const FAI_HIGH = 5;

export function markerLabel(info: LabMarkerInfo, lang: 'es' | 'en'): string {
  return lang === 'es' ? info.labelEs : info.label;
}

/** Pairs same-day results of two markers and applies `fn`. */
export function derivedSeries(
  results: { date: string; marker: LabMarker; value: number }[],
  a: LabMarker,
  b: LabMarker,
  fn: (x: number, y: number) => number | null,
): { date: string; value: number }[] {
  const byDate = new Map<string, { x?: number; y?: number }>();
  for (const r of results) {
    if (r.marker !== a && r.marker !== b) continue;
    const cur = byDate.get(r.date) ?? {};
    if (r.marker === a) cur.x = r.value; else cur.y = r.value;
    byDate.set(r.date, cur);
  }
  return [...byDate.entries()]
    .sort(([d1], [d2]) => d1.localeCompare(d2))
    .flatMap(([date, { x, y }]) => {
      const v = x != null && y != null ? fn(x, y) : null;
      return v == null ? [] : [{ date, value: Math.round(v * 100) / 100 }];
    });
}

export function markerInfo(key: LabMarker): LabMarkerInfo {
  return LAB_MARKERS.find((m) => m.key === key)!;
}

export function markerStatus(info: LabMarkerInfo, value: number): 'low' | 'high' | 'ok' {
  if (info.low != null && value < info.low) return 'low';
  if (info.high != null && value > info.high) return 'high';
  return 'ok';
}
