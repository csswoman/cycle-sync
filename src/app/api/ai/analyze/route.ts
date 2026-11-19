import { NextResponse } from 'next/server';
import { requireAiUser, missingKey } from '@/lib/api/requireUser';
import { analyzeMedia, generateJson } from '@/lib/ai/gemini.server';

export const dynamic = 'force-dynamic';
// Video analysis can take a while.
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireAiUser();
  if (auth.response) return auth.response;
  if (!process.env.GEMINI_API_KEY) return missingKey('GEMINI_API_KEY');

  const body = await request.json().catch(() => null);
  const media = typeof body?.media === 'string' ? body.media : '';
  const kind = body?.kind === 'video' ? 'video' : 'image';
  const prompt =
    typeof body?.prompt === 'string' && body.prompt.trim()
      ? body.prompt
      : kind === 'video'
        ? 'Analyze this video for exercise form or health context.'
        : 'Analyze this image for health insights.';

  if (!media.startsWith('data:')) {
    return NextResponse.json({ error: 'media must be a base64 data URL' }, { status: 400 });
  }

  try {
    const text = body?.format === 'json' ? await generateJson(prompt, media) : await analyzeMedia(media, prompt);
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error(`AI ${kind} analysis error:`, error);
    return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
  }
}
