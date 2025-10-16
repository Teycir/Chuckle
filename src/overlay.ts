import type { MemeData } from './types';
import { simpleHash, updateMeme } from './storage';
import { enableShortcuts, disableShortcuts, registerShortcut } from './shortcuts';
import { analyzeMemeContext, generateMemeImage } from './geminiService';
import { showLoading, hideLoading } from './loading';
import { createShareButton } from './social-share';

const overlayTranslations = {
  English: {
    downloadPng: 'Download PNG (D)',
    tryAnother: 'Try Another (R)',
    doubleClickRegenerate: 'Double-click to regenerate',
    clickToEdit: 'Click to edit text',
    closeMeme: 'Close meme overlay',
    regenerating: '🎲 Regenerating meme...',
    regenerationFailed: '❌ Regeneration failed',
    downloaded: 'Downloaded!',
    downloadFailed: 'Download failed'
  },
  Spanish: {
    downloadPng: 'Descargar PNG (D)',
    tryAnother: 'Probar Otro (R)',
    doubleClickRegenerate: 'Doble clic para regenerar',
    clickToEdit: 'Clic para editar texto',
    closeMeme: 'Cerrar meme',
    regenerating: '🎲 Regenerando meme...',
    regenerationFailed: '❌ Regeneración fallida',
    downloaded: '¡Descargado!',
    downloadFailed: 'Descarga fallida'
  },
  French: {
    downloadPng: 'Télécharger PNG (D)',
    tryAnother: 'Essayer un Autre (R)',
    doubleClickRegenerate: 'Double-clic pour regénérer',
    clickToEdit: 'Cliquer pour éditer le texte',
    closeMeme: 'Fermer le meme',
    regenerating: '🎲 Regénération du meme...',
    regenerationFailed: '❌ Échec de la regénération',
    downloaded: 'Téléchargé!',
    downloadFailed: 'Échec du téléchargement'
  },
  German: {
    downloadPng: 'PNG Herunterladen (D)',
    tryAnother: 'Anderen Versuchen (R)',
    doubleClickRegenerate: 'Doppelklick zum Regenerieren',
    clickToEdit: 'Klicken zum Bearbeiten',
    closeMeme: 'Meme schließen',
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

function createDownloadButton(): HTMLButtonElement {
  const downloadBtn = createButton('star-btn', '⬇️', downloadPng);
  const tooltip = getTranslation('downloadPng');
  downloadBtn.setAttribute('aria-label', tooltip);
  downloadBtn.setAttribute('role', 'button');
  downloadBtn.setAttribute('data-tooltip', tooltip);
  return downloadBtn;
}

function createCloseButton(): HTMLButtonElement {
  const closeBtn = createButton('close-btn', '×', closeOverlay);
  const tooltip = getTranslation('closeMeme');
  closeBtn.setAttribute('aria-label', tooltip);
  closeBtn.setAttribute('role', 'button');
  closeBtn.setAttribute('data-tooltip', tooltip);
  return closeBtn;
}

async function regenerateMeme(): Promise<void> {
  if (!originalText || isRegenerating) return;
  isRegenerating = true;
  
  showLoading(getTranslation('regenerating'));
  
  try {
    const truncatedText = originalText.slice(0, 100);
    const template = await analyzeMemeContext(truncatedText, Date.now());
    const imageUrl = await generateMemeImage(template, truncatedText);
    
    if (currentMemeData) {
      currentMemeData.imageUrl = imageUrl;
      currentMemeData.template = template;
      currentMemeData.timestamp = Date.now();
      
      const img = currentOverlay?.querySelector('.meme-image') as HTMLImageElement;
      if (img) img.src = imageUrl;
      
      if (currentMemeKey) {
        await updateMeme(currentMemeKey, { imageUrl, template, timestamp: currentMemeData.timestamp });
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

function createRegenerateButton(): HTMLButtonElement {
  const regenBtn = createButton('regenerate-btn', '🎲', regenerateMeme);
  const tooltip = getTranslation('tryAnother');
  regenBtn.setAttribute('aria-label', tooltip);
  regenBtn.setAttribute('role', 'button');
  regenBtn.setAttribute('data-tooltip', tooltip);
  return regenBtn;
}

function createMemeImage(memeData: MemeData): HTMLImageElement {
  const img = document.createElement('img');
  img.className = 'meme-image';
  img.src = memeData.imageUrl;
  img.alt = `Meme: ${memeData.text}`;
  img.ondblclick = regenerateMeme;
  img.style.cursor = 'pointer';
  img.setAttribute('data-tooltip', getTranslation('doubleClickRegenerate'));
  return img;
}

function createMemeText(memeData: MemeData): HTMLDivElement {
  const text = document.createElement('div');
  text.className = 'meme-text';
  text.contentEditable = 'true';
  text.textContent = memeData.text;
  text.setAttribute('data-tooltip', getTranslation('clickToEdit'));
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
  actionsContainer.appendChild(createShareButton(memeData.imageUrl, memeData.text, currentLanguage));
  actionsContainer.appendChild(createCloseButton());

  originalText = memeData.text;

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
    document.body.style.overflow = '';
    disableShortcuts();
  }
}

export function isOverlayOpen(): boolean {
  return currentOverlay !== null && document.body.contains(currentOverlay);
}
