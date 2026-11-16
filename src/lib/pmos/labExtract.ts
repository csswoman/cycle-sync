import { markerInfo, type LabMarker } from './metrics';
import { convertToCanonical } from './units';

/** Row as returned by the model: nothing in it is trusted. */
export interface RawLabRow {
  label?: unknown;
  value?: unknown;
  unit?: unknown;
  date?: unknown;
}

export interface ExtractedLab {
  marker: LabMarker;
  /** Value in the marker's canonical unit. */
  value: number;
  unit: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Label exactly as printed on the report. */
  rawLabel: string;
  /** True when the marker, unit or date was guessed. The review screen leaves these off by default. */
  doubtful: boolean;
}

/** Plausible range per marker, in canonical units. Values outside are discarded as misreads. */
export const PLAUSIBLE_RANGE: Record<LabMarker, [number, number]> = {
  testosterone: [1, 400], free_testosterone: [0.1, 100], shbg: [1, 500], lh: [0.1, 200], fsh: [0.1, 200],
  amh: [0.01, 50], prolactin: [0.5, 500], tsh: [0.01, 100], fasting_glucose: [20, 600], fasting_insulin: [0.5, 300],
  homa_ir: [0.1, 50], hba1c: [3, 18], total_cholesterol: [50, 600], ldl: [10, 500], hdl: [5, 200],
  triglycerides: [20, 2000], vitamin_d: [1, 200], vitamin_b12: [50, 3000], ferritin: [1, 2000], dheas: [1, 1500],
  androstenedione: [0.05, 20], ohp17: [0.05, 50], glucose_2h: [30, 600], alt: [1, 1000], ast: [1, 1000],
  progesterone: [0.01, 200], estradiol: [5, 5000],
};

/** Lower-case, no accents, punctuation turned into spaces. */
function cleanLabel(label: string): string {
  return label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Order matters: the more specific patterns come first. `exact` means the label already says fasting / basal. */
const ALIASES: { re: RegExp; marker: LabMarker; assumed?: boolean }[] = [
  { re: /\b(17 ?oh|17 hidroxi|17 hydroxy)\b/, marker: 'ohp17' },
  { re: /\b(testosterona|testosterone)\b.*\b(libre|free)\b|\b(libre|free)\b.*\b(testosterona|testosterone)\b/, marker: 'free_testosterone' },
  { re: /\b(testosterona|testosterone)\b/, marker: 'testosterone' },
  { re: /\b(dhea ?s|dheas|sulfato de dehidroepiandrosterona|dehydroepiandrosterone sulfate)\b/, marker: 'dheas' },
  { re: /\b(androstenediona|androstenedione)\b/, marker: 'androstenedione' },
  { re: /\b(shbg|globulina fijadora)\b/, marker: 'shbg' },
  { re: /\b(amh|antimulleriana|anti mullerian)\b/, marker: 'amh' },
  { re: /\b(prolactina|prolactin)\b/, marker: 'prolactin' },
  { re: /\b(tsh|tirotropina|thyroid stimulating)\b/, marker: 'tsh' },
  { re: /\b(fsh|foliculo estimulante|follicle stimulating)\b/, marker: 'fsh' },
  { re: /\b(lh|luteinizante|luteinizing)\b/, marker: 'lh' },
  { re: /\b(progesterona|progesterone)\b/, marker: 'progesterone' },
  { re: /\b(estradiol|e2)\b/, marker: 'estradiol' },
  { re: /\b(homa)\b/, marker: 'homa_ir' },
  { re: /\b(hba1c|a1c|hemoglobina glicosilada|hemoglobina glicada|glycated|glycosylated)\b/, marker: 'hba1c' },
  { re: /\b(glucosa|glucose|glicemia|glucemia)\b.*\b(2 ?h|2 horas|2 hours|post ?carga|post ?prandial|ogtt|sobrecarga|tolerancia)\b|\b(ogtt|curva)\b.*\b(glucosa|glucose)\b/, marker: 'glucose_2h' },
  { re: /\b(glucosa|glucose|glicemia|glucemia)\b/, marker: 'fasting_glucose', assumed: true },
  { re: /\b(insulina|insulin)\b/, marker: 'fasting_insulin', assumed: true },
  { re: /\b(colesterol|cholesterol)\b.*\bldl\b|\bldl\b/, marker: 'ldl' },
  { re: /\b(colesterol|cholesterol)\b.*\bhdl\b|\bhdl\b/, marker: 'hdl' },
  { re: /\b(colesterol|cholesterol)\b/, marker: 'total_cholesterol' },
  { re: /\b(trigliceridos|triglycerides|triglicerido)\b/, marker: 'triglycerides' },
  { re: /\b(vitamina d|vitamin d|25 oh|25 hidroxi)\b/, marker: 'vitamin_d' },
  { re: /\b(b12|cobalamina|cobalamin)\b/, marker: 'vitamin_b12' },
  { re: /\b(ferritina|ferritin)\b/, marker: 'ferritin' },
  { re: /\b(alt|tgp|alanina|alanine)\b/, marker: 'alt' },
  { re: /\b(ast|tgo|aspartato|aspartate)\b/, marker: 'ast' },
];

/** Maps a printed label to a marker, or null when it is not one the app tracks. */
export function matchMarker(label: string): { marker: LabMarker; assumed: boolean } | null {
  const clean = cleanLabel(label);
  if (!clean) return null;
  for (const a of ALIASES) {
    if (!a.re.test(clean)) continue;
    // "Glucosa" or "Insulina" alone is read as fasting; the review screen shows it as doubtful.
    const says = /\b(ayunas|ayuno|fasting|basal)\b/.test(clean);
    return { marker: a.marker, assumed: !!a.assumed && !says };
  }
  return null;
}

/** Parses "5,4", "5.4" or 5.4. Rejects ranges and "<0.5" style bounds, which are not an exact value. */
export function parseLabValue(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!/^\d+(?:[.,]\d+)?$/.test(s)) return null;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function validIsoDate(s: unknown, today: string): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return false;
  return s <= today && y >= 1990;
}

