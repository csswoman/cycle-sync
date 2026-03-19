import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${origin}/settings?fitbit=error`);
  }

  const clientId = process.env.FITBIT_CLIENT_ID!;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET!;
  const redirectUri = `${origin}/api/auth/fitbit/callback`;

  try {
    const tokenResponse = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Fitbit token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(`${origin}/settings?fitbit=error`);
    }

    const tokens = await tokenResponse.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${origin}/login`);
    }

    const { error: upsertError } = await supabase
      .from('fitbit_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        fitbit_user_id: tokens.user_id,
        scope: tokens.scope,
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Failed to store Fitbit tokens:', upsertError);
      return NextResponse.redirect(`${origin}/settings?fitbit=error`);
    }

    return NextResponse.redirect(`${origin}/settings?fitbit=connected`);
  } catch (err) {
    console.error('Fitbit OAuth error:', err);
    return NextResponse.redirect(`${origin}/settings?fitbit=error`);
  }
}
