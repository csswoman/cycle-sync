import { markerInfo, type LabMarker } from './metrics';

/** A unit a lab may print a marker in, with the conversion to the app's canonical unit. */
export interface UnitOption {
  /** Label shown in the unit selector. */
  label: string;
  /** Lower-case spellings found on lab reports, already passed through `normalizeUnit`. */
  aliases: string[];
  toCanonical: (value: number) => number;
}

/** Lower-cases, drops spaces and maps µ / μ to "u" so "µIU/mL" and "uIU/ml" compare equal. */
export function normalizeUnit(unit: string): string {
  return unit.toLowerCase().replace(/[\sµμ]/g, (c) => (c === 'µ' || c === 'μ' ? 'u' : '')).replace(/\.$/, '');
}

const identity = (label: string, ...aliases: string[]): UnitOption => ({
  label, aliases: aliases.map(normalizeUnit), toCanonical: (v) => v,
});
const factor = (label: string, mul: number, ...aliases: string[]): UnitOption => ({
  label, aliases: aliases.map(normalizeUnit), toCanonical: (v) => v * mul,
});
const divisor = (label: string, div: number, ...aliases: string[]): UnitOption => ({
  label, aliases: aliases.map(normalizeUnit), toCanonical: (v) => v / div,
});

export const GLUCOSE_MMOL_TO_MGDL = 18.016;
export const CHOLESTEROL_MMOL_TO_MGDL = 38.67;
export const TRIGLYCERIDES_MMOL_TO_MGDL = 88.57;
export const TESTOSTERONE_NMOL_PER_NGDL = 0.0347;
export const VITAMIN_D_NMOL_PER_NGML = 2.496;
export const B12_PMOL_PER_PGML = 0.738;
export const INSULIN_PMOL_PER_UIUML = 6.945;

const glucose = [identity('mg/dL', 'mg/dl'), factor('mmol/L', GLUCOSE_MMOL_TO_MGDL, 'mmol/l')];
const cholesterol = [identity('mg/dL', 'mg/dl'), factor('mmol/L', CHOLESTEROL_MMOL_TO_MGDL, 'mmol/l')];

/** Units offered per marker. The first option is always the canonical unit of `LAB_MARKERS`. */
export const UNIT_OPTIONS: Partial<Record<LabMarker, UnitOption[]>> = {
  fasting_glucose: glucose,
  glucose_2h: glucose,
  total_cholesterol: cholesterol,
  ldl: cholesterol,
  hdl: cholesterol,
  triglycerides: [identity('mg/dL', 'mg/dl'), factor('mmol/L', TRIGLYCERIDES_MMOL_TO_MGDL, 'mmol/l')],
  testosterone: [identity('ng/dL', 'ng/dl'), divisor('nmol/L', TESTOSTERONE_NMOL_PER_NGDL, 'nmol/l')],
  vitamin_d: [identity('ng/mL', 'ng/ml', 'ug/l'), divisor('nmol/L', VITAMIN_D_NMOL_PER_NGML, 'nmol/l')],
  vitamin_b12: [identity('pg/mL', 'pg/ml', 'ng/l'), divisor('pmol/L', B12_PMOL_PER_PGML, 'pmol/l')],
  fasting_insulin: [
    identity('µIU/mL', 'uiu/ml', 'uui/ml', 'miu/l', 'mui/l', 'mu/l'),
    divisor('pmol/L', INSULIN_PMOL_PER_UIUML, 'pmol/l'),
  ],
  lh: [identity('mIU/mL', 'miu/ml', 'mui/ml', 'iu/l', 'ui/l', 'u/l')],
  fsh: [identity('mIU/mL', 'miu/ml', 'mui/ml', 'iu/l', 'ui/l', 'u/l')],
  tsh: [identity('mIU/L', 'miu/l', 'mui/l', 'uiu/ml', 'uui/ml', 'mu/l')],
};

/** Units the user can pick for a marker. Markers without a conversion list only their own unit. */
export function unitOptions(marker: LabMarker): UnitOption[] {
  return UNIT_OPTIONS[marker] ?? [identity(markerInfo(marker).unit)];
}

/** Finds the option whose label or alias matches `unit`, or null when the unit is unknown for the marker. */
export function findUnit(marker: LabMarker, unit: string): UnitOption | null {
  const n = normalizeUnit(unit);
  if (!n) return null;
  return unitOptions(marker).find((o) => normalizeUnit(o.label) === n || o.aliases.includes(n)) ?? null;
}

/** Converts `value` typed in `unit` to the canonical unit; null when the unit does not fit the marker. */
export function convertToCanonical(marker: LabMarker, value: number, unit: string): number | null {
  const option = findUnit(marker, unit);
  if (!option) return null;
  return Math.round(option.toCanonical(value) * 100) / 100;
}
