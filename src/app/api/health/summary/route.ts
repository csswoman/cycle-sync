import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('health_data')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { connected: false },
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
    resting_heart_rate: data.resting_heart_rate ?? null,
    avg_heart_rate: data.avg_heart_rate ?? null,
    sleep_duration_seconds: data.sleep_duration_seconds ?? 0,
    sleep_stages: data.sleep_stages ?? null,
    weight_kg: data.weight_kg ?? null,
    synced_at: data.synced_at,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
