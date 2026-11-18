/**
 * Rotterdam criteria card. The user records what her doctor told her; the app only names the
 * phenotype from the boxes she ticked. It never diagnoses.
 */
import { derivedSeries, FAI_HIGH, freeAndrogenIndex, markerInfo, markerStatus, type LabMarker } from './metrics';
import { FG_THRESHOLD } from './wellbeing';
import type { CycleFlag } from '@/lib/cycle/cycleAnalysis';

export interface DiagnosisCriteria {
  irregular_cycles: boolean;
  clinical_hyperandrogenism: boolean;
  biochemical_hyperandrogenism: boolean;
  /** On ultrasound, or a high AMH in adults (2023 guideline; not within 8 years of the first period). */
  polycystic_ovaries: boolean;
}
export type Phenotype = 'A' | 'B' | 'C' | 'D';
export const PHENOTYPE_INFO: Record<Phenotype, { es: string; en: string }> = {
  A: { es: 'Hiperandrogenismo + ciclos irregulares + ovarios poliquísticos', en: 'Hyperandrogenism + irregular cycles + polycystic ovaries' },
  B: { es: 'Hiperandrogenismo + ciclos irregulares', en: 'Hyperandrogenism + irregular cycles' },
  C: { es: 'Hiperandrogenismo + ovarios poliquísticos', en: 'Hyperandrogenism + polycystic ovaries' },
  D: { es: 'Ciclos irregulares + ovarios poliquísticos', en: 'Irregular cycles + polycystic ovaries' },
};
/** A to D when at least two of the three Rotterdam criteria are marked, otherwise null. */
export function phenotype(c: Partial<DiagnosisCriteria>): Phenotype | null {
  const ha = !!(c.clinical_hyperandrogenism || c.biochemical_hyperandrogenism);
  const od = !!c.irregular_cycles;
  const pcom = !!c.polycystic_ovaries;
  if (ha && od && pcom) return 'A';
  if (ha && od) return 'B';
  if (ha && pcom) return 'C';
  if (od && pcom) return 'D';
  return null;
}

type Lab = { date: string; marker: string; value: number };
const latest = (labs: Lab[], marker: LabMarker): Lab | null =>
  labs.filter((l) => l.marker === marker).sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? null;

/**
 * Rotterdam also asks to rule out other causes: thyroid disease, high prolactin and non-classic
 * congenital adrenal hyperplasia (17-OH progesterone). The app only reports what is logged.
 */
export type ExclusionKey = 'tsh' | 'prolactin' | 'ohp17';
export interface ExclusionCheck { key: ExclusionKey; status: 'missing' | 'ok' | 'abnormal'; value?: number; date?: string }
/** Follicular-phase 17-OH progesterone above this (ng/mL) is commonly followed up for non-classic CAH. */
export const OHP17_SCREEN_HIGH = 2;

export function exclusionChecks(labs: Lab[]): ExclusionCheck[] {
  return (['tsh', 'prolactin', 'ohp17'] as const).map((key) => {
    const l = latest(labs, key);
    if (!l) return { key, status: 'missing' as const };
    const abnormal = key === 'ohp17' ? l.value > OHP17_SCREEN_HIGH : !['ok', 'none'].includes(markerStatus(markerInfo(key), l.value));
    return { key, status: abnormal ? 'abnormal' as const : 'ok' as const, value: l.value, date: l.date };
  });
}

/** What in the user's own log points to each criterion. Describes the data; it does not diagnose. */
export type EvidenceKey = 'cycle_pattern' | 'testosterone' | 'fai' | 'ferriman_gallwey' | 'amh';
export function logEvidence(input: {
  cycleFlags: CycleFlag[];
  labs: Lab[];
  hirsutism: { date: string; total: number }[];
}): Partial<Record<keyof DiagnosisCriteria, EvidenceKey[]>> {
  const out: Partial<Record<keyof DiagnosisCriteria, EvidenceKey[]>> = {};
  const push = (k: keyof DiagnosisCriteria, e: EvidenceKey) => { (out[k] ??= []).push(e); };
  if (input.cycleFlags.some((f) => f === 'longCycles' || f === 'shortCycles' || f === 'noPeriod90' || f === 'fewPeriodsYear')) {
    push('irregular_cycles', 'cycle_pattern');
  }
  const t = latest(input.labs, 'testosterone');
  if (t && markerStatus(markerInfo('testosterone'), t.value) === 'high') push('biochemical_hyperandrogenism', 'testosterone');
  const fai = derivedSeries(input.labs as { date: string; marker: LabMarker; value: number }[], 'testosterone', 'shbg', freeAndrogenIndex).at(-1);
  if (fai && fai.value >= FAI_HIGH) push('biochemical_hyperandrogenism', 'fai');
  const fg = [...input.hirsutism].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  if (fg && fg.total >= FG_THRESHOLD) push('clinical_hyperandrogenism', 'ferriman_gallwey');
  const amh = latest(input.labs, 'amh');
  const amhHigh = markerInfo('amh').high;
  if (amh && amhHigh != null && amh.value > amhHigh) push('polycystic_ovaries', 'amh');
  return out;
}
