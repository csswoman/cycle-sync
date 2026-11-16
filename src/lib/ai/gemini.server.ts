import { GoogleGenerativeAI } from '@google/generative-ai';

// Server-only: this file reads GEMINI_API_KEY and must never be imported from client components.

const DEFAULT_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
];

/** Fallback order, overridable with GEMINI_MODELS="model-a,model-b" without touching code. */
const MODELS = (process.env.GEMINI_MODELS || '')
  .split(',')
  .map(m => m.trim())
  .filter(Boolean);
const FALLBACK_MODELS = MODELS.length > 0 ? MODELS : DEFAULT_MODELS;

let currentModelIndex = 0;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  return new GoogleGenerativeAI(apiKey);
}

/** Runs `fn` against each model in order until one succeeds (quota / rate-limit fallback). */
async function withFallback<T>(fn: (modelName: string) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    const idx = (currentModelIndex + i) % FALLBACK_MODELS.length;
    const modelName = FALLBACK_MODELS[idx];
    try {
      const result = await fn(modelName);
      currentModelIndex = idx;
      return result;
    } catch (error: any) {
      console.warn(`⚠️ Gemini model ${modelName} failed:`, error?.message || error);
      lastError = error;
    }
  }
  throw lastError ?? new Error('All Gemini models failed');
}

const SYSTEM_INSTRUCTIONS = {
  en: "You are CycleSync AI, a helpful, empathetic holistic health assistant. Keep answers concise, encouraging, and focused on women's health, cycle tracking, and wellness. Always respond in English.",
  es: 'Eres CycleSync AI, un asistente de salud holística útil y empático. Mantén las respuestas concisas, alentadoras y enfocadas en la salud de la mujer, el seguimiento del ciclo y el bienestar. Siempre responde en español.',
};

export type ChatHistory = { role: 'user' | 'model'; parts: { text: string }[] }[];

export async function chat(message: string, history: ChatHistory, language: 'en' | 'es', userContext = '') {
  const genAI = getClient();
  return withFallback(async modelName => {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: [SYSTEM_INSTRUCTIONS[language] ?? SYSTEM_INSTRUCTIONS.en, userContext].filter(Boolean).join('\n\n'),
    });
    const session = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: h.parts.map(p => ({ text: p.text })),
      })),
    });
    const result = await session.sendMessage(message);
    return result.response.text();
  });
}

/** Analyzes an image or video passed as a data URL ("data:<mime>;base64,<data>"). */
export async function analyzeMedia(dataUrl: string, prompt: string) {
  const matches = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!matches) throw new Error('Invalid base64 media data');
  const [, mimeType, data] = matches;

  const genAI = getClient();
  return withFallback(async modelName => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent([prompt, { inlineData: { mimeType, data } }]);
    return result.response.text();
  });
}
