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

  const today = new Date().toISOString().split('T')[0];

  const batchSteps = (payload.steps ?? []).reduce((sum, s) => sum + (Number(s.count) || 0), 0);
  const batchDistance = (payload.distance ?? []).reduce((sum, d) => sum + (Number(d.meters) || 0), 0);
  const batchActiveCal = (payload.active_calories ?? []).reduce((sum, c) => sum + (Number(c.calories) || 0), 0);
  const batchTotalCal = (payload.total_calories ?? []).reduce((sum, c) => sum + (Number(c.calories) || 0), 0);

  const restingFromBatch =
    payload.resting_heart_rate?.length ?
      [...payload.resting_heart_rate].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      )[0].bpm
    : null;

  const avgFromBatch =
    payload.heart_rate?.length ?
      Math.round(
        payload.heart_rate.reduce((sum, h) => sum + h.bpm, 0) / payload.heart_rate.length
      )
    : null;

  const latestSleep =
    payload.sleep?.length ?
      [...payload.sleep].sort(
        (a, b) =>
          new Date(b.session_end_time).getTime() - new Date(a.session_end_time).getTime()
      )[0]
    : null;

  const latestWeight =
    payload.weight?.length ?
      [...payload.weight].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      )[0].kilograms
    : null;

  const { data: existing } = await admin
    .from('health_data')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  const mergedSteps = (existing?.steps ?? 0) + batchSteps;
  const mergedDistance = (existing?.distance_meters ?? 0) + batchDistance;
  const mergedActiveCal = (existing?.active_calories ?? 0) + batchActiveCal;
  const mergedTotalCal = (existing?.total_calories ?? 0) + batchTotalCal;

  const restingHR = restingFromBatch ?? existing?.resting_heart_rate ?? null;
  const avgHR = avgFromBatch ?? existing?.avg_heart_rate ?? null;

  const sleepSeconds = Math.max(
    existing?.sleep_duration_seconds ?? 0,
    latestSleep?.duration_seconds ?? 0
  );
  const sleepStages = latestSleep?.stages?.length ? latestSleep.stages : existing?.sleep_stages ?? null;

  const weightKg = latestWeight ?? existing?.weight_kg ?? null;

  const { error } = await admin.from('health_data').upsert(
    {
      user_id: userId,
      date: today,
      steps: mergedSteps,
      distance_meters: mergedDistance,
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
    },
    { onConflict: 'user_id,date' }
  );

  if (error) {
    console.error('Failed to save health data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    date: today,
    merged: {
      steps: mergedSteps,
      distance_meters: mergedDistance,
      active_calories: mergedActiveCal,
    },
  });
}
