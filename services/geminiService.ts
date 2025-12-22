import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = 'gemini-3-pro-preview';

/**
 * Sends a chat message to the Gemini model.
 */
export const sendChatMessage = async (
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> => {
  try {
    const chat: Chat = ai.chats.create({
      model: MODEL_NAME,
      history: history,
      config: {
        systemInstruction: "You are CycleSync AI, a helpful, empathetic holistic health assistant. Keep answers concise, encouraging, and focused on women's health, cycle tracking, and wellness.",
      }
    });

    const result: GenerateContentResponse = await chat.sendMessage({ message });
    return result.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};

/**
 * Analyzes an image with a text prompt.
 */
export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    // base64Image is likely "data:image/png;base64,..."
    // We need to extract the data and mime type
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      throw new Error("Invalid base64 image data");
    }
    const mimeType = matches[1];
    const data = matches[2];

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: prompt || "Analyze this image for health insights." }
        ]
      }
    });

    return response.text || "No analysis available.";
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

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: prompt || "Analyze this video for exercise form or health context." }
        ]
      },
      config: {
        // Thinking budget to allow for deeper video analysis if needed
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Video analysis error:", error);
    throw error;
  }
};
