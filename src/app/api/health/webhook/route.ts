import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface StepRecord {
  count: number;
  start_time: string;
  end_time: string;
}

interface SleepStage {
  stage: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
}

interface SleepRecord {
  session_end_time: string;
  duration_seconds: number;
  stages: SleepStage[];
}

interface HeartRateRecord {
  bpm: number;
  time: string;
}

interface RestingHeartRateRecord {
  bpm: number;
  time: string;
}

interface DistanceRecord {
  meters: number;
  start_time: string;
  end_time: string;
}
interface CalorieRecord {
  calories: number;
  start_time: string;
  end_time: string;
}

interface WeightRecord {
  kilograms: number;
  time: string;
}

interface HealthPayload {
  timestamp: string;
  app_version?: string;
  steps?: StepRecord[];
  sleep?: SleepRecord[];
  heart_rate?: HeartRateRecord[];
  resting_heart_rate?: RestingHeartRateRecord[];
  distance?: DistanceRecord[];
  active_calories?: CalorieRecord[];
  total_calories?: CalorieRecord[];
  weight?: WeightRecord[];
}

function extractToken(request: NextRequest): string | null {
  const q = request.nextUrl.searchParams.get('token');
  if (q) return q.trim();
  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  const h = request.headers.get('x-webhook-token');
  if (h) return h.trim();
  return null;
}

export async function POST(request: NextRequest) {
  let admin;
  try {
    admin = createAdminClient();
  } catch (e: any) {
    console.error('Health webhook: admin client failed', e.message);
    return NextResponse.json(
      {
        error: 'Server misconfiguration',
        hint: 'Add SUPABASE_SERVICE_ROLE_KEY to Vercel env (Settings → API → service_role in Supabase dashboard).',
      },
      { status: 503 }
    );
  }

  const token = extractToken(request);
  if (!token) {
    return NextResponse.json(
      {
        error: 'Missing token',
        hint: 'Use URL ?token=YOUR_SECRET or Authorization: Bearer YOUR_SECRET',
      },
      { status: 401 }
    );
  }

  const { data: tokenRow, error: tokenErr } = await admin
    .from('health_webhook_tokens')
    .select('user_id')
    .eq('secret', token)
    .maybeSingle();

  if (tokenErr || !tokenRow?.user_id) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const userId = tokenRow.user_id;

  let payload: HealthPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const getDate = (iso: string) => iso.split('T')[0];

  const stepsByDate: Record<string, number> = {};
  for (const s of payload.steps ?? []) {
    const date = getDate(s.start_time);
    stepsByDate[date] = (stepsByDate[date] ?? 0) + (Number(s.count) || 0);
  }

  const distanceByDate: Record<string, number> = {};
  for (const d of payload.distance ?? []) {
    const date = getDate(d.start_time);
    distanceByDate[date] = (distanceByDate[date] ?? 0) + (Number(d.meters) || 0);
  }

  const activeCalByDate: Record<string, number> = {};
  for (const c of payload.active_calories ?? []) {
    const date = getDate(c.start_time);
    activeCalByDate[date] = (activeCalByDate[date] ?? 0) + (Number(c.calories) || 0);
  }

  const totalCalByDate: Record<string, number> = {};
  for (const c of payload.total_calories ?? []) {
    const date = getDate(c.start_time);
    totalCalByDate[date] = (totalCalByDate[date] ?? 0) + (Number(c.calories) || 0);
  }

  const restingHRByDate: Record<string, number> = {};
  for (const h of payload.resting_heart_rate ?? []) {
    const date = getDate(h.time);
    restingHRByDate[date] = h.bpm;
  }

  const avgHRByDate: Record<string, number[]> = {};
  for (const h of payload.heart_rate ?? []) {
    const date = getDate(h.time);
    if (!avgHRByDate[date]) avgHRByDate[date] = [];
    avgHRByDate[date].push(h.bpm);
  }

  const sleepByDate: Record<string, SleepRecord> = {};
  for (const s of payload.sleep ?? []) {
    const date = getDate(s.session_end_time);
    const existing = sleepByDate[date];
    if (!existing || s.duration_seconds > existing.duration_seconds) {
      sleepByDate[date] = s;
    }
  }

  const weightByDate: Record<string, number> = {};
  for (const w of payload.weight ?? []) {
    const date = getDate(w.time);
    weightByDate[date] = w.kilograms;
  }

  const allDates = new Set<string>([
    ...Object.keys(stepsByDate),
    ...Object.keys(distanceByDate),
    ...Object.keys(activeCalByDate),
    ...Object.keys(totalCalByDate),
    ...Object.keys(restingHRByDate),
    ...Object.keys(avgHRByDate),
    ...Object.keys(sleepByDate),
    ...Object.keys(weightByDate),
  ]);

  if (allDates.size === 0) {
    return NextResponse.json({ success: true, message: 'No data to process' });
  }

  const { data: existingRows } = await admin
    .from('health_data')
    .select('*')
    .eq('user_id', userId)
    .in('date', Array.from(allDates));

  const existingByDate = new Map(
    (existingRows ?? []).map((r) => [r.date, r])
  );

  const rows: Array<Record<string, unknown>> = [];

  for (const date of allDates) {
    const ex = existingByDate.get(date);
    const batchSteps = stepsByDate[date] ?? 0;
    const batchDist = distanceByDate[date] ?? 0;
    const batchActiveCal = activeCalByDate[date] ?? 0;
    const batchTotalCal = totalCalByDate[date] ?? 0;

    const mergedSteps = (ex?.steps ?? 0) + batchSteps;
    const mergedDist = (ex?.distance_meters ?? 0) + batchDist;
    const mergedActiveCal = (ex?.active_calories ?? 0) + batchActiveCal;
    const mergedTotalCal = (ex?.total_calories ?? 0) + batchTotalCal;

    const restingHR = restingHRByDate[date] ?? ex?.resting_heart_rate ?? null;
    const hrList = avgHRByDate[date];
    const avgHR = hrList?.length
      ? Math.round(hrList.reduce((a, b) => a + b, 0) / hrList.length)
      : ex?.avg_heart_rate ?? null;

    const sleep = sleepByDate[date];
    const sleepSeconds = sleep
      ? Math.max(ex?.sleep_duration_seconds ?? 0, sleep.duration_seconds)
      : ex?.sleep_duration_seconds ?? 0;
    const sleepStages = sleep?.stages?.length ? sleep.stages : ex?.sleep_stages ?? null;

    const weightKg = weightByDate[date] ?? ex?.weight_kg ?? null;

    rows.push({
      user_id: userId,
      date,
      steps: mergedSteps,
      distance_meters: mergedDist,
      active_calories: mergedActiveCal,
      total_calories: mergedTotalCal,
      resting_heart_rate: restingHR,
      avg_heart_rate: avgHR,
      sleep_duration_seconds: sleepSeconds,
      sleep_stages: sleepStages,
      weight_kg: weightKg,
      source: 'health_connect',
      raw_payload: payload as unknown as Record<string, unknown>,
      synced_at: new Date().toISOString(),
    });
  }

  const { error } = await admin
    .from('health_data')
    .upsert(rows, { onConflict: 'user_id,date' });

  if (error) {
    console.error('Failed to save health data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    dates: Array.from(allDates),
    merged: Object.fromEntries(
      rows.map((r) => [r.date, { steps: r.steps, distance_meters: r.distance_meters }])
    ),
  });
}
