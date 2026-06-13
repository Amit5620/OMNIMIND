import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

export const ai = new GoogleGenAI({ apiKey: API_KEY });

export const MODELS = {
  TEXT: "gemini-3-flash-preview",
  VISION: "gemini-3-flash-preview",
  IMAGE: "gemini-2.5-flash-image",
};

export async function chatStream(messages: any[]) {
  // Logic for streaming chat
}

export async function summarizeContent(type: 'youtube' | 'web' | 'doc', source: string) {
  // Logic for summarization
}

export async function generateImage(prompt: string) {
  // Logic for image generation
}
