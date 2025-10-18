import { CONFIG } from './config';
import { getErrorMessage } from './errorMessages';
import { formattedCache } from './cache';
import { decodeHtmlEntities, cleanText } from '../lib/text-utils';

const TEMPLATE_PROMPTS: Record<string, string> = {
  drake: 'Drake (rejecting/approving): TOP=rejected option (what Drake pushes away), BOTTOM=OPPOSITE approved option (what Drake wants). CRITICAL: TOP and BOTTOM must be CONTRADICTORY. Example: TOP="Therapy and self-care" BOTTOM="Ignoring problems until they disappear". Photo: Drake rapper in red jacket, top panel shows him turning away disgusted, bottom panel shows him pointing and smiling approvingly.',
  db: 'Distracted Boyfriend: TOP=tempting new thing only, BOTTOM=current thing being ignored. About temptation only. Example: TOP="ChatGPT writing my code" BOTTOM="Actually learning to code". Photo: Man walking with girlfriend, turns to check out another woman passing by, girlfriend looks angry.',
  ds: 'Daily struggle (sweating): TOP=first equally horrible option, BOTTOM=second equally horrible option. CRITICAL: Both choices must be EQUALLY BAD/TERRIBLE - no good option exists. Example: TOP="Admit I was wrong" BOTTOM="Get fired". Photo: Man in suit sweating nervously, hand hovering over two red buttons, unable to choose.',
  cmm: 'Change My Mind: One single controversial statement (no TOP/BOTTOM split). Example: "Pineapple belongs on pizza". Photo: Man sitting at table with sign that says "Change My Mind", ready to debate.',
  pigeon: 'Pigeon (Is this...?): TOP=tiny/pathetic thing, BOTTOM="Is this [absurdly grand label]?". About ridiculous misidentification. Example: TOP="Got 3 likes on my post" BOTTOM="Am I megastar or superstar?". Photo: Pigeon looking at butterfly, confused about what it is.',
  'woman-cat': 'Woman Yelling at Cat: TOP=angry woman yelling accusation, BOTTOM=cat SADISTIC response that ENJOYS the pain/problem. CRITICAL: Cat must be CRUEL, SADISTIC, take PLEASURE in the accusation, and respond with MALICIOUS satisfaction. Cat LOVES causing suffering. Example 1: TOP="You are ruining your life!" BOTTOM="And I\'ll do it again". Example 2: TOP="Ils nous divisent!" BOTTOM="Bien fait". Photo: Woman yelling (left), cat at table unbothered (right).',
  fine: 'This is Fine (dog in fire): TOP=very catastrophic situation and desparate, BOTTOM=denial during disaster, accepting fate, extemely passive and accepting catastrophy, total submission. Example: TOP="Bank account at -$47, rent due tomorrow" BOTTOM="This is fine". Photo: Dog sitting at table drinking coffee while room is on fire around him, smiling calmly.',
  stonks: 'Stonks: TOP=huge failure/mistake, BOTTOM=unexpected huge success DESPITE the failure. CRITICAL: BOTTOM must be POSITIVE/WIN/SUCCESS, not another failure. Example: TOP="Accidentally replied all with meme" BOTTOM="CEO loved it, got promoted". Photo: Orange meme man in suit with rising stock chart arrow behind him, looking confident.',

  success: 'Success Kid (fist pump): TOP=challenge/obstacle, BOTTOM=petty victory or savage comeback, winner attitude and optimism. Example: TOP="Ex said I\'d never find better" BOTTOM="Now married to a top model". Photo: Baby on beach with determined expression, fist clenched in victory pose.',
  blb: 'Bad Luck Brian: TOP=big action taken, BOTTOM=catastrophic outcome. Example: TOP="Finally gets a date" BOTTOM="She brings her boyfriend". Photo: Awkward teen with braces, red plaid vest, terrible school photo smile.',
  fry: 'Futurama Fry (squinting): TOP="Not sure if [first option]", BOTTOM="Or [second option]". Very paranoid, at limit of insanity. Example: TOP="Not sure if flirting" BOTTOM="Or just being nice to get a tip". Photo: Fry from Futurama squinting suspiciously, orange hair, red jacket.',
  fwp: 'First World Problems: TOP=ridiculously privileged complaint, BOTTOM=why it ruins everything. Spoiled brat question and answer. Example: TOP="My AirPods died" BOTTOM="Now I have to hear my own thoughts". Photo: Woman crying while holding phone, looking devastated over trivial problem.',
  doge: 'Doge: Broken English, enthusiastic. TOP="much/wow [thing]", BOTTOM="such/very [thing] wow". Funny breaking of the language. Example: TOP="much procrastinate" BOTTOM="very deadline panic wow". Photo: Shiba Inu dog with raised eyebrows, looking sideways with comic sans text.',
  iw: 'Insanity Wolf: TOP=normal situation, BOTTOM=EXTREME overreaction. Example: TOP="Someone says good morning" BOTTOM="SCREAM BACK AGGRESSIVELY". Be creative an hilarious, use exageration to the absurd. Photo: Wolf with crazy eyes, teeth bared, insane aggressive expression.',
  philosoraptor: 'Philosoraptor: TOP=first part of mind-bending question, BOTTOM=second part that makes you think. Be creative an hilarious. Example: TOP="If I\'m always late" BOTTOM="Am I consistently on time for being late?". Photo: Velociraptor in thinking pose, claw on chin, contemplating deeply.',
  grumpycat: 'Grumpy Cat: TOP=suggestion/request, BOTTOM=witty grumpy rejection with extreme snobism and sarcasm. Be creative and hilarious to a point were we laugh hard, not just "No". Example: TOP="Be more positive" BOTTOM="I choose violence". Photo: Grumpy white cat with permanently angry/frowning face, looking extremely displeased.'
};


