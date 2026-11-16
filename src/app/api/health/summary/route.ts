import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dateInTimezone, isValidDateString, isValidTimezone } from '@/lib/health/records';

export const dynamic = 'force-dynamic';

/**
 * GET ?date=YYYY-MM-DD (client's local day) or ?tz=America/Bogota.
 * Falls back to the stored webhook timezone, then UTC.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  let day = params.get('date');
  if (!isValidDateString(day)) {
    let tz = params.get('tz');
    if (!isValidTimezone(tz)) {
      const { data: tokenRow } = await supabase
        .from('health_webhook_tokens')
        .select('timezone')
        .eq('user_id', user.id)
        .maybeSingle();
      tz = isValidTimezone(tokenRow?.timezone) ? tokenRow!.timezone : 'UTC';
    }
    day = dateInTimezone(new Date(), tz);
  }

  const { data, error } = await supabase
    .from('health_data')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', day)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { connected: false, date: day },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json({
    connected: true,
    date: data.date,
    steps: data.steps ?? 0,
    distance_meters: data.distance_meters ?? 0,
    active_calories: data.active_calories ?? 0,
    total_calories: data.total_calories ?? 0,
    active_minutes: data.active_minutes ?? 0,
    resting_heart_rate: data.resting_heart_rate ?? null,
    avg_heart_rate: data.avg_heart_rate ?? null,
    sleep_duration_seconds: data.sleep_duration_seconds ?? 0,
    sleep_stages: data.sleep_stages ?? null,
    weight_kg: data.weight_kg ?? null,
    source: data.source ?? null,
    synced_at: data.synced_at,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
