import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function generateSecret(): string {
  return randomBytes(24).toString('hex');
}

/** GET: current webhook URL (requires token row). */
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
    .select('secret, created_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const basePath = `${origin}/api/health/webhook`;

  if (!data?.secret) {
    return NextResponse.json({
      configured: false,
      webhookUrlTemplate: `${basePath}?token=`,
      message: 'Generate a token below, then paste the full URL in HC Webhook.',
    });
  }

  return NextResponse.json({
    configured: true,
    webhookUrl: `${basePath}?token=${data.secret}`,
    secretPrefix: `${data.secret.slice(0, 6)}…`,
    created_at: data.created_at,
  });
}

/** POST: create or rotate token. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const secret = generateSecret();

  const { error } = await supabase.from('health_webhook_tokens').upsert(
    {
      user_id: user.id,
      secret,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const webhookUrl = `${origin}/api/health/webhook?token=${secret}`;

  return NextResponse.json({
    ok: true,
    webhookUrl,
    message: 'Copia esta URL en HC Webhook. Si la rotas, vuelve a pegar la nueva.',
  });
}
