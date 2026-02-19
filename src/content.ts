import { showLoading, hideLoading } from './loading';
import { logger } from './logger';
import { analyzeMemeContext, generateMemeImage } from './memeService';
import { createOverlay } from './overlay';
import { saveMeme } from './storage';
import { performCleanup, shouldCleanup } from './cleanup';
import { StatusIndicator } from './statusIndicator';

function showError(message: string): void {
  try {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'chuckle-meme-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#c5221f;color:#fff;padding:15px 20px;border-radius:8px;z-index:2147483647;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:14px;max-width:400px;word-wrap:break-word;font-family:system-ui,-apple-system,sans-serif;';

    if (document.body) {
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        try {
          if (errorDiv.parentNode) {
            errorDiv.remove();
          }
        } catch (e) {
        }
      }, 5000);
    } else {
    }
  } catch (error) {
  }
}

// Initialize conflict detection
// Initialize with proper error handling
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeChuckle);
} else {
  initializeChuckle();
}

function initializeChuckle() {
  try {
    // Skip initialization on problematic pages
    const url = globalThis.location.href;
    const problematicDomains = [
      'chrome://',
      'chrome-extension://',
      'moz-extension://',
      'about:',
      'file://'
    ];

    if (problematicDomains.some(domain => url.startsWith(domain))) {
      return;
    }





  } catch (error) {
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  try {
    if (message.action === "generateMeme") {
      generateMeme(message.text).catch(error => {
      });
      sendResponse({ success: true });
    } else if (message.action === "generateMemeFromSelection") {
      const selectedText = globalThis.getSelection()?.toString().trim();
      if (selectedText) {
        generateMeme(selectedText).catch(error => {
        });
      } else {
        showError('Please select some text first');
      }
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    sendResponse({ success: false, error: errorMsg });
  }

  return true; // Keep message channel open
});

const errorMessages = {
  English: {
    storageFull: 'Chrome storage full. Clear old memes in History.',
    network: 'Network error. Check internet connection.',
    generic: 'Meme generation failed. Try again.',
  },
  Spanish: {
    storageFull: 'Almacenamiento lleno. Borra memes antiguos.',
    network: 'Error de red. Verifica tu conexión.',
    generic: 'Error al generar meme. Intenta de nuevo.',
  },
  French: {
    storageFull: 'Stockage plein. Supprimez anciens memes.',
    network: 'Erreur réseau. Vérifiez connexion internet.',
    generic: 'Échec génération meme. Réessayez.',
  },
  German: {
    storageFull: 'Speicher voll. Alte Memes löschen.',
    network: 'Netzwerkfehler. Internetverbindung prüfen.',
    generic: 'Meme-Erstellung fehlgeschlagen. Erneut versuchen.',
  }
};

async function getErrorMessage(error: unknown): Promise<string> {
  const { selectedLanguage } = await chrome.storage.local.get(['selectedLanguage']);
  const lang = (selectedLanguage || 'English') as keyof typeof errorMessages;
  const messages = errorMessages[lang] || errorMessages.English;

  const errorStr = error instanceof Error ? error.message : String(error);
  const lowerError = errorStr.toLowerCase();

  // Check for specific errors first (most specific to least specific)
  // Check for specific errors first (most specific to least specific)
  if (lowerError.includes('quota') || lowerError.includes('quotabytes')) {
    return messages.storageFull;
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

  // Show status indicator
  await StatusIndicator.show();

  // Auto-cleanup if needed
  if (await shouldCleanup()) {
    const result = await performCleanup();
    if (result.removed > 0) {
    }
  }

  const wordCount = text.trim().split(/\s+/).length;

  // Word count Check removed for manual mode
  if (wordCount === 0) {
    showError('Please select some text.');
    return;
  }

  try {
    showLoading('Generating meme...');
    const truncatedText = text.slice(0, 1000);
    const template = await analyzeMemeContext(truncatedText);
    const { originalUrl, formattedText } = await generateMemeImage(template, truncatedText);

    const memeData = {
      text: formattedText,
      imageUrl: originalUrl,
      originalUrl,
      template,
      timestamp: Date.now(),
      language: 'English',
      originalInput: truncatedText
    };



    const memeId = await saveMeme(memeData);
    hideLoading();
    await createOverlay(memeData, memeId);
  } catch (error) {
    hideLoading();
    logger.error('Meme generation failed', error);
    const errorMsg = await getErrorMessage(error);
    showError(errorMsg);
  }
}


