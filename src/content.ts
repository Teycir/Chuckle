import { showLoading, hideLoading } from './loading';
import { logger } from './logger';
import { analyzeMemeContext, generateMemeImage } from './geminiService';
import { createOverlay } from './overlay';
import { saveMeme } from './storage';
import { optimizeText } from './textOptimizer';

function showError(message: string): void {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'meme-error';
  errorDiv.textContent = message;
  errorDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#c5221f;color:#fff;padding:15px 20px;border-radius:8px;z-index:10001;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
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
  generic: 'Meme generation failed. Try again.'
},
Spanish: {
  storageFull: 'Almacenamiento lleno. Borra memes antiguos.',
  apiKey: 'Clave API inválida. Verifica configuración.',
  network: 'Error de red. Verifica tu conexión.',
  rateLimit: 'API agotada. Por favor, espera un momento e inténtalo de nuevo.',
  generic: 'Error al generar meme. Intenta de nuevo.'
},
French: {
  storageFull: 'Stockage plein. Supprimez anciens memes.',
  apiKey: 'Clé API invalide. Vérifiez paramètres.',
  network: 'Erreur réseau. Vérifiez connexion internet.',
  rateLimit: 'API épuisée. Veuillez attendre un moment et réessayer.',
  generic: 'Échec génération meme. Réessayez.'
},
German: {
  storageFull: 'Speicher voll. Alte Memes löschen.',
  apiKey: 'API-Schlüssel ungültig. Einstellungen prüfen.',
  network: 'Netzwerkfehler. Internetverbindung prüfen.',
  rateLimit: 'API erschöpft. Bitte warten Sie einen Moment und versuchen Sie es erneut.',
  generic: 'Meme-Erstellung fehlgeschlagen. Erneut versuchen.'
}
};

async function getErrorMessage(error: unknown): Promise<string> {
  const { selectedLanguage } = await chrome.storage.local.get(['selectedLanguage']);
  const lang = (selectedLanguage || 'English') as keyof typeof errorMessages;
  const messages = errorMessages[lang] || errorMessages.English;
  
  const errorStr = error instanceof Error ? error.message : String(error);
  
  if (errorStr.includes('quota') || errorStr.includes('QuotaBytes')) {
    return messages.storageFull;
  }
  if (errorStr.includes('API key') || errorStr.includes('401') || errorStr.includes('403')) {
    return messages.apiKey;
  }
  if (errorStr.includes('Network') || errorStr.includes('fetch') || errorStr.includes('timeout')) {
    return messages.network;
  }
  if (errorStr.includes('429') || errorStr.includes('rate limit') || errorStr.includes('API exhausted')) {
    return messages.rateLimit;
  }
  
  return messages.generic;
}

export async function generateMeme(text: string): Promise<void> {
  console.log('[Chuckle] Starting meme generation for text:', text.slice(0, 50));
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
      language: 'English'
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
    showError(errorMsg);
  }
}


