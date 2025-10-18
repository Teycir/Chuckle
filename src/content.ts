import { showLoading, hideLoading } from './loading';
import { logger } from './logger';
import { analyzeMemeContext, generateMemeImage } from './geminiService';
import { createOverlay } from './overlay';
import { saveMeme } from './storage';
import { optimizeText } from './textOptimizer';
import { performCleanup, shouldCleanup } from './cleanup';

function showError(message: string): void {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'meme-error';
  errorDiv.textContent = message;
  errorDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#c5221f;color:#fff;padding:15px 20px;border-radius:8px;z-index:100001;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:14px;max-width:400px;word-wrap:break-word;';
  document.body.appendChild(errorDiv);
  console.log('[Chuckle] Showing error to user:', message);
  setTimeout(() => errorDiv.remove(), 5000);
}

chrome.runtime.onMessage.addListener((message) => {
  console.log('[Chuckle] Message received:', message.action);
  if (message.action === "generateMeme") {
    generateMeme(message.text);
  } else if (message.action === "generateMemeFromSelection") {
    const selectedText = window.getSelection()?.toString().trim();
    if (selectedText) {
      generateMeme(selectedText);
    } else {
      showError('Please select some text first');
    }
  }
});

const errorMessages = {
English: {
  storageFull: 'Chrome storage full. Clear old memes in History.',
  apiKey: 'API key invalid. Check settings.',
  network: 'Network error. Check internet connection.',
  rateLimit: 'API exhausted. Please wait a moment and try again.',
  generic: 'Meme generation failed. Try again.',
  wordRange: 'You must select between 6 and 30 words.'
},
Spanish: {
  storageFull: 'Almacenamiento lleno. Borra memes antiguos.',
  apiKey: 'Clave API inválida. Verifica configuración.',
  network: 'Error de red. Verifica tu conexión.',
  rateLimit: 'API agotada. Por favor, espera un momento e inténtalo de nuevo.',
  generic: 'Error al generar meme. Intenta de nuevo.',
  wordRange: 'Debes seleccionar entre 6 y 30 palabras.'
},
French: {
  storageFull: 'Stockage plein. Supprimez anciens memes.',
  apiKey: 'Clé API invalide. Vérifiez paramètres.',
  network: 'Erreur réseau. Vérifiez connexion internet.',
  rateLimit: 'API épuisée. Veuillez attendre un moment et réessayer.',
  generic: 'Échec génération meme. Réessayez.',
  wordRange: 'Vous devez sélectionner entre 6 et 30 mots.'
},
German: {
  storageFull: 'Speicher voll. Alte Memes löschen.',
  apiKey: 'API-Schlüssel ungültig. Einstellungen prüfen.',
  network: 'Netzwerkfehler. Internetverbindung prüfen.',
  rateLimit: 'API erschöpft. Bitte warten Sie einen Moment und versuchen Sie es erneut.',
  generic: 'Meme-Erstellung fehlgeschlagen. Erneut versuchen.',
  wordRange: 'Sie müssen zwischen 6 und 30 Wörter auswählen.'
}
};

async function getErrorMessage(error: unknown): Promise<string> {
  const { selectedLanguage } = await chrome.storage.local.get(['selectedLanguage']);
  const lang = (selectedLanguage || 'English') as keyof typeof errorMessages;
  const messages = errorMessages[lang] || errorMessages.English;
  
  const errorStr = error instanceof Error ? error.message : String(error);
  const lowerError = errorStr.toLowerCase();
  
  // Check for specific errors first (most specific to least specific)
  if (lowerError.includes('quota') || lowerError.includes('quotabytes')) {
    return messages.storageFull;
  }
  if (lowerError.includes('429') || lowerError.includes('too many requests') || 
      lowerError.includes('rate limit') || lowerError.includes('exhausted') ||
      lowerError.includes('agotada') || lowerError.includes('épuisée') || lowerError.includes('erschöpft')) {
    return messages.rateLimit;
  }
  if (lowerError.includes('403') || lowerError.includes('401') || 
      lowerError.includes('authentication failed') || lowerError.includes('forbidden') ||
      lowerError.includes('unauthorized')) {
    return messages.apiKey;
  }
  if (lowerError.includes('network') || lowerError.includes('fetch') || 
      lowerError.includes('timeout') || lowerError.includes('connection')) {
    return messages.network;
  }
  
  // If no specific match, return the actual error message if it's meaningful
  if (errorStr.length > 0 && errorStr.length < 200) {
    return errorStr;
  }
  
  return messages.generic;
}

export async function generateMeme(text: string): Promise<void> {
  console.log('[Chuckle] Starting meme generation for text:', text.slice(0, 50));
  
  // Auto-cleanup if needed
  if (await shouldCleanup()) {
    const result = await performCleanup();
    if (result.removed > 0) {
      console.log(`[Chuckle] Auto-cleaned ${result.removed} memes, freed ${(result.freedBytes / 1024).toFixed(1)}KB`);
    }
  }
  
  const wordCount = text.trim().split(/\s+/).length;
  
  if (wordCount < 6 || wordCount > 30) {
    const { selectedLanguage } = await chrome.storage.local.get(['selectedLanguage']);
    const lang = (selectedLanguage || 'English') as keyof typeof errorMessages;
    const messages = errorMessages[lang] || errorMessages.English;
    showError(messages.wordRange);
    return;
  }
  
  try {
    showLoading('Generating meme...');
    const truncatedText = text.slice(0, 1000);
    const template = await analyzeMemeContext(truncatedText);
    console.log('[Chuckle] Template selected:', template);
    const { watermarkedUrl, originalUrl, formattedText } = await generateMemeImage(template, truncatedText);
    
    const memeData = {
      text: formattedText,
      imageUrl: originalUrl,
      originalUrl,
      template,
      timestamp: Date.now(),
      language: 'English',
      originalInput: truncatedText
    };
    
    const displayData = {
      ...memeData,
      imageUrl: watermarkedUrl
    };
    
    await saveMeme(memeData);
    console.log('[Chuckle] Meme saved, creating overlay');
    hideLoading();
    await createOverlay(displayData);
    console.log('[Chuckle] Overlay created');
  } catch (error) {
    hideLoading();
    logger.error('Meme generation failed', error);
    const errorMsg = await getErrorMessage(error);
    console.log('[Chuckle] Error caught in generateMeme:', error);
    console.log('[Chuckle] Error message to display:', errorMsg);
    showError(errorMsg);
  }
}


