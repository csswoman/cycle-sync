import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFitbitDailySummary } from '@/services/fitbitService';

async function getValidAccessToken(supabase: any, userId: string): Promise<string | null> {
  const { data: tokenData } = await supabase
    .from('fitbit_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!tokenData) return null;

  const isExpired = new Date(tokenData.expires_at) <= new Date();

  if (!isExpired) {
    return tokenData.access_token;
  }

  const clientId = process.env.FITBIT_CLIENT_ID!;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET!;

  const response = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenData.refresh_token,
    }),
  });

  if (!response.ok) {
    await supabase.from('fitbit_tokens').delete().eq('user_id', userId);
    return null;
  }

  const tokens = await response.json();

  await supabase
    .from('fitbit_tokens')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq('user_id', userId);

  return tokens.access_token;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = await getValidAccessToken(supabase, user.id);

  if (!accessToken) {
    return NextResponse.json({ error: 'Fitbit not connected' }, { status: 404 });
  }

  try {
    const summary = await getFitbitDailySummary(accessToken);
    return NextResponse.json(summary);
  } catch (err: any) {
    if (err.message === 'FITBIT_TOKEN_EXPIRED') {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch Fitbit data' }, { status: 500 });
  }
}