/**
 * Turns the model's rows into rows the app can store: each one is assigned to a known marker,
 * converted to the canonical unit, and dropped when the value is implausible. Rows whose marker,
 * unit or date had to be guessed are kept and flagged `doubtful`.
 * `today` is the local date (YYYY-MM-DD) used for the fallback and to reject future dates.
 */
export function normalizeExtractedLabs(raw: unknown, today: string, fallbackDate: string = today): ExtractedLab[] {
  const list = Array.isArray(raw) ? raw : Array.isArray((raw as { rows?: unknown })?.rows) ? (raw as { rows: unknown[] }).rows : [];
  const out: ExtractedLab[] = [];
  const seen = new Set<string>();
  for (const item of list.slice(0, 80)) {
    if (!item || typeof item !== 'object') continue;
    const row = item as RawLabRow;
    const rawLabel = typeof row.label === 'string' ? row.label.trim().slice(0, 120) : '';
    const match = matchMarker(rawLabel);
    const value = parseLabValue(row.value);
    if (!match || value == null || value <= 0) continue;

    const info = markerInfo(match.marker);
    const unitText = typeof row.unit === 'string' ? row.unit.trim() : '';
    let doubtful = match.assumed;
    let canonical: number | null;
    if (!unitText) {
      canonical = value;
      doubtful = true;
    } else {
      canonical = convertToCanonical(match.marker, value, unitText);
      if (canonical == null) { canonical = value; doubtful = true; }
    }

    const [min, max] = PLAUSIBLE_RANGE[match.marker];
    if (canonical < min || canonical > max) continue;

    let date: string;
    if (validIsoDate(row.date, today)) date = row.date;
    else { date = fallbackDate; doubtful = true; }

    const key = `${match.marker}|${date}|${canonical}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ marker: match.marker, value: canonical, unit: info.unit, date, rawLabel, doubtful });
  }
  return out;
}
