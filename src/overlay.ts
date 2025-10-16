import type { MemeData } from './types';
import { simpleHash, updateMeme } from './storage';
import { enableShortcuts, disableShortcuts, registerShortcut } from './shortcuts';
import { analyzeMemeContext, generateMemeImage } from './geminiService';
import { showLoading, hideLoading } from './loading';
import { createShareButton } from './social-share';
import { MEME_TEMPLATES } from './constants';

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
let currentTemplate: string | null = null;
let isManualEdit = false;

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

async function regenerateMeme(specificTemplate?: string): Promise<void> {
  if (!originalText || isRegenerating) return;
  isRegenerating = true;
  
  showLoading(getTranslation('regenerating'));
  
  try {
    const truncatedText = originalText.slice(0, 100);
    const template = specificTemplate || currentTemplate || await analyzeMemeContext(truncatedText, Date.now());
    currentTemplate = template;
    const wasManualEdit = isManualEdit;
    const { watermarkedUrl, originalUrl, formattedText } = await generateMemeImage(template, truncatedText, isManualEdit);
    isManualEdit = false;
    
    if (currentMemeData && currentOverlay) {
      currentMemeData.imageUrl = watermarkedUrl;
      currentMemeData.text = formattedText;
      currentMemeData.template = template;
      currentMemeData.timestamp = Date.now();
      originalImageUrl = originalUrl;
      
      if (!wasManualEdit) {
        originalText = formattedText;
      }
      
      const img = currentOverlay.querySelector('.meme-image') as HTMLImageElement;
      if (img) img.src = watermarkedUrl;
      
      const textInput = currentOverlay.querySelector('.text-editor-input') as HTMLDivElement;
      if (textInput) textInput.textContent = originalText;
      
      const actionsContainer = currentOverlay.querySelector('.meme-actions');
      if (actionsContainer) {
        const oldShareBtn = actionsContainer.children[1];
        const newShareBtn = createShareButton(originalUrl, formattedText, currentLanguage);
        actionsContainer.replaceChild(newShareBtn, oldShareBtn);
      }
      
      const templateButtons = currentOverlay.querySelectorAll('.template-btn');
      templateButtons.forEach(btn => btn.classList.remove('active'));
      const activeBtn = currentOverlay.querySelector(`[data-template="${template}"]`);
      activeBtn?.classList.add('active');
      
      if (currentMemeKey) {
        await updateMeme(currentMemeKey, { imageUrl: originalUrl, originalUrl, template, timestamp: currentMemeData.timestamp });
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



function createMemeImage(memeData: MemeData): HTMLImageElement {
  const img = document.createElement('img');
  img.className = 'meme-image';
  img.src = memeData.imageUrl;
  img.alt = `Meme: ${memeData.text}`;
  img.ondblclick = () => regenerateMeme();
  img.style.cursor = 'pointer';
  return img;
}

function createTextEditor(): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 8px; padding: 16px 0; border-bottom: 1px solid #e8eaed; width: 100%;';
  
  const label = document.createElement('div');
  label.textContent = 'Edit meme text (press Enter to regenerate):';
  label.style.cssText = 'font-size: 12px; color: #5f6368; font-weight: 600;';
  
  const input = document.createElement('div');
  input.className = 'text-editor-input meme-text';
  input.contentEditable = 'true';
  input.textContent = originalText || '';
  input.style.cssText = 'padding: 8px 12px; border: 1px solid #dadce0; border-radius: 4px; font-size: 14px; width: 100%; box-sizing: border-box; min-height: 40px; background: white; color: black;';
  
  input.onblur = async () => {
    const newText = input.textContent?.trim() || '';
    if (newText && newText !== originalText) {
      originalText = newText;
      isManualEdit = true;
      await regenerateMeme();
    }
  };
  
  input.onkeydown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newText = input.textContent?.trim() || '';
      if (newText) {
        originalText = newText;
        isManualEdit = true;
        await regenerateMeme();
      }
    }
  };
  
  wrapper.appendChild(label);
  wrapper.appendChild(input);
  return wrapper;
}

function createRegenerateButton(): HTMLDivElement {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 16px; margin-bottom: 8px;';
  
  const btn = createButton('star-btn regenerate-btn', '🎲', () => regenerateMeme());
  btn.setAttribute('aria-label', getTranslation('tryAnother'));
  btn.setAttribute('role', 'button');
  
  const label = document.createElement('div');
  label.textContent = getTranslation('tryAnother');
  label.style.cssText = 'font-size: 12px; color: #5f6368; font-weight: 600;';
  
  container.appendChild(btn);
  container.appendChild(label);
  return container;
}

function createTemplateSelector(): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px 0; border-bottom: 1px solid #e8eaed; width: 100%;';
  
  const heading = document.createElement('div');
  heading.textContent = 'Choose template for meme';
  heading.style.cssText = 'font-size: 12px; color: #5f6368; font-weight: 600; margin-bottom: 4px;';
  wrapper.appendChild(heading);
  
  const templatesRow = document.createElement('div');
  templatesRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 2px; justify-content: center; max-width: 800px;';
  
  MEME_TEMPLATES.forEach((template) => {
    const btn = document.createElement('button');
    btn.className = 'template-btn';
    btn.textContent = template.name;
    btn.setAttribute('data-template', template.id);
    btn.onclick = () => regenerateMeme(template.id);
    templatesRow.appendChild(btn);
  });
  
  wrapper.appendChild(templatesRow);
  return wrapper;
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
  actionsContainer.appendChild(createShareButton(memeData.originalUrl || memeData.imageUrl, memeData.text, currentLanguage));
  actionsContainer.appendChild(createCloseButton());

  originalText = memeData.text;
  originalImageUrl = memeData.originalUrl || memeData.imageUrl;
  currentTemplate = memeData.template;

  currentMemeKey = `meme_${simpleHash(memeData.text + memeData.timestamp)}`;
  currentMemeData = memeData;

  content.appendChild(actionsContainer);
  content.appendChild(createTextEditor());
  content.appendChild(createTemplateSelector());
  content.appendChild(createRegenerateButton());
  
  const imgWrapper = document.createElement('div');
  imgWrapper.style.cssText = 'display: flex; justify-content: center; width: 100%;';
  imgWrapper.appendChild(createMemeImage(memeData));
  content.appendChild(imgWrapper);
  overlay.appendChild(content);
  
  const currentTemplateBtn = overlay.querySelector(`[data-template="${memeData.template}"]`);
  if (currentTemplateBtn) {
    currentTemplateBtn.classList.add('active');
  }

  overlay.onclick = (e) => e.target === overlay && closeOverlay();
  content.onclick = (e) => e.stopPropagation();

  document.body.style.overflow = 'hidden';
  document.body.appendChild(overlay);
  currentOverlay = overlay;
  enableShortcuts();

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
    currentTemplate = null;
    isManualEdit = false;
    document.body.style.overflow = '';
    disableShortcuts();
  }
}

export function isOverlayOpen(): boolean {
  return currentOverlay !== null && document.body.contains(currentOverlay);
}
