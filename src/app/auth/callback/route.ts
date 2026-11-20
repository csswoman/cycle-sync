import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const type = searchParams.get('type');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // shortcut: exchange fails when the link opens in another browser/app than the signup (no PKCE verifier cookie);
  // Supabase already confirmed the email by then, so tell the user to sign in instead of failing silently.
  return NextResponse.redirect(`${origin}/login${type === 'recovery' ? '' : '?confirmed=1'}`);
}
