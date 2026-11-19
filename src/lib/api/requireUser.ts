import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { AI_CONSENT_KEY } from '@/lib/ai/consentKey';

type Guard = { user: User; response?: never } | { user?: never; response: NextResponse };

/** AI requests one user may make per day (all AI endpoints together). */
const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 150;

/**
 * Ensures the request comes from a logged-in user.
 * Used by API routes that spend paid/limited third-party quota (Gemini, Spoonacular…)
 * so the keys can't be abused by anonymous callers.
 */
export async function requireUser(): Promise<Guard> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user };
}

/**
 * For routes that send user data to Google Gemini: the user must be logged in,
 * must have accepted the AI data notice, and must be under the daily quota.
 */
export async function requireAiUser(): Promise<Guard> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!user.user_metadata?.[AI_CONSENT_KEY]) {
    return {
      response: NextResponse.json(
        { error: 'AI consent required', code: 'ai_consent_required' },
        { status: 403 }
      ),
    };
  }

  const { data: allowed, error } = await supabase.rpc('consume_ai_quota', { p_limit: AI_DAILY_LIMIT });
  if (error) {
    console.error('consume_ai_quota failed:', error.message);
    return { response: NextResponse.json({ error: 'AI is temporarily unavailable' }, { status: 503 }) };
  }
  if (!allowed) {
    return {
      response: NextResponse.json(
        { error: 'Daily AI limit reached. Try again tomorrow.', code: 'ai_quota_exceeded' },
        { status: 429 }
      ),
    };
  }
  return { user };
}

/** Returns a 500 response when a server-side env var is missing (name only goes to the server log). */
export function missingKey(name: string) {
  console.error(`❌ ${name} is not set on the server`);
  return NextResponse.json({ error: 'Service not configured' }, { status: 500 });
}

/** Logs the real error on the server and returns a generic message to the client. */
export function serverError(context: string, error: unknown, message = 'Something went wrong', status = 500) {
  console.error(`${context}:`, error);
  return NextResponse.json({ error: message }, { status });
}
