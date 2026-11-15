// Client-side wrapper: calls our own API routes, which hold the Gemini key on the server.

async function postAI(path: string, body: unknown): Promise<string> {
  const response = await fetch(path, {
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
  language: 'en' | 'es' = 'en'
): Promise<string> => postAI('/api/ai/chat', { message, history, language });

/**
 * Analyzes an image (data URL) with a text prompt.
 */
export const analyzeImage = (base64Image: string, prompt: string): Promise<string> =>
  postAI('/api/ai/analyze', { media: base64Image, prompt, kind: 'image' });

/**
 * Analyzes a video (data URL) with a text prompt.
 * Note: requests are capped at ~4.5 MB on Vercel, so only short clips work.
 */
export const analyzeVideo = (base64Video: string, prompt: string): Promise<string> =>
  postAI('/api/ai/analyze', { media: base64Video, prompt, kind: 'video' });
