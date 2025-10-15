import { saveMeme } from './storage';
import type { MemeData, GeminiResponse } from './types';
import { geminiCache } from './cache';
import { CONFIG } from './config';

export interface MemeVariant {
  imageUrl: string;
  template: string;
}

export interface BatchResult {
  text: string;
  success: boolean;
  variants?: MemeVariant[];
  error?: string;
}

export async function generateBatch(texts: string[], variantsCount: 1 | 2 | 3 = 1): Promise<BatchResult[]> {
  return Promise.all(texts.map(async (text) => {
    try {
      const variantPromises = Array.from({ length: variantsCount }, (_, i) => 
        analyzeContext(text, i).then(template => ({
          imageUrl: `${CONFIG.MEMEGEN_API_URL}/${template}.png`,
          template
        }))
      );
      
      const variants = await Promise.all(variantPromises);
      
      await Promise.all(variants.map(variant => 
        saveMeme({
          text,
          imageUrl: variant.imageUrl,
          template: variant.template,
          timestamp: Date.now(),
          language: 'English',
          isFavorite: false,
          tags: []
        })
      ));
      
      return { text, success: true, variants };
    } catch (error) {
      return { 
        text, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }));
}

async function analyzeContext(text: string, variant: number = 0): Promise<string> {
  const cacheKey = `gemini:${text}:v${variant}`;
  const cached = geminiCache.get(cacheKey);
  if (cached) return cached;

  const { geminiApiKey } = await chrome.storage.local.get(['geminiApiKey']);
  if (!geminiApiKey) throw new Error('API key not configured');
  
  const response = await fetch(
    `${CONFIG.GEMINI_API_URL}?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this text and suggest a meme template: "${text}". Return only the template name.`
          }]
        }]
      })
    }
  );
  
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  
  const data: GeminiResponse = await response.json();
  if (data.error) throw new Error(data.error.message);
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error('Invalid API response');
  
  const result = data.candidates[0].content.parts[0].text;
  geminiCache.set(cacheKey, result);
  return result;
}
