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
    downloadFailed: 'Download failed',
    textboxTooltip: 'You can change text and press Enter to update it on meme',
    templateTooltip: 'Click to generate'
  },
  Spanish: {
    downloadPng: 'Descargar',
    tryAnother: 'Regenerar',
    closeMeme: 'Cerrar',
    regenerating: '🎲 Regenerando meme...',
    regenerationFailed: '❌ Regeneración fallida',
    downloaded: '¡Descargado!',
    downloadFailed: 'Descarga fallida',
    textboxTooltip: 'Puedes cambiar el texto y presionar Enter para actualizarlo en el meme',
    templateTooltip: 'Haz clic para generar'
  },
  French: {
    downloadPng: 'Télécharger',
    tryAnother: 'Regénérer',
    closeMeme: 'Fermer',
    regenerating: '🎲 Regénération du meme...',
    regenerationFailed: '❌ Échec de la regénération',
    downloaded: 'Téléchargé!',
    downloadFailed: 'Échec du téléchargement',
    textboxTooltip: 'Vous pouvez modifier le texte et appuyer sur Entrée pour le mettre à jour sur le meme',
    templateTooltip: 'Cliquez pour générer'
  },
  German: {
    downloadPng: 'Herunterladen',
    tryAnother: 'Regenerieren',
    closeMeme: 'Schließen',
    regenerating: '🎲 Meme wird regeneriert...',
    regenerationFailed: '❌ Regenerierung fehlgeschlagen',
    downloaded: 'Heruntergeladen!',
    downloadFailed: 'Download fehlgeschlagen',
    textboxTooltip: 'Sie können den Text ändern und Enter drücken, um ihn im Meme zu aktualisieren',
    templateTooltip: 'Klicken Sie zum Generieren'
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
let baseText: string | null = null;
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
    const textToUse = (specificTemplate && baseText) ? baseText : originalText;
    const truncatedText = textToUse.slice(0, 100);
    const template = specificTemplate || currentTemplate || await analyzeMemeContext(truncatedText, Date.now());
    currentTemplate = template;
    const { watermarkedUrl, originalUrl, formattedText } = await generateMemeImage(template, truncatedText, isManualEdit);
    isManualEdit = false;
    
    if (currentMemeData && currentOverlay) {
      currentMemeData.imageUrl = watermarkedUrl;
      currentMemeData.text = formattedText;
      currentMemeData.template = template;
      currentMemeData.timestamp = Date.now();
      originalImageUrl = originalUrl;
      originalText = formattedText;
      
      const img = currentOverlay.querySelector('.meme-image') as HTMLImageElement;
      if (img) img.src = watermarkedUrl;
      
      const textInput = currentOverlay.querySelector('.text-editor-input') as HTMLDivElement;
      if (textInput) textInput.innerText = formattedText;
      
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
        await updateMeme(currentMemeKey, { imageUrl: originalUrl, originalUrl, template, timestamp: currentMemeData.timestamp, text: currentMemeData.text });
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
  wrapper.style.cssText = 'display: flex; justify-content: center; align-items: center; padding: 8px 0; width: 100%;';
  
  const input = document.createElement('div');
  input.className = 'text-editor-input meme-text';
  input.contentEditable = 'true';
  input.innerText = originalText || '';
  input.setAttribute('data-placeholder', 'Change text then click enter');
  input.style.cssText = 'padding: 8px 16px; border: 1px solid #dadce0; border-radius: 8px; font-size: 14px; max-width: 90vw; width: 100%; box-sizing: border-box; min-height: 40px; background: white; color: black;';
  
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
  
  wrapper.appendChild(input);
  return wrapper;
}

function createTemplateSelector(): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px 0 8px 0; width: 100%;';
  
  const templatesRow = document.createElement('div');
  templatesRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; max-width: 90vw; width: 100%;';
  
  MEME_TEMPLATES.forEach((template) => {
    const btn = document.createElement('button');
    btn.className = 'template-btn';
    btn.textContent = template.name;
    btn.setAttribute('data-template', template.id);
    btn.onclick = () => {
      isManualEdit = false;
      regenerateMeme(template.id);
    };
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

  originalText = memeData.text;
  baseText = memeData.text;
  originalImageUrl = memeData.originalUrl || memeData.imageUrl;
  currentTemplate = memeData.template;

  currentMemeKey = `meme_${simpleHash(memeData.text + memeData.timestamp)}`;
  currentMemeData = memeData;

  content.appendChild(createTemplateSelector());
  content.appendChild(createTextEditor());
  
  const imgWrapper = document.createElement('div');
  imgWrapper.style.cssText = 'display: flex; justify-content: center; align-items: flex-start; width: 100%; position: relative;';
  imgWrapper.appendChild(createMemeImage(memeData));
  
  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'meme-actions';
  actionsContainer.style.cssText = 'position: absolute; right: 0; top: 0; display: flex; flex-direction: column; gap: 16px;';
  actionsContainer.appendChild(createDownloadButton());
  actionsContainer.appendChild(createShareButton(memeData.originalUrl || memeData.imageUrl, memeData.text, currentLanguage));
  actionsContainer.appendChild(createCloseButton());
  imgWrapper.appendChild(actionsContainer);
  
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
    baseText = null;
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
