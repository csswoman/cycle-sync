import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  isValidDateString,
  recomputeDays,
  upsertRecords,
  type HealthRecord,
} from '@/lib/health/records';

export const dynamic = 'force-dynamic';

const MANUAL_METRICS = ['steps', 'sleep', 'activity'];

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function positive(v: unknown, max: number): number | null {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= max ? n : null;
}

/** GET ?days=14: recent manual entries (newest first). */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const days = Math.min(Math.max(Number(request.nextUrl.searchParams.get('days')) || 14, 1), 90);
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('health_records')
    .select('id, metric, local_date, start_time, value, details')
    .eq('user_id', user.id)
    .eq('source', 'manual')
    .in('metric', MANUAL_METRICS)
    .gte('local_date', since)
    .order('local_date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

/**
 * POST body:
 *  { type: 'steps', date, steps }                      one value per day (replaces)
 *  { type: 'sleep', date, hours?, minutes? }           date = wake-up day, one per day (replaces)
 *  { type: 'activity', date, start, minutes, activity_type, kcal? }  start = ISO instant
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return bad('Invalid JSON');
  if (!isValidDateString(body.date)) return bad('Invalid date');
  const date: string = body.date;

  let record: HealthRecord;

  if (body.type === 'steps') {
    const steps = positive(body.steps, 200000);
    if (steps === null) return bad('Invalid steps');
    record = {
      metric: 'steps',
      source: 'manual',
      start_time: `${date}T00:00:00.000Z`,
      end_time: `${date}T23:59:59.999Z`,
      value: Math.round(steps),
      local_date: date,
    };
  } else if (body.type === 'sleep') {
    const hours = Number(body.hours ?? 0);
    const minutes = Number(body.minutes ?? 0);
    const seconds = Math.round((hours * 60 + minutes) * 60);
    if (!Number.isFinite(seconds) || hours < 0 || minutes < 0 || seconds <= 0 || seconds > 24 * 3600) {
      return bad('Invalid sleep duration');
    }
    record = {
      metric: 'sleep',
      source: 'manual',
      start_time: `${date}T00:00:00.000Z`,
      end_time: `${date}T23:59:59.999Z`,
      value: seconds,
      local_date: date,
    };
  } else if (body.type === 'activity') {
    const minutes = positive(body.minutes, 1440);
    const start = new Date(body.start);
    const activityType = typeof body.activity_type === 'string' ? body.activity_type.trim().slice(0, 60) : '';
    if (minutes === null) return bad('Invalid minutes');
    if (Number.isNaN(start.getTime())) return bad('Invalid start');
    if (!activityType) return bad('Missing activity type');
    const kcal = body.kcal === undefined || body.kcal === '' || body.kcal === null ? null : positive(body.kcal, 20000);
    if (body.kcal !== undefined && body.kcal !== '' && body.kcal !== null && kcal === null) {
      return bad('Invalid kcal');
    }
    record = {
      metric: 'activity',
      source: 'manual',
      start_time: start.toISOString(),
      end_time: new Date(start.getTime() + minutes * 60000).toISOString(),
      value: minutes,
      local_date: date,
      details: { type: activityType, ...(kcal !== null ? { kcal } : {}) },
    };
  } else {
    return bad('Unsupported type');
  }

  // steps/sleep keep one manual row per day: remove the old value first so
  // editing a day replaces it even if the shape of the key ever changes.
  if (record.metric === 'steps' || record.metric === 'sleep') {
    const { error: delErr } = await supabase
      .from('health_records')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'manual')
      .eq('metric', record.metric)
      .eq('local_date', date);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  const saved = await upsertRecords(supabase, user.id, [record]);
  if (saved.error) return NextResponse.json({ error: saved.error }, { status: 500 });

  const recomputed = await recomputeDays(supabase, user.id, [date]);
  if (recomputed.error) return NextResponse.json({ error: recomputed.error }, { status: 500 });

  return NextResponse.json({ ok: true });
}

/** DELETE ?id=<uuid>: removes one manual entry. */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = request.nextUrl.searchParams.get('id');
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return bad('Invalid id');

  const { data, error } = await supabase
    .from('health_records')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('source', 'manual')
    .select('local_date')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const recomputed = await recomputeDays(supabase, user.id, [data.local_date as string]);
  if (recomputed.error) return NextResponse.json({ error: recomputed.error }, { status: 500 });

  return NextResponse.json({ ok: true });
}
