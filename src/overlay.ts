import type { MemeData } from './types';
import { simpleHash, updateMeme } from './storage';
import { enableShortcuts, disableShortcuts, registerShortcut } from './shortcuts';
import { analyzeMemeContext, generateMemeImage } from './geminiService';
import { showLoading, hideLoading } from './loading';
import { createShareButton } from './social-share';

const overlayTranslations = {
  English: {
    downloadPng: 'Download',
    tryAnother: 'Regenerate',
    closeMeme: 'Close',
    regenerating: '🎲 Regenerating meme...',
    regenerationFailed: '❌ Regeneration failed',
    downloaded: 'Downloaded!',
    downloadFailed: 'Download failed'
  },
  Spanish: {
    downloadPng: 'Descargar',
    tryAnother: 'Regenerar',
    closeMeme: 'Cerrar',
    regenerating: '🎲 Regenerando meme...',
    regenerationFailed: '❌ Regeneración fallida',
    downloaded: '¡Descargado!',
    downloadFailed: 'Descarga fallida'
  },
  French: {
    downloadPng: 'Télécharger',
    tryAnother: 'Regénérer',
    closeMeme: 'Fermer',
    regenerating: '🎲 Regénération du meme...',
    regenerationFailed: '❌ Échec de la regénération',
    downloaded: 'Téléchargé!',
    downloadFailed: 'Échec du téléchargement'
  },
  German: {
    downloadPng: 'Herunterladen',
    tryAnother: 'Regenerieren',
    closeMeme: 'Schließen',
    regenerating: '🎲 Meme wird regeneriert...',
    regenerationFailed: '❌ Regenerierung fehlgeschlagen',
    downloaded: 'Heruntergeladen!',
    downloadFailed: 'Download fehlgeschlagen'
  }
};

let currentLanguage = 'English';

async function loadLanguage(): Promise<void> {
  const { selectedLanguage } = await chrome.storage.local.get(['selectedLanguage']);
  currentLanguage = selectedLanguage || 'English';
}

function getTranslation(key: keyof typeof overlayTranslations.English): string {
  const lang = currentLanguage as keyof typeof overlayTranslations;
  return overlayTranslations[lang]?.[key] || overlayTranslations.English[key];
}



let currentOverlay: HTMLElement | null = null;
let currentMemeKey: string | null = null;
let currentMemeData: MemeData | null = null;
let originalText: string | null = null;
let originalImageUrl: string | null = null;
let isRegenerating = false;

function createButton(className: string, text: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = className;
  btn.textContent = text;
  btn.onclick = onClick;
  return btn;
}

