import { saveMeme } from './storage';
import { CONFIG } from './config';
import { analyzeMemeContext } from './geminiService';

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
      console.log(`[Chuckle] Generating ${variantsCount} variant(s) for:`, text.slice(0, 30));
      const variantPromises = Array.from({ length: variantsCount }, (_, i) => 
        analyzeMemeContext(text, i).then(template => ({
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
      
      console.log(`[Chuckle] Successfully generated ${variants.length} variant(s)`);
      return { text, success: true, variants };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Chuckle] Batch generation failed:', errorMsg);
      return { 
        text, 
        success: false, 
        error: errorMsg
      };
    }
  }));
}


