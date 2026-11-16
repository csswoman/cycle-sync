import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidTimezone, normalizePayload, recomputeDays, upsertRecords } from '@/lib/health/records';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 5 * 1024 * 1024;

function extractToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  const h = request.headers.get('x-webhook-token');
  if (h) return h.trim();
  // Query-string tokens end up in access logs; kept only because HC Webhook
  // may not be able to send headers.
  const q = request.nextUrl.searchParams.get('token');
  if (q) return q.trim();
  return null;
}

export async function POST(request: NextRequest) {
  let admin;
  try {
    admin = createAdminClient();
  } catch (e: any) {
    console.error('Health webhook: admin client failed', e.message);
    return NextResponse.json(
      {
        error: 'Server misconfiguration',
        hint: 'Add SUPABASE_SERVICE_ROLE_KEY to Vercel env (Settings → API → service_role in Supabase dashboard).',
      },
      { status: 503 }
    );
  }

  const token = extractToken(request);
  if (!token) {
    return NextResponse.json(
      {
        error: 'Missing token',
        hint: 'Use URL ?token=YOUR_SECRET or Authorization: Bearer YOUR_SECRET',
      },
      { status: 401 }
    );
  }

  const { data: tokenRow, error: tokenErr } = await admin
    .from('health_webhook_tokens')
    .select('user_id, timezone')
    .eq('secret', token)
    .maybeSingle();

  if (tokenErr || !tokenRow?.user_id) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const userId = tokenRow.user_id as string;
  const tz = isValidTimezone(tokenRow.timezone) ? tokenRow.timezone : 'UTC';

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let payload: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }
    payload = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const records = normalizePayload(payload, tz);
  if (records.length === 0) {
    return NextResponse.json({ success: true, message: 'No data to process' });
  }

  const saved = await upsertRecords(admin, userId, records);
  if (saved.error) {
    console.error('Failed to save health records:', saved.error);
    return NextResponse.json({ error: saved.error }, { status: 500 });
  }

  const dates = Array.from(new Set(records.map((r) => r.local_date)));
  const recomputed = await recomputeDays(admin, userId, dates);
  if (recomputed.error) {
    console.error('Failed to recompute health data:', recomputed.error);
    return NextResponse.json({ error: recomputed.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, records: records.length, dates, timezone: tz });
}
