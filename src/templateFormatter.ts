import { CONFIG } from './config';
import type { GeminiResponse } from './types';

const TEMPLATE_PROMPTS: Record<string, string> = {
  drake: 'Drake meme: TOP = bad/rejected option, BOTTOM = good/approved option. Format: "bad thing / good thing" (max 35 chars each)',
  db: 'Distracted BF: TOP = current focus, BOTTOM = tempting distraction. Format: "current thing / tempting thing" (max 35 chars each)',
  ds: 'Two Buttons: TOP = first option, BOTTOM = second option (both equally difficult). Format: "option 1 / option 2" (max 35 chars each)',
  cmm: 'Change My Mind: TOP = setup, BOTTOM = controversial statement. Format: "setup / bold claim" (max 35 chars each)',
  pigeon: 'Pigeon: TOP = thing being looked at, BOTTOM = "Is this [misidentification]?". Format: "thing / Is this X?" (max 35 chars each)',
  'woman-cat': 'Woman Yelling at Cat: TOP = angry accusation, BOTTOM = dismissive response. Format: "accusation / dismissal" (max 35 chars each)',
  fine: 'This is Fine: TOP = situation, BOTTOM = denial statement. Format: "situation / this is fine" (max 35 chars each)',
  stonks: 'Stonks: TOP = failure/mistake, BOTTOM = unexpected success. Format: "mistake / stonks" (max 35 chars each)',
  astronaut: 'Always Has Been: TOP = realization/question, BOTTOM = "Always has been". Format: "realization / Always has been" (max 35 chars each)',
  success: 'Success Kid: TOP = setup/challenge, BOTTOM = unexpected win. Format: "challenge / victory" (max 35 chars each)',
  blb: 'Bad Luck Brian: TOP = action taken, BOTTOM = unfortunate outcome. Format: "action / bad result" (max 35 chars each)',
  mordor: 'One Does Not Simply: TOP = "One does not simply", BOTTOM = impossible task. Format: "One does not simply / task" (max 35 chars each)',
  aag: 'Ancient Aliens: TOP = mysterious thing, BOTTOM = conspiracy explanation. Format: "mystery / aliens" (max 35 chars each)',
  fry: 'Futurama Fry: TOP = "Not sure if", BOTTOM = suspicious alternative. Format: "Not sure if / or just" (max 35 chars each)',
  fwp: 'First World Problems: TOP = privileged situation, BOTTOM = trivial complaint. Format: "situation / complaint" (max 35 chars each)',
  doge: 'Doge: TOP = "much" statement, BOTTOM = "such/very" statement. Format: "much X / such Y" (max 35 chars each)',
  iw: 'Insanity Wolf: TOP = extreme situation, BOTTOM = insane action. Format: "situation / extreme action" (max 35 chars each)',
  philosoraptor: 'Philosoraptor: TOP = philosophical question part 1, BOTTOM = question part 2. Format: "question start / question end" (max 35 chars each)',
  grumpycat: 'Grumpy Cat: TOP = suggestion/request, BOTTOM = grumpy "No" response. Format: "request / No" (max 35 chars each)'
};

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&quot;': '"', '&#34;': '"', '&apos;': "'", '&#39;': "'",
    '&amp;': '&', '&#38;': '&', '&lt;': '<', '&#60;': '<',
    '&gt;': '>', '&#62;': '>', '&nbsp;': ' ', '&#160;': ' '
  };
  return text.replace(/&[#a-z0-9]+;/gi, match => entities[match.toLowerCase()] || '');
}

function cleanText(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[*#@]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function smartSplit(text: string): string {
  const words = text.split(/\s+/);
  if (words.length <= 3) return `${words[0] || text} / ${words.slice(1).join(' ') || 'yes'}`;
  const mid = Math.ceil(words.length / 2);
  return `${words.slice(0, mid).join(' ')} / ${words.slice(mid).join(' ')}`;
}

export async function formatTextForTemplate(text: string, template: string): Promise<string> {
  const templatePrompt = TEMPLATE_PROMPTS[template] || 'Format as two parts: "part 1 / part 2" (max 35 chars each)';
  
  console.log(`[Chuckle] Formatting text for ${template}`);
  
  const { geminiApiKey } = await chrome.storage.local.get(['geminiApiKey']);
  if (!geminiApiKey) return smartSplit(text);
  
  const prompt = `${templatePrompt}\n\nAdapt this text to match the template format. Make it EXTREMELY HILARIOUS and relatable with wit, irony, or exaggeration.\n\nSTRICT RULES:\n- MUST use " / " separator between top and bottom text\n- Each part MAX 35 characters\n- Use simple, clear language\n- NO emojis, NO special characters, NO HTML entities\n- NO hashtags, NO asterisks\n- Make it easy to understand\n\nText: "${text}"\n\nReturn ONLY the formatted text with " / " separator. Nothing else.`;

  try {
    const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 1.4,
          topP: 0.98,
          topK: 64
        }
      })
    });
    
    if (!response.ok) {
      console.error('[Chuckle] Template formatting failed:', response.status);
      return smartSplit(text);
    }
    
    const data: GeminiResponse = await response.json();
    let formatted = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (formatted) {
      formatted = formatted.replace(/^["']|["']$/g, '').trim();
      formatted = decodeHtmlEntities(formatted);
      formatted = cleanText(formatted);
      const lines = formatted.split('\n').filter(l => l.trim().length > 0);
      const firstLine = lines[0] || formatted;
      
      if (firstLine.includes(' / ')) {
        const parts = firstLine.split(' / ').map(p => p.trim());
        if (parts.length >= 2 && parts[0].length <= 35 && parts[1].length <= 35) {
          const cleanedLine = `${parts[0]} / ${parts[1]}`;
          console.log('[Chuckle] Text formatted for template:', cleanedLine);
          return cleanedLine;
        }
      }
    }
    
    console.log('[Chuckle] Formatted text too long, using smart split');
    return smartSplit(text);
  } catch (error) {
    console.error('[Chuckle] Template formatting error:', error);
    return smartSplit(text);
  }
}
