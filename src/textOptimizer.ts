import { CONFIG } from './config';
import { TEXT_OPTIMIZATION_PROMPT, ERROR_MESSAGES } from './constants';
import type { GeminiResponse } from './types';

export async function optimizeText(text: string): Promise<string> {
  const trimmed = text.trim();
  
  console.log('[Chuckle] Processing text:', trimmed.slice(0, 50));
  
  const { geminiApiKey } = await chrome.storage.local.get(['geminiApiKey']);
  if (!geminiApiKey) return trimmed.slice(0, 200);
  
  const prompt = trimmed.length > 300 
    ? `Summarize this text into a HILARIOUS, punchy statement (max 200 chars). Make it EXTREMELY funny, witty, and meme-worthy. Add humor, exaggeration, or irony:\n"${trimmed}"\n\nReturn ONLY the funny summary, nothing else.`
    : `Transform this text to be EXTREMELY funny and meme-worthy (max 200 chars). Keep the core meaning but maximize humor with wit, exaggeration, or irony:\n"${trimmed}"\n\nReturn ONLY the funny version, nothing else.`;
  
  try {
    const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 1.5,
          topP: 0.98,
          topK: 64
        }
      })
    });
    
    if (!response.ok) {
      console.error('[Chuckle] Text optimization failed:', response.status);
      return trimmed.slice(0, 150);
    }
    
    const data: GeminiResponse = await response.json();
    const optimized = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (optimized && optimized.length <= 200) {
      console.log('[Chuckle] Text optimized:', optimized);
      return optimized;
    }
    
    return trimmed.slice(0, 200);
  } catch (error) {
    console.error('[Chuckle] Text optimization error:', error);
    return trimmed.slice(0, 200);
  }
}
