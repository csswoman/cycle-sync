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
    .select('access_token')
    .eq('user_id', user.id)
    .single();

  if (tokenData) {
    await fetch('https://api.fitbit.com/oauth2/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({ token: tokenData.access_token }),
    }).catch(() => {});
  }

  await supabase.from('fitbit_tokens').delete().eq('user_id', user.id);

  return NextResponse.json({ success: true });
}
