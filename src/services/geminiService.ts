import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

// Validate API key on module load
if (!apiKey) {
  console.error('❌ VITE_GEMINI_API_KEY is not set in your .env.local file!');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Multiple free models for automatic fallback when quota is exceeded
const FALLBACK_MODELS = [
  'models/gemini-2.5-flash',           // Primary - newest and fastest
  'models/gemini-2.0-flash',           // Fallback 1
  'models/gemini-flash-latest',        // Fallback 2
  'models/gemini-2.5-flash-lite',      // Fallback 3 - lighter version
  'models/gemini-2.0-flash-lite',      // Fallback 4
];

let currentModelIndex = 0;

/**
 * Sends a chat message to the Gemini model.
 */
export const sendChatMessage = async (
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  language: 'en' | 'es' = 'en'
): Promise<string> => {
  if (!apiKey) {
    throw new Error('API key is missing. Please add VITE_GEMINI_API_KEY to your .env.local file and restart the dev server.');
  }

  const systemInstructions = {
    en: "You are CycleSync AI, a helpful, empathetic holistic health assistant. Keep answers concise, encouraging, and focused on women's health, cycle tracking, and wellness. Always respond in English.",
    es: "Eres CycleSync AI, un asistente de salud holística útil y empático. Mantén las respuestas concisas, alentadoras y enfocadas en la salud de la mujer, el seguimiento del ciclo y el bienestar. Siempre responde en español."
  };

  // Try each model in the fallback list
  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    const modelName = FALLBACK_MODELS[(currentModelIndex + i) % FALLBACK_MODELS.length];

    try {
      console.log(`🤖 Using model: ${modelName}`);

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstructions[language],
      });

      const chat = model.startChat({
        history: history.map(h => ({
          role: h.role,
          parts: h.parts.map(p => ({ text: p.text })),
        })),
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;

      // Success! Update current model index for next time
      if (i > 0) {
        currentModelIndex = (currentModelIndex + i) % FALLBACK_MODELS.length;
        console.log(`✅ Switched to ${modelName} due to quota/rate limit on previous model`);
      }

      return response.text();
    } catch (error: any) {
      console.warn(`⚠️ Model ${modelName} failed:`, error?.message || error);

      // If this is the last model, throw the error
      if (i === FALLBACK_MODELS.length - 1) {
        throw error;
      }

      // Otherwise, try the next model
      console.log(`🔄 Trying next fallback model...`);
    }
  }

  throw new Error('All models failed');
};

/**
 * Analyzes an image with a text prompt.
 */
export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    // base64Image is likely "data:image/png;base64,..."
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      throw new Error("Invalid base64 image data");
    }
    const mimeType = matches[1];
    const data = matches[2];

    const model = genAI.getGenerativeModel({ model: FALLBACK_MODELS[0] });

    const result = await model.generateContent([
      prompt || "Analyze this image for health insights.",
      { inlineData: { mimeType, data } }
    ]);

    return result.response.text();
  } catch (error) {
    console.error("Image analysis error:", error);
    throw error;
  }
};

/**
 * Analyzes a video with a text prompt.
 * Note: Browser-based base64 video is limited by memory.
 */
export const analyzeVideo = async (base64Video: string, prompt: string): Promise<string> => {
  try {
    const matches = base64Video.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      throw new Error("Invalid base64 video data");
    }
    const mimeType = matches[1];
    const data = matches[2];

    const model = genAI.getGenerativeModel({ model: FALLBACK_MODELS[0] });

    const result = await model.generateContent([
      prompt || "Analyze this video for exercise form or health context.",
      { inlineData: { mimeType, data } }
    ]);

    return result.response.text();
  } catch (error) {
    console.error("Video analysis error:", error);
    throw error;
  }
};
