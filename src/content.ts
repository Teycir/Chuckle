import { showLoading, hideLoading } from './loading';
import { logger } from './logger';
import { analyzeMemeContext, generateMemeImage } from './geminiService';
import { createOverlay } from './overlay';
import { saveMeme } from './storage';

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

export async function generateMeme(text: string): Promise<void> {
  console.log('[Chuckle] Starting meme generation for text:', text.slice(0, 50));
  try {
    showLoading('Generating meme...');
    const truncatedText = text.slice(0, 100);
    const template = await analyzeMemeContext(truncatedText);
    console.log('[Chuckle] Template selected:', template);
    const imageUrl = await generateMemeImage(template, truncatedText);
    
    const memeData = {
      text: truncatedText,
      imageUrl,
      template,
      timestamp: Date.now(),
      language: 'English'
    };
    
    await saveMeme(memeData);
    console.log('[Chuckle] Meme saved, creating overlay');
    hideLoading();
    await createOverlay(memeData);
    console.log('[Chuckle] Overlay created');
  } catch (error) {
    hideLoading();
    logger.error('Meme generation failed', error);
    showError('Failed to generate meme. Please try again.');
  }
}


