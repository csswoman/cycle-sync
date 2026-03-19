import { NextResponse, type NextRequest } from 'next/server';

const FITBIT_SCOPES = 'activity heartrate sleep profile settings';

export async function GET(request: NextRequest) {
  const clientId = process.env.FITBIT_CLIENT_ID;
  const { origin } = request.nextUrl;
  const redirectUri = `${origin}/api/auth/fitbit/callback`;

  const scope = encodeURIComponent(FITBIT_SCOPES);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId!,
    redirect_uri: redirectUri,
    expires_in: '604800',
  });

  return NextResponse.redirect(
    `https://www.fitbit.com/oauth2/authorize?${params.toString()}&scope=${scope}`
  );
}
