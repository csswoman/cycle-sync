import { NextResponse } from 'next/server';
import { requireAiUser, missingKey } from '@/lib/api/requireUser';
import { generateJson } from '@/lib/ai/gemini.server';
import { normalizeExtractedLabs } from '@/lib/pmos/labExtract';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Largest data URL accepted, about 4 MB of file once base64-decoded. */
const MAX_DATA_URL_LENGTH = 5_600_000;
const ALLOWED_MIME = /^data:(image\/(jpeg|png|webp|heic|heif)|application\/pdf);base64,[A-Za-z0-9+/=]+$/;

const PROMPT = `You read a laboratory report (photo or PDF) and extract every numeric result.
Return a JSON array. Each item: {"label": string, "value": string, "unit": string, "date": string}.
- "label": the test name exactly as printed.
- "value": the number exactly as printed. Skip results that are text, ranges or start with < or >.
- "unit": the unit exactly as printed, or "" if none.
- "date": the sample or result date as YYYY-MM-DD, or "" if not shown.
Do not include reference ranges, patient data or interpretation. Return [] if the file is not a lab report.`;

export async function POST(request: Request) {
  const auth = await requireAiUser();
  if (auth.response) return auth.response;
  if (!process.env.GEMINI_API_KEY) return missingKey('GEMINI_API_KEY');

  const body = await request.json().catch(() => null);
  const media = typeof body?.media === 'string' ? body.media : '';
  if (media.length > MAX_DATA_URL_LENGTH) {
    return NextResponse.json({ error: 'File too large' }, { status: 413 });
  }
  if (!ALLOWED_MIME.test(media)) {
    return NextResponse.json({ error: 'Only images or PDF files are accepted' }, { status: 400 });
  }
  // The client sends its local date; the server clock may be in another time zone.
  const today = typeof body?.today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.today)
    ? body.today
    : new Date().toISOString().slice(0, 10);

  try {
    const text = await generateJson(PROMPT, media);
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { parsed = []; }
    // The file is not stored: only the rows leave this function.
    return NextResponse.json({ rows: normalizeExtractedLabs(parsed, today) });
  } catch (error: any) {
    console.error('Lab extraction error:', error);
    return NextResponse.json({ error: 'Could not read the file' }, { status: 502 });
  }
}
