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

export type LabMarker = 'testosterone' | 'lh' | 'fsh' | 'homa_ir' | 'tsh' | 'vitamin_d';

export interface LabMarkerInfo {
  key: LabMarker;
  label: string;
  unit: string;
  /** Typical adult-female reference range. Each lab publishes its own; that one takes priority. */
  low: number | null;
  high: number | null;
}

export const LAB_MARKERS: LabMarkerInfo[] = [
  { key: 'testosterone', label: 'Total testosterone', unit: 'ng/dL', low: 15, high: 70 },
  { key: 'lh', label: 'LH', unit: 'mIU/mL', low: 2, high: 15 },
  { key: 'fsh', label: 'FSH', unit: 'mIU/mL', low: 3, high: 10 },
  { key: 'homa_ir', label: 'HOMA-IR', unit: '', low: null, high: 2.5 },
  { key: 'tsh', label: 'TSH', unit: 'mIU/L', low: 0.4, high: 4 },
  { key: 'vitamin_d', label: 'Vitamin D (25-OH)', unit: 'ng/mL', low: 30, high: 100 },
];

export function markerInfo(key: LabMarker): LabMarkerInfo {
  return LAB_MARKERS.find((m) => m.key === key)!;
}

export function markerStatus(info: LabMarkerInfo, value: number): 'low' | 'high' | 'ok' {
  if (info.low != null && value < info.low) return 'low';
  if (info.high != null && value > info.high) return 'high';
  return 'ok';
}