async function downloadPng(): Promise<void> {
  if (!currentMemeData) return;
  try {
    const response = await fetch(currentMemeData.imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meme-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(getTranslation('downloaded'));
  } catch {
    showToast(getTranslation('downloadFailed'));
  }
}

function createDownloadButton(): HTMLDivElement {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 4px;';
  
  const downloadBtn = createButton('star-btn', '⬇️', downloadPng);
  downloadBtn.setAttribute('aria-label', getTranslation('downloadPng'));
  downloadBtn.setAttribute('role', 'button');
  
  const label = document.createElement('div');
  label.textContent = getTranslation('downloadPng');
  label.style.cssText = 'font-size: 10px; color: #5f6368; font-weight: 500;';
  
  container.appendChild(downloadBtn);
  container.appendChild(label);
  return container;
}

function createCloseButton(): HTMLDivElement {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 4px;';
  
  const closeBtn = createButton('close-btn', '×', closeOverlay);
  closeBtn.setAttribute('aria-label', getTranslation('closeMeme'));
  closeBtn.setAttribute('role', 'button');
  
  const label = document.createElement('div');
  label.textContent = getTranslation('closeMeme');
  label.style.cssText = 'font-size: 10px; color: #5f6368; font-weight: 500;';
  
  container.appendChild(closeBtn);
  container.appendChild(label);
  return container;
}

async function regenerateMeme(): Promise<void> {
  if (!originalText || isRegenerating) return;
  isRegenerating = true;
  
  showLoading(getTranslation('regenerating'));
  
  try {
    const truncatedText = originalText.slice(0, 100);
    const template = await analyzeMemeContext(truncatedText, Date.now());
    const { watermarkedUrl, originalUrl } = await generateMemeImage(template, truncatedText);
    
    if (currentMemeData && currentOverlay) {
      currentMemeData.imageUrl = watermarkedUrl;
      currentMemeData.template = template;
      currentMemeData.timestamp = Date.now();
      originalImageUrl = originalUrl;
      
      const img = currentOverlay.querySelector('.meme-image') as HTMLImageElement;
      if (img) img.src = watermarkedUrl;
      
      const actionsContainer = currentOverlay.querySelector('.meme-actions');
      if (actionsContainer) {
        const oldShareBtn = actionsContainer.children[2];
        const newShareBtn = createShareButton(originalUrl, truncatedText, currentLanguage);
        actionsContainer.replaceChild(newShareBtn, oldShareBtn);
      }
      
      if (currentMemeKey) {
        await updateMeme(currentMemeKey, { imageUrl: watermarkedUrl, originalUrl, template, timestamp: currentMemeData.timestamp });
      }
    }
  } catch (error) {
    console.error('Regeneration failed:', error);
    showToast(getTranslation('regenerationFailed'));
  } finally {
    hideLoading();
    isRegenerating = false;
  }
}

function createRegenerateButton(): HTMLDivElement {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 4px;';
  
  const regenBtn = createButton('regenerate-btn', '🎲', regenerateMeme);
  regenBtn.setAttribute('aria-label', getTranslation('tryAnother'));
  regenBtn.setAttribute('role', 'button');
  
  const label = document.createElement('div');
  label.textContent = getTranslation('tryAnother');
  label.style.cssText = 'font-size: 10px; color: #5f6368; font-weight: 500;';
  
  container.appendChild(regenBtn);
  container.appendChild(label);
  return container;
}

function createMemeImage(memeData: MemeData): HTMLImageElement {
  const img = document.createElement('img');
  img.className = 'meme-image';
  img.src = memeData.imageUrl;
  img.alt = `Meme: ${memeData.text}`;
  img.ondblclick = regenerateMeme;
  img.style.cursor = 'pointer';
  return img;
}

function createMemeText(memeData: MemeData): HTMLDivElement {
  const text = document.createElement('div');
  text.className = 'meme-text';
  text.contentEditable = 'true';
  text.textContent = memeData.text;
  text.onblur = async () => {
    const newText = text.textContent?.trim() || memeData.text;
    if (newText !== memeData.text && currentMemeKey) {
      memeData.text = newText;
      originalText = newText;
      await updateMeme(currentMemeKey, { text: newText });
    }
  };
  return text;
}



function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

export async function createOverlay(memeData: MemeData): Promise<void> {
  if (currentOverlay) closeOverlay();

  await loadLanguage();
  const { darkMode } = await chrome.storage.local.get(['darkMode']);

  const overlay = document.createElement('div');
  overlay.className = `meme-overlay${darkMode ? ' dark' : ''}`;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const content = document.createElement('div');
  content.className = 'meme-content';

  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'meme-actions';
  actionsContainer.appendChild(createDownloadButton());
  actionsContainer.appendChild(createRegenerateButton());
  actionsContainer.appendChild(createShareButton(memeData.originalUrl || memeData.imageUrl, memeData.text, currentLanguage));
  actionsContainer.appendChild(createCloseButton());

  originalText = memeData.text;
  originalImageUrl = memeData.originalUrl || memeData.imageUrl;

  currentMemeKey = `meme_${simpleHash(memeData.text + memeData.timestamp)}`;
  currentMemeData = memeData;

  content.appendChild(actionsContainer);
  content.appendChild(createMemeImage(memeData));
  content.appendChild(createMemeText(memeData));
  overlay.appendChild(content);

  overlay.onclick = (e) => e.target === overlay && closeOverlay();
  content.onclick = (e) => e.stopPropagation();

  document.body.style.overflow = 'hidden';
  document.body.appendChild(overlay);
  currentOverlay = overlay;
  enableShortcuts();

  registerShortcut('regenerate', regenerateMeme);
  registerShortcut('download', downloadPng);

  const closeButton = overlay.querySelector('.close-btn') as HTMLButtonElement;
  closeButton?.focus();

  let escapeHandler: ((e: KeyboardEvent) => void) | null = null;
  escapeHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeOverlay();
      if (escapeHandler) document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

export function closeOverlay(): void {
  if (currentOverlay) {
    currentOverlay.remove();
    currentOverlay = null;
    currentMemeKey = null;
    currentMemeData = null;
    originalText = null;
    originalImageUrl = null;
    document.body.style.overflow = '';
    disableShortcuts();
  }
}

export function isOverlayOpen(): boolean {
  return currentOverlay !== null && document.body.contains(currentOverlay);
}
