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
    templateTooltip: 'Click to generate',
    textboxPlaceholder: 'Change text then press Enter',
    invalidRequest: 'Invalid request. Text may be too long or contain invalid characters.'
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
    templateTooltip: 'Haz clic para generar',
    textboxPlaceholder: 'Cambia el texto y presiona Enter',
    invalidRequest: 'Solicitud inválida. El texto puede ser demasiado largo o contener caracteres inválidos.'
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
    templateTooltip: 'Cliquez pour générer',
    textboxPlaceholder: 'Modifiez le texte puis appuyez sur Entrée',
    invalidRequest: 'Requête invalide. Le texte peut être trop long ou contenir des caractères invalides.'
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
    templateTooltip: 'Klicken Sie zum Generieren',
    textboxPlaceholder: 'Text ändern und Enter drücken',
    invalidRequest: 'Ungültige Anfrage. Text kann zu lang sein oder ungültige Zeichen enthalten.'
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
let originalInput: string | null = null;
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

function createDownloadButton(): HTMLButtonElement {
  const downloadBtn = createButton('chuckle-star-btn', '↓', downloadPng);
  downloadBtn.style.fontWeight = '900';
  downloadBtn.setAttribute('aria-label', getTranslation('downloadPng'));
  downloadBtn.setAttribute('role', 'button');
  return downloadBtn;
}

function createCloseButton(): HTMLButtonElement {
  const closeBtn = createButton('chuckle-close-btn', '×', closeOverlay);
  closeBtn.setAttribute('aria-label', getTranslation('closeMeme'));
  closeBtn.setAttribute('role', 'button');
  return closeBtn;
}

async function regenerateMeme(specificTemplate?: string): Promise<void> {
  if (!originalInput || isRegenerating) return;
  isRegenerating = true;
  
  showLoading(getTranslation('regenerating'));
  
  try {
    const textToUse = isManualEdit ? originalText : originalInput;
    console.log('[Chuckle] Regenerating with text:', textToUse, 'originalInput:', originalInput, 'specificTemplate:', specificTemplate);
    const truncatedText = textToUse?.slice(0, 100) || '';
    const template = specificTemplate || (isManualEdit && currentTemplate) || await analyzeMemeContext(originalInput?.slice(0, 100) || '', Date.now());
    currentTemplate = template;
    const skipFormatting = isManualEdit;
    const forceRegenerate = !!specificTemplate;
    const { watermarkedUrl, originalUrl, formattedText } = await generateMemeImage(template, truncatedText, skipFormatting, forceRegenerate);
    isManualEdit = false;
    
    if (currentMemeData && currentOverlay) {
      currentMemeData.imageUrl = watermarkedUrl;
      currentMemeData.text = formattedText;
      currentMemeData.template = template;
      currentMemeData.timestamp = Date.now();
      originalText = formattedText;
      if (!isManualEdit) {
        originalInput = currentMemeData.originalInput || originalInput;
      }
      
      const img = currentOverlay.querySelector('.chuckle-meme-image') as HTMLImageElement;
      if (img) {
        img.src = watermarkedUrl;
        img.setAttribute('data-template', template);
      }
      
      const textInput = currentOverlay.querySelector('.chuckle-text-editor-input') as HTMLDivElement;
      if (textInput) textInput.innerText = formattedText;
      
      const actionsContainer = currentOverlay.querySelector('.chuckle-meme-actions');
      if (actionsContainer) {
        const oldShareBtn = actionsContainer.children[1];
        const newShareBtn = createShareButton(originalUrl, formattedText, currentLanguage);
        actionsContainer.replaceChild(newShareBtn, oldShareBtn);
      }
      
      const templateButtons = currentOverlay.querySelectorAll('.chuckle-template-btn');
      templateButtons.forEach(btn => btn.classList.remove('active'));
      const activeBtn = currentOverlay.querySelector(`[data-template="${template}"]`);
      activeBtn?.classList.add('active');
      
      if (currentMemeKey) {
        await updateMeme(currentMemeKey, { imageUrl: originalUrl, originalUrl, template, timestamp: currentMemeData.timestamp, text: currentMemeData.text });
      }
    }
  } catch (error) {
    console.error('Regeneration failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    showError(errorMessage);
  } finally {
    hideLoading();
    isRegenerating = false;
  }
}



function createMemeImage(memeData: MemeData): HTMLImageElement {
  const img = document.createElement('img');
  img.className = 'chuckle-meme-image';
  img.src = memeData.imageUrl;
  img.alt = `Meme: ${memeData.text}`;
  img.ondblclick = () => regenerateMeme();
  img.style.cursor = 'pointer';
  img.setAttribute('data-template', memeData.template);
  return img;
}

function createTextEditor(): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display: flex; justify-content: center; align-items: center; padding: 8px 0; width: 100%;';
  
  const input = document.createElement('div');
  input.className = 'chuckle-text-editor-input chuckle-meme-text';
  input.contentEditable = 'true';
  input.setAttribute('data-placeholder', getTranslation('textboxPlaceholder'));
  input.style.cssText = 'padding: 8px 16px; border: 1px solid #dadce0; border-radius: 8px; font-size: 14px; max-width: 90vw; width: 100%; box-sizing: border-box; min-height: 40px; background: white; color: #9aa0a6;';
  
  setTimeout(() => {
    input.innerText = originalText || '';
    input.style.color = 'black';
  }, 3000);
  
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
    btn.className = 'chuckle-template-btn';
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
  toast.className = 'chuckle-toast-notification';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function showError(message: string): void {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'chuckle-meme-error';
  errorDiv.textContent = message;
  errorDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#c5221f;color:#fff;padding:15px 20px;border-radius:8px;z-index:2147483646;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:14px;max-width:400px;word-wrap:break-word;';
  document.body.appendChild(errorDiv);
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

export async function createOverlay(memeData: MemeData): Promise<void> {
  if (currentOverlay) closeOverlay();

  await loadLanguage();
  const { darkMode, offlineMode } = await chrome.storage.local.get(['darkMode', 'offlineMode']);
  const isDark = darkMode !== undefined ? darkMode : true;

  const overlay = document.createElement('div');
  overlay.className = `chuckle-meme-overlay${isDark ? ' chuckle-dark' : ''}`;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const content = document.createElement('div');
  content.className = 'chuckle-meme-content';

  originalText = memeData.text;
  originalInput = memeData.originalInput || memeData.text;
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
  actionsContainer.className = 'chuckle-meme-actions';
  actionsContainer.style.cssText = 'position: absolute; left: 8px; top: 8px; display: flex; flex-direction: column; gap: 12px;';
  actionsContainer.appendChild(createDownloadButton());
  actionsContainer.appendChild(createShareButton(memeData.originalUrl || memeData.imageUrl, memeData.text, currentLanguage));
  actionsContainer.appendChild(createCloseButton());
  
  if (offlineMode) {
    const offlineIndicator = document.createElement('div');
    offlineIndicator.textContent = '📴';
    offlineIndicator.style.cssText = 'font-size: 20px; opacity: 0.7; margin-top: 8px;';
    actionsContainer.appendChild(offlineIndicator);
  }
  
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

  const closeButton = overlay.querySelector('.chuckle-close-btn') as HTMLButtonElement;
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
    originalInput = null;
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
