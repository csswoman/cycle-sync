import { NextResponse } from 'next/server';
import { requireUser, missingKey } from '@/lib/api/requireUser';
import { chat, type ChatHistory } from '@/lib/ai/gemini.server';

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
    const text = await chat(message, history, language);
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: error?.message || 'AI request failed' }, { status: 502 });
  }
}