export async function formatTextForTemplate(text: string, template: string, forceRegenerate: boolean = false): Promise<string> {
  const { offlineMode } = await chrome.storage.local.get(['offlineMode']);
  
  if (offlineMode) {
    console.log('[Chuckle] Offline mode: splitting text in half');
    const words = text.trim().split(/\s+/);
    const mid = Math.ceil(words.length / 2);
    const part1 = words.slice(0, mid).join(' ');
    const part2 = words.slice(mid).join(' ');
    return `${part1} / ${part2}`;
  }
  
  const cacheKey = `fmt:${template}:${text.slice(0, 50)}`;
  if (!forceRegenerate) {
    const cached = formattedCache.get(cacheKey);
    if (cached) {
      console.log('[Chuckle] Using cached formatted text');
      return cached;
    }
  }

  const templatePrompt = TEMPLATE_PROMPTS[template] || 'Format as two parts: "part 1 / part 2" (max 35 chars each)';
  console.log(`[Chuckle] Formatting text for ${template}`);
  
  const { aiProvider, geminiApiKey, openrouterApiKey, openrouterPrimaryModel, selectedLanguage } = await chrome.storage.local.get(['aiProvider', 'geminiApiKey', 'openrouterApiKey', 'openrouterPrimaryModel', 'selectedLanguage']);
  const provider = aiProvider || 'google';
  const language = selectedLanguage || 'English';
  
  if (provider === 'google' && !geminiApiKey) throw new Error('No API key');
  if (provider === 'openrouter' && !openrouterApiKey) throw new Error('No API key');
  
  const prompt = `Format: "${text}"

Template: ${templatePrompt}

RULES:
1. Return ONLY: "text1 / text2"
2. Each part MAX 70 chars
3. Language: ${language}
4. Be concise and viral
5. CRITICAL: Be concise and creative - rephrase to fit within 70 chars
6. NEVER truncate words ("du moin" is WRONG, must be "du moins" or rephrase entirely)
7. Plan your text from the start to fit 70 chars - write complete sentences that naturally fit
8. PREFER 3-4 words max in part 1 and part 2 IF POSSIBLE - shorter is punchier and more viral

CRITICAL - Choose ONE definitive answer:
- NO alternatives ("OR", "Alternatively", "could be")
- NO thinking process or commentary
- NO multiple options
- Just return the FINAL result

FORBIDDEN - DO NOT INCLUDE:
- Your thoughts
- Explanations
- Commentary
- "Let me", "Here is", "according to", "I will"
- ANY text outside the 2 parts

Response (ONLY the 2 parts):`;

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
            maxOutputTokens: 80
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
          max_tokens: 80
        })
      });
    }
    
    if (!response.ok) {
      if (response.status === 429) {
        const errorMsg = await getErrorMessage('tooManyRequests');
        throw new Error(errorMsg);
      }
      if (response.status === 403 || response.status === 401) {
        throw new Error(`API authentication failed (${response.status})`);
      }
      throw new Error(`API error: ${response.status}`);
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
      
      // Remove any explanations after the formatted text
      const explanationMarkers = [' is not valid', ' due to', 'A valid', 'rephrased version', 'Let me', 'according to', 'Here is', 'I will', 'The formatted'];
      for (const marker of explanationMarkers) {
        const idx = formatted.toLowerCase().indexOf(marker.toLowerCase());
        if (idx > 0) {
          formatted = formatted.substring(0, idx).trim();
        }
      }
      
      // Remove trailing quotes that might be left
      formatted = formatted.replace(/["']+$/g, '').trim();
      
      const lines = formatted.split('\n').filter(l => l.trim().length > 0);
      const firstLine = lines[0] || formatted;
      
      // Try multiple separator patterns
      const separators = [' / ', '/', ' /'];
      for (const sep of separators) {
        if (firstLine.includes(sep)) {
          const parts = firstLine.split(sep).map(p => p.trim());
          if (parts.length >= 2 && parts[0] && parts[1]) {
            // Ensure we don't cut words - limit to 60 chars but keep words complete
            let part1 = parts[0];
            let part2 = parts[1];
            
            if (part1.length > 80) {
              const words = part1.split(/\s+/);
              part1 = '';
              for (const word of words) {
                if ((part1 + ' ' + word).trim().length <= 80) {
                  part1 = (part1 + ' ' + word).trim();
                } else break;
              }
            }
            
            if (part2.length > 80) {
              const words = part2.split(/\s+/);
              part2 = '';
              for (const word of words) {
                if ((part2 + ' ' + word).trim().length <= 80) {
                  part2 = (part2 + ' ' + word).trim();
                } else break;
              }
            }
            
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
    // Re-throw rate limit errors directly to preserve the localized message
    if (error instanceof Error && (error.message.includes('429') || 
        error.message.includes('API exhausted') ||
        error.message.includes('API agotada') ||
        error.message.includes('API épuisée') ||
        error.message.includes('API erschöpft') ||
        error.message.includes('Too many requests') ||
        error.message.includes('Too Many Requests'))) {
      throw error;
    }
    throw new Error(`Failed to format text for ${template}: ${error}`);
  }
}
