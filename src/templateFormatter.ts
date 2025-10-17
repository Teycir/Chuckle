import { CONFIG } from './config';
import type { GeminiResponse } from './types';
import { getErrorMessage } from './errorMessages';
import { formattedCache } from './cache';
import { decodeHtmlEntities, cleanText } from '../lib/text-utils';

const TEMPLATE_PROMPTS: Record<string, string> = {
  drake: 'Drake (rejecting/approving): TOP=rejected option (what Drake pushes away), BOTTOM=approved option (what Drake wants). Keep original sentiment. Example: "Paid ads / One viral Reddit post"',
  db: 'Distracted Boyfriend: TOP=tempting new thing, BOTTOM=current thing being ignored. About temptation/distraction. Example: "New framework / Finishing current project"',
  ds: 'Two Buttons (sweating): Both options equally difficult/impossible. About hard choices. Example: "Ship buggy code / Miss deadline"',
  cmm: 'Change My Mind: Controversial/bold statement. Example: "Reddit > paid marketing"',
  pigeon: 'Pigeon (Is this...?): TOP=thing seen, BOTTOM="Is this [wrong label]?". About misidentification. Example: "40 users / Is this going viral?"',
  'woman-cat': 'Woman Yelling at Cat: TOP=angry accusation, BOTTOM=calm dismissal. Example: "You need more users! / I got 40, I\'m good"',
  fine: 'This is Fine (dog in fire): Denial during disaster. Example: "0 users for 3 weeks / This is fine"',
  stonks: 'Stonks: Failing upward, unexpected win from mistake. Example: "One lazy Reddit post / 40 users"',
  astronaut: 'Always Has Been: Dark revelation. TOP=realization, BOTTOM="Always has been". Example: "Wait, Reddit works? / Always has been"',
  success: 'Success Kid (fist pump): CELEBRATING small wins, feeling accomplished. Example: "Only got 40 users / Feels like a million"',
  blb: 'Bad Luck Brian: Worst possible outcome. Example: "Posted on Reddit / Got roasted instead"',
  mordor: 'One Does Not Simply: Impossible task. TOP="One does not simply", BOTTOM=task. Example: "One does not simply / Get users from Reddit"',
  aag: 'Ancient Aliens: Conspiracy theory explanation. Example: "Reddit success / Aliens"',
  fry: 'Futurama Fry (squinting): Suspicion/paranoia. TOP="Not sure if", BOTTOM="or". Example: "Not sure if good post / Or just got lucky"',
  fwp: 'First World Problems: Privileged complaint. Example: "Got 40 users / But wanted 100"',
  doge: 'Doge: Broken English, enthusiastic. TOP="much/wow", BOTTOM="such/very". Example: "much Reddit success / very 40 users wow"',
  iw: 'Insanity Wolf: Extreme overreaction. Example: "Got 40 users / QUIT JOB, GO FULL TIME"',
  philosoraptor: 'Philosoraptor: Mind-bending question. Example: "If Reddit gave me users / Did I find Reddit or did it find me?"',
  grumpycat: 'Grumpy Cat: Grumpy rejection. Example: "Celebrate 40 users? / No."'
};


export async function formatTextForTemplate(text: string, template: string): Promise<string> {
  const cacheKey = `fmt:${template}:${text.slice(0, 50)}`;
  const cached = formattedCache.get(cacheKey);
  if (cached) {
    console.log('[Chuckle] Using cached formatted text');
    return cached;
  }

  const templatePrompt = TEMPLATE_PROMPTS[template] || 'Format as two parts: "part 1 / part 2" (max 35 chars each)';
  console.log(`[Chuckle] Formatting text for ${template}`);
  
  const { aiProvider, geminiApiKey, openrouterApiKey, openrouterPrimaryModel } = await chrome.storage.local.get(['aiProvider', 'geminiApiKey', 'openrouterApiKey', 'openrouterPrimaryModel']);
  const provider = aiProvider || 'google';
  
  if (provider === 'google' && !geminiApiKey) throw new Error('No API key');
  if (provider === 'openrouter' && !openrouterApiKey) throw new Error('No API key');
  
  const prompt = `Format this text for a meme: "${text}"

Template: ${templatePrompt}

RULES:
1. Return EXACTLY this format: "text1 / text2"
2. Each part MAX 30 characters
3. MUST include " / " separator
4. NO explanations, NO extra text
5. Match the template style

Your response (ONLY the formatted text):`;

  try {
    let response: Response;
    
    if (provider === 'google') {
      response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.85,
            topK: 25,
            maxOutputTokens: 50
          }
        })
      });
    } else {
      const model = openrouterPrimaryModel || 'meta-llama/llama-3.2-3b-instruct:free';
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          top_p: 0.85,
          max_tokens: 50
        })
      });
    }
    
    if (!response.ok) {
      if (response.status === 429) {
        const errorMsg = await getErrorMessage('tooManyRequests');
        throw new Error(errorMsg);
      }
      throw new Error(`Template formatting failed: ${response.status}`);
    }
    
    const data: any = await response.json();
    let formatted: string | undefined;
    
    if (provider === 'google') {
      formatted = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    } else {
      formatted = data.choices?.[0]?.message?.content?.trim();
    }
    
    console.log('[Chuckle] Raw AI response:', formatted);
    
    if (formatted) {
      formatted = formatted.replace(/^["']|["']$/g, '').trim();
      formatted = decodeHtmlEntities(formatted);
      formatted = cleanText(formatted);
      const lines = formatted.split('\n').filter(l => l.trim().length > 0);
      const firstLine = lines[0] || formatted;
      
      // Try multiple separator patterns
      const separators = [' / ', '/', ' /'];
      for (const sep of separators) {
        if (firstLine.includes(sep)) {
          const parts = firstLine.split(sep).map(p => p.trim());
          if (parts.length >= 2 && parts[0] && parts[1]) {
            const part1 = parts[0].slice(0, 35);
            const part2 = parts[1].slice(0, 35);
            const cleanedLine = `${part1} / ${part2}`;
            console.log('[Chuckle] Text formatted for template:', cleanedLine, `(${part1.length}/${part2.length} chars)`);
            formattedCache.set(cacheKey, cleanedLine);
            return cleanedLine;
          }
        }
      }
    }
    
    throw new Error('AI failed to format with separator');
  } catch (error) {
    console.error('[Chuckle] Template formatting error:', error);
    if (error instanceof Error && (error.message.includes('Too many requests') || error.message.includes('429'))) {
      throw error;
    }
    throw new Error(`Failed to format text for ${template}: ${error}`);
  }
}
