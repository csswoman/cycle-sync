/**
 * Metformin under its generic name (Spanish or English) or a common brand name. Used for the
 * vitamin B12 reminder, care tips and side-effect lists, so all of them agree on who takes it.
 */
export const METFORMIN_PATTERN = /metformin|glucophage|glafornil|dabex|riomet|fortamet|glumetza|diaformina|dimefor/i;

export function isMetformin(name: string | null | undefined): boolean {
  return !!name && METFORMIN_PATTERN.test(name);
}

/** True when an active medication in the list is metformin. */
export function isOnMetformin(medications: { name: string; active?: boolean | null }[]): boolean {
  return medications.some((m) => !!m.active && isMetformin(m.name));
}
