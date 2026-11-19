// Client-side wrapper: calls our own API routes, which hold the Gemini key on the server.

import { aiFetch } from '@/lib/ai/consent';
async function postAI(path: string, body: unknown): Promise<string> {
  const response = await aiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (response.status === 413) {
    throw new Error('File is too large. Try a shorter video or a smaller image.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `AI request failed (${response.status})`);
  }
  return data.text as string;
}

/**
 * Sends a chat message to the Gemini model.
 */
export const sendChatMessage = (
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  language: 'en' | 'es' = 'en',
  cycle?: { phase: string; cycleDay: number },
  today?: string
): Promise<string> => postAI('/api/ai/chat', { message, history, language, cycle, today });

/**
 * Analyzes an image (data URL) with a text prompt. `format: 'json'` asks the model for a JSON reply.
 */
export const analyzeImage = (base64Image: string, prompt: string, format?: 'json'): Promise<string> =>
  postAI('/api/ai/analyze', { media: base64Image, prompt, kind: 'image', format });

/**
 * Analyzes a video (data URL) with a text prompt.
 * Note: requests are capped at ~4.5 MB on Vercel, so only short clips work.
 */
export const analyzeVideo = (base64Video: string, prompt: string): Promise<string> =>
  postAI('/api/ai/analyze', { media: base64Video, prompt, kind: 'video' });
