import type { SupabaseClient } from '@supabase/supabase-js';

export type HealthMetric =
  | 'steps'
  | 'distance'
  | 'active_calories'
  | 'total_calories'
  | 'heart_rate'
  | 'resting_heart_rate'
  | 'sleep'
  | 'weight'
  | 'activity';

export type HealthSource = 'health_connect' | 'manual';

export interface HealthRecord {
  metric: HealthMetric;
  source: HealthSource;
  start_time: string;
  end_time: string;
  value: number;
  local_date: string;
  details?: Record<string, unknown> | null;
}

export interface DayAggregate {
  date: string;
  steps: number;
  distance_meters: number;
  active_calories: number;
  total_calories: number;
  active_minutes: number;
  resting_heart_rate: number | null;
  avg_heart_rate: number | null;
  sleep_duration_seconds: number;
  sleep_stages: unknown;
  weight_kg: number | null;
  source: HealthSource;
}

const MAX_ITEMS_PER_METRIC = 10000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EXPLICIT_OFFSET_RE = /[+-]\d{2}:?\d{2}$/;

export function isValidDateString(s: unknown): s is string {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

export function isValidTimezone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Calendar date (YYYY-MM-DD) of `date` as seen in `tz`. */
export function dateInTimezone(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Local calendar date of a timestamp. If the string carries an explicit
 * non-UTC offset (e.g. -05:00) that wall-clock date is used; otherwise
 * (UTC "Z" or no offset) the instant is converted to `tz`.
 */
export function localDate(iso: string, tz: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  if (EXPLICIT_OFFSET_RE.test(iso) && !/([+-]00:?00)$/.test(iso)) {
    const day = iso.slice(0, 10);
    if (DATE_RE.test(day)) return day;
  }
  return dateInTimezone(d, tz);
}

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function asArray(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, MAX_ITEMS_PER_METRIC)
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object');
}

function toIso(v: unknown): string | null {
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Turns an HC Webhook payload into validated, de-duplicated records. */
export function normalizePayload(payload: unknown, tz: string): HealthRecord[] {
  const p = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  const out = new Map<string, HealthRecord>();

  const add = (r: Omit<HealthRecord, 'source'>) => {
    const key = `${r.metric}|${r.start_time}|${r.end_time}`;
    out.set(key, { ...r, source: 'health_connect' });
  };

  const interval = (
    metric: HealthMetric,
    list: unknown,
    valueKey: string,
    min: number,
    max: number
  ) => {
    for (const item of asArray(list)) {
      const start = toIso(item.start_time);
      const end = toIso(item.end_time) ?? start;
      const value = num(item[valueKey]);
      if (!start || !end || value === null || value < min || value > max) continue;
      const day = localDate(String(item.start_time), tz);
      if (!day) continue;
      add({ metric, start_time: start, end_time: end, value, local_date: day });
    }
  };

  const point = (metric: HealthMetric, list: unknown, valueKey: string, min: number, max: number) => {
    for (const item of asArray(list)) {
      const at = toIso(item.time);
      const value = num(item[valueKey]);
      if (!at || value === null || value < min || value > max) continue;
      const day = localDate(String(item.time), tz);
      if (!day) continue;
      add({ metric, start_time: at, end_time: at, value, local_date: day });
    }
  };

  interval('steps', p.steps, 'count', 0, 200000);
  interval('distance', p.distance, 'meters', 0, 1000000);
  interval('active_calories', p.active_calories, 'calories', 0, 20000);
  interval('total_calories', p.total_calories, 'calories', 0, 30000);
  point('heart_rate', p.heart_rate, 'bpm', 20, 250);
  point('resting_heart_rate', p.resting_heart_rate, 'bpm', 20, 250);
  point('weight', p.weight, 'kilograms', 20, 500);

  for (const item of asArray(p.sleep)) {
    const end = toIso(item.session_end_time);
    const seconds = num(item.duration_seconds);
    if (!end || seconds === null || seconds <= 0 || seconds > 24 * 3600) continue;
    const start =
      toIso(item.session_start_time) ?? new Date(new Date(end).getTime() - seconds * 1000).toISOString();
    const day = localDate(String(item.session_end_time), tz);
    if (!day) continue;
    add({
      metric: 'sleep',
      start_time: start,
      end_time: end,
      value: seconds,
      local_date: day,
      details: Array.isArray(item.stages) ? { stages: item.stages } : null,
    });
  }

  return Array.from(out.values());
}

function sum(records: HealthRecord[]): number {
  return records.reduce((a, r) => a + r.value, 0);
}

/** Device total when present, otherwise the manual total. */
function preferDevice(device: number, manual: number): number {
  return device > 0 ? device : manual;
}

function latest(records: HealthRecord[]): HealthRecord | undefined {
  return records.reduce<HealthRecord | undefined>(
    (best, r) => (!best || r.start_time > best.start_time ? r : best),
    undefined
  );
}

/** Builds the daily summary for `date` from that day's records. */
export function aggregateDay(date: string, records: HealthRecord[]): DayAggregate {
  const of = (metric: HealthMetric, source?: HealthSource) =>
    records.filter((r) => r.metric === metric && (!source || r.source === source));

  const dev = (m: HealthMetric) => sum(of(m, 'health_connect'));
  const man = (m: HealthMetric) => sum(of(m, 'manual'));

  const manualActivityKcal = of('activity', 'manual').reduce(
    (a, r) => a + (num(r.details?.kcal) ?? 0),
    0
  );

  const deviceSleep = of('sleep', 'health_connect');
  const longestDeviceSleep = deviceSleep.reduce<HealthRecord | undefined>(
    (best, r) => (!best || r.value > best.value ? r : best),
    undefined
  );
  const manualSleepSeconds = man('sleep');

  const hr = of('heart_rate', 'health_connect');
  const restingRec = latest(of('resting_heart_rate', 'health_connect')) ?? latest(of('resting_heart_rate', 'manual'));
  const weightRec = latest(of('weight'));

  const hasDevice = records.some((r) => r.source === 'health_connect');

  return {
    date,
    steps: Math.round(preferDevice(dev('steps'), man('steps'))),
    distance_meters: preferDevice(dev('distance'), man('distance')),
    active_calories: preferDevice(dev('active_calories'), manualActivityKcal + man('active_calories')),
    total_calories: preferDevice(dev('total_calories'), man('total_calories')),
    active_minutes: Math.round(sum(of('activity'))),
    resting_heart_rate: restingRec ? Math.round(restingRec.value) : null,
    avg_heart_rate: hr.length ? Math.round(sum(hr) / hr.length) : null,
    sleep_duration_seconds: Math.round(
      longestDeviceSleep ? longestDeviceSleep.value : manualSleepSeconds
    ),
    sleep_stages: longestDeviceSleep?.details?.stages ?? null,
    weight_kg: weightRec ? weightRec.value : null,
    source: hasDevice ? 'health_connect' : 'manual',
  };
}

const CHUNK = 500;

/** Inserts records, ignoring re-sent ones with the same key. */
export async function upsertRecords(
  client: SupabaseClient,
  userId: string,
  records: HealthRecord[]
): Promise<{ error: string | null }> {
  for (let i = 0; i < records.length; i += CHUNK) {
    const rows = records.slice(i, i + CHUNK).map((r) => ({
      user_id: userId,
      metric: r.metric,
      source: r.source,
      start_time: r.start_time,
      end_time: r.end_time,
      value: r.value,
      local_date: r.local_date,
      details: r.details ?? null,
    }));
    const { error } = await client
      .from('health_records')
      .upsert(rows, { onConflict: 'user_id,metric,source,start_time,end_time' });
    if (error) return { error: error.message };
  }
  return { error: null };
}

/** Recomputes health_data rows for the given dates from health_records. */
export async function recomputeDays(
  client: SupabaseClient,
  userId: string,
  dates: string[]
): Promise<{ error: string | null }> {
  const unique = Array.from(new Set(dates));
  if (!unique.length) return { error: null };

  const { data, error } = await client
    .from('health_records')
    .select('metric, source, start_time, end_time, value, local_date, details')
    .eq('user_id', userId)
    .in('local_date', unique);
  if (error) return { error: error.message };

  const byDate = new Map<string, HealthRecord[]>();
  for (const r of (data ?? []) as HealthRecord[]) {
    const list = byDate.get(r.local_date) ?? [];
    list.push(r);
    byDate.set(r.local_date, list);
  }

  const rows = [];
  const empty: string[] = [];
  for (const date of unique) {
    const recs = byDate.get(date);
    if (!recs?.length) {
      empty.push(date);
      continue;
    }
    rows.push({
      user_id: userId,
      ...aggregateDay(date, recs),
      synced_at: new Date().toISOString(),
    });
  }

  if (rows.length) {
    const { error: upErr } = await client.from('health_data').upsert(rows, { onConflict: 'user_id,date' });
    if (upErr) return { error: upErr.message };
  }
  if (empty.length) {
    const { error: delErr } = await client
      .from('health_data')
      .delete()
      .eq('user_id', userId)
      .in('date', empty);
    if (delErr) return { error: delErr.message };
  }
  return { error: null };
}
