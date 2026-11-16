/**
 * Rotterdam criteria card. The user records what her doctor told her; the app only names the
 * phenotype from the boxes she ticked. It never diagnoses.
 */
export interface DiagnosisCriteria {
  irregular_cycles: boolean;
  clinical_hyperandrogenism: boolean;
  biochemical_hyperandrogenism: boolean;
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
