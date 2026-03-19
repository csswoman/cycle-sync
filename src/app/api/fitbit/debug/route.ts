import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: tokenData, error: tokenError } = await supabase
    .from('fitbit_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: 'No Fitbit tokens found', details: tokenError?.message }, { status: 404 });
  }

  const results: Record<string, any> = {
    token_exists: true,
    fitbit_user_id: tokenData.fitbit_user_id,
    expires_at: tokenData.expires_at,
    is_expired: new Date(tokenData.expires_at) <= new Date(),
  };

  const today = new Date().toISOString().split('T')[0];
  results.date_used = today;

  const endpoints = [
    { name: 'steps', url: `/1/user/-/activities/steps/date/${today}/1d.json` },
    { name: 'heart', url: `/1/user/-/activities/heart/date/${today}/1d.json` },
    { name: 'sleep', url: `/1.2/user/-/sleep/date/${today}.json` },
    { name: 'activities', url: `/1/user/-/activities/date/${today}.json` },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`https://api.fitbit.com${ep.url}`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        cache: 'no-store',
      });
      const body = await res.text();
      results[ep.name] = {
        status: res.status,
        data: res.ok ? JSON.parse(body) : body,
      };
    } catch (e: any) {
      results[ep.name] = { error: e.message };
    }
  }

  return NextResponse.json(results, { headers: { 'Cache-Control': 'no-store' } });
}
