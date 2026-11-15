import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * Ensures the request comes from a logged-in user.
 * Used by API routes that spend paid/limited third-party quota (Gemini, Spoonacular…)
 * so the keys can't be abused by anonymous callers.
 */
export async function requireUser(): Promise<
  { user: User; response?: never } | { user?: never; response: NextResponse }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user };
}

/** Returns a 500 response when a server-side env var is missing. */
export function missingKey(name: string) {
  console.error(`❌ ${name} is not set on the server`);
  return NextResponse.json({ error: `${name} is not configured` }, { status: 500 });
}
