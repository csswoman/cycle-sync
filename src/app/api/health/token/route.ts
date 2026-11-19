import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { isValidTimezone } from '@/lib/health/records';
import { hashWebhookSecret } from '@/lib/health/webhookToken';
import { serverError } from '@/lib/api/requireUser';

export const dynamic = 'force-dynamic';

function generateSecret(): string {
  return randomBytes(24).toString('hex');
}

/**
 * GET: whether a token exists. Only a hash is stored, so the full URL can't be shown again;
 * the user rotates the token to get a new one.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('health_webhook_tokens')
    .select('secret_prefix, created_at, timezone')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return serverError('health token', error.message, 'Could not load the token');
  }

  const origin = new URL(request.url).origin;
  const basePath = `${origin}/api/health/webhook`;

  if (!data) {
    return NextResponse.json({
      configured: false,
      webhookUrlTemplate: `${basePath}?token=`,
      message: 'Generate a token below, then paste the full URL in HC Webhook.',
    });
  }

  return NextResponse.json({
    configured: true,
    secretPrefix: data.secret_prefix ? `${data.secret_prefix}…` : null,
    created_at: data.created_at,
    timezone: data.timezone ?? null,
  });
}

/** POST: create or rotate token. The plain secret is returned only here, once. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const secret = generateSecret();
  const row: { user_id: string; secret_hash: string; secret_prefix: string; created_at: string; timezone?: string } = {
    user_id: user.id,
    secret_hash: hashWebhookSecret(secret),
    secret_prefix: secret.slice(0, 6),
    created_at: new Date().toISOString(),
  };
  if (isValidTimezone(body?.timezone)) row.timezone = body.timezone;

  const { error } = await supabase.from('health_webhook_tokens').upsert(row, { onConflict: 'user_id' });

  if (error) {
    return serverError('health token', error.message, 'Could not create the token');
  }

  const origin = new URL(request.url).origin;
  const webhookUrl = `${origin}/api/health/webhook?token=${secret}`;

  return NextResponse.json({
    ok: true,
    webhookUrl,
    secretPrefix: `${row.secret_prefix}…`,
    message: 'Copia esta URL en HC Webhook. Si la rotas, vuelve a pegar la nueva.',
  });
}

/** PATCH: set the timezone used to assign webhook data to local days. */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  if (!isValidTimezone(body?.timezone)) {
    return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
  }
  const { error } = await supabase
    .from('health_webhook_tokens')
    .update({ timezone: body.timezone })
    .eq('user_id', user.id);
  if (error) {
    return serverError('health token', error.message, 'Could not update the token');
  }
  return NextResponse.json({ ok: true });
}
