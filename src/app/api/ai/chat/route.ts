import { NextResponse } from 'next/server';
import { requireUser, missingKey } from '@/lib/api/requireUser';
import { chat, type ChatHistory } from '@/lib/ai/gemini.server';
import { createClient } from '@/lib/supabase/server';
import { formatUserContext, loadUserContext, validCycleDay, validDate, validPhase } from '@/lib/ai/userContext.server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  if (!process.env.GEMINI_API_KEY) return missingKey('GEMINI_API_KEY');

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const history: ChatHistory = Array.isArray(body?.history) ? body.history : [];
  const language = body?.language === 'es' ? 'es' : 'en';

  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  try {
    // Personal context is optional: if loading it fails the chat still answers.
    let userContext = '';
    try {
      const supabase = await createClient();
      const data = await loadUserContext(supabase, auth.user.id, {
        phase: validPhase(body?.cycle?.phase),
        cycleDay: validCycleDay(body?.cycle?.cycleDay),
        today: validDate(body?.today),
      });
      userContext = formatUserContext(data, language);
    } catch (err) {
      console.warn('Could not load chat context:', err);
    }
    const text = await chat(message, history, language, userContext);
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: error?.message || 'AI request failed' }, { status: 502 });
  }
}
