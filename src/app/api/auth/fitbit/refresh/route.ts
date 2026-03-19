import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: tokenData } = await supabase
    .from('fitbit_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!tokenData) {
    return NextResponse.json({ error: 'No Fitbit connection found' }, { status: 404 });
  }

  const clientId = process.env.FITBIT_CLIENT_ID!;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET!;

  try {
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
      await supabase.from('fitbit_tokens').delete().eq('user_id', user.id);
      return NextResponse.json({ error: 'Token refresh failed. Please reconnect.' }, { status: 401 });
    }

    const tokens = await response.json();

    await supabase
      .from('fitbit_tokens')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      })
      .eq('user_id', user.id);

    return NextResponse.json({ access_token: tokens.access_token });
  } catch {
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 500 });
  }
}
