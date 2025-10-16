import type { MemeData } from './types';
import { simpleHash, updateMeme } from './storage';
import { CONFIG } from './config';
import { pushUndo } from './undo';
import { enableShortcuts, disableShortcuts, registerShortcut } from './shortcuts';
import { analyzeMemeContext, generateMemeImage } from './geminiService';
import { showLoading, hideLoading } from './loading';
import { createShareButton } from './social-share';

const overlayTranslations = {
  English: {
    addToFavorites: 'Add to favorites (F)',
    removeFromFavorites: 'Remove from favorites (F)',
    tryAnother: 'Try Another (R)',
    doubleClickRegenerate: 'Double-click to regenerate',
    clickToEdit: 'Click to edit text',
    addTag: 'Add tag... (Press T)',
    clickToAddTag: 'Click to add tag',
    closeMeme: 'Close meme overlay',
    regenerating: '🎲 Regenerating meme...',
    regenerationFailed: '❌ Regeneration failed',
    copiedToClipboard: 'Copied to clipboard',
    copyFailed: 'Copy failed'
  },
  Spanish: {
    addToFavorites: 'Añadir a favoritos (F)',
    removeFromFavorites: 'Quitar de favoritos (F)',
    tryAnother: 'Probar Otro (R)',
    doubleClickRegenerate: 'Doble clic para regenerar',
    clickToEdit: 'Clic para editar texto',
    addTag: 'Añadir etiqueta... (Presiona T)',
    clickToAddTag: 'Clic para añadir etiqueta',
    closeMeme: 'Cerrar meme',
    regenerating: '🎲 Regenerando meme...',
    regenerationFailed: '❌ Regeneración fallida',
    copiedToClipboard: 'Copiado al portapapeles',
    copyFailed: 'Copia fallida'
  },
  French: {
    addToFavorites: 'Ajouter aux favoris (F)',
    removeFromFavorites: 'Retirer des favoris (F)',
    tryAnother: 'Essayer un Autre (R)',
    doubleClickRegenerate: 'Double-clic pour regénérer',
    clickToEdit: 'Cliquer pour éditer le texte',
    addTag: 'Ajouter une étiquette... (Appuyez sur T)',
    clickToAddTag: 'Cliquer pour ajouter une étiquette',
    closeMeme: 'Fermer le meme',
    regenerating: '🎲 Regénération du meme...',
    regenerationFailed: '❌ Échec de la regénération',
    copiedToClipboard: 'Copié dans le presse-papiers',
    copyFailed: 'Échec de la copie'
  },
  German: {
    addToFavorites: 'Zu Favoriten hinzufügen (F)',
    removeFromFavorites: 'Aus Favoriten entfernen (F)',
    tryAnother: 'Anderen Versuchen (R)',
    doubleClickRegenerate: 'Doppelklick zum Regenerieren',
    clickToEdit: 'Klicken zum Bearbeiten',
    addTag: 'Tag hinzufügen... (Drücke T)',
    clickToAddTag: 'Klicken zum Hinzufügen',
    closeMeme: 'Meme schließen',
    regenerating: '🎲 Meme wird regeneriert...',
    regenerationFailed: '❌ Regenerierung fehlgeschlagen',
    copiedToClipboard: 'In Zwischenablage kopiert',
    copyFailed: 'Kopieren fehlgeschlagen'
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

let tagsModule: typeof import('./tags') | null = null;

async function loadTagsModule() {
  if (!tagsModule) {
    tagsModule = await import('./tags');
  }
  return tagsModule;
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

async function toggleFavorite(memeData: MemeData, starBtn: HTMLButtonElement): Promise<void> {
  const oldValue = memeData.isFavorite;
  memeData.isFavorite = !memeData.isFavorite;
  starBtn.textContent = memeData.isFavorite ? '⭐' : '☆';
  const tooltip = memeData.isFavorite ? getTranslation('removeFromFavorites') : getTranslation('addToFavorites');
  starBtn.setAttribute('aria-label', tooltip);
  starBtn.setAttribute('data-tooltip', tooltip);
  if (currentMemeKey) {
    pushUndo({ type: 'favorite', memeKey: currentMemeKey, oldValue, newValue: memeData.isFavorite });
    await updateMeme(currentMemeKey, { isFavorite: memeData.isFavorite });
  }
}

function createStarButton(memeData: MemeData): HTMLButtonElement {
  const starBtn = createButton('star-btn', memeData.isFavorite ? '⭐' : '☆', async () => {
    await toggleFavorite(memeData, starBtn);
  });
  const tooltip = memeData.isFavorite ? getTranslation('removeFromFavorites') : getTranslation('addToFavorites');
  starBtn.setAttribute('aria-label', tooltip);
  starBtn.setAttribute('role', 'button');
  starBtn.setAttribute('data-tooltip', tooltip);
  return starBtn;
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

function createTagBadge(tag: string, memeData: MemeData, renderTags: () => void): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.className = 'tag-badge';
  badge.textContent = tag;

  const removeBtn = document.createElement('span');
  removeBtn.className = 'tag-remove';
  removeBtn.textContent = '×';
  removeBtn.onclick = async () => {
    if (currentMemeKey) {
      const oldTags = [...memeData.tags];
      try {
        const tags = await loadTagsModule();
        await tags.removeTag(currentMemeKey, tag);
        memeData.tags = memeData.tags.filter(t => t !== tag);
        pushUndo({ type: 'tag', memeKey: currentMemeKey, oldValue: oldTags, newValue: memeData.tags });
        renderTags();
      } catch (error) {
        memeData.tags = oldTags;
        renderTags();
      }
    }
  };

  badge.appendChild(removeBtn);
  return badge;
}

function createTagSuggestion(tag: string, memeData: MemeData, tagInput: HTMLInputElement, dropdown: HTMLElement, renderTags: () => void, index: number, highlightedIndexRef: { value: number }): HTMLDivElement {
  const item = document.createElement('div');
  item.className = 'tag-suggestion';
  item.textContent = tag.trim().slice(0, CONFIG.MAX_TAG_LENGTH);
  
  item.onclick = async () => {
    if (currentMemeKey) {
      const oldTags = [...memeData.tags];
      try {
        const tags = await loadTagsModule();
        await tags.addTag(currentMemeKey, tag);
        memeData.tags.push(tag);
        pushUndo({ type: 'tag', memeKey: currentMemeKey, oldValue: oldTags, newValue: memeData.tags });
        renderTags();
        tagInput.value = '';
        dropdown.style.display = 'none';
      } catch (error) {
        memeData.tags = oldTags;
        renderTags();
      }
    }
  };

  item.onmouseenter = () => highlightedIndexRef.value = index;
  
  return item;
}

async function updateAutocompleteDropdown(
  query: string,
  dropdown: HTMLElement,
  memeData: MemeData,
  tagInput: HTMLInputElement,
  renderTags: () => void,
  allTagsRef: { value: string[] },
  highlightedIndexRef: { value: number }
): Promise<void> {
  if (!query.trim()) {
    dropdown.style.display = 'none';
    return;
  }

  const tags = await loadTagsModule();
  
  if (allTagsRef.value.length === 0) {
    allTagsRef.value = await tags.getAllTags();
  }

  const filtered = tags.filterTags(allTagsRef.value, query).filter(tag => !memeData.tags.includes(tag));
  
  if (filtered.length === 0) {
    dropdown.style.display = 'none';
    return;
  }

  while (dropdown.firstChild) dropdown.removeChild(dropdown.firstChild);
  highlightedIndexRef.value = -1;

  filtered.forEach((tag, index) => {
    const item = createTagSuggestion(tag, memeData, tagInput, dropdown, renderTags, index, highlightedIndexRef);
    dropdown.appendChild(item);
  });

  dropdown.style.display = 'block';
}

function handleKeyboardNavigation(
  e: KeyboardEvent,
  dropdown: HTMLElement,
  highlightedIndexRef: { value: number },
  memeData: MemeData,
  tagInput: HTMLInputElement,
  renderTags: () => void
): void {
  const suggestions = dropdown.querySelectorAll('.tag-suggestion');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (suggestions.length > 0) {
      highlightedIndexRef.value = (highlightedIndexRef.value + 1) % suggestions.length;
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (suggestions.length > 0) {
      highlightedIndexRef.value = highlightedIndexRef.value <= 0 ? suggestions.length - 1 : highlightedIndexRef.value - 1;
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (highlightedIndexRef.value >= 0 && suggestions[highlightedIndexRef.value]) {
      (suggestions[highlightedIndexRef.value] as HTMLElement).click();
    } else if (currentMemeKey) {
      const tag = tagInput.value.trim().slice(0, CONFIG.MAX_TAG_LENGTH);
      if (tag && !memeData.tags.includes(tag) && currentMemeKey) {
        const oldTags = [...memeData.tags];
        loadTagsModule().then(tags => {
          tags.addTag(currentMemeKey!, tag).then(() => {
            memeData.tags.push(tag);
            pushUndo({ type: 'tag', memeKey: currentMemeKey!, oldValue: oldTags, newValue: memeData.tags });
            renderTags();
            tagInput.value = '';
            dropdown.style.display = 'none';
          }).catch(() => {
            memeData.tags = oldTags;
            renderTags();
          });
        });
      }
    }
  } else if (e.key === 'Escape') {
    dropdown.style.display = 'none';
  }
}

function createTagsSection(memeData: MemeData): HTMLDivElement {
  const tagsContainer = document.createElement('div');
  tagsContainer.className = 'tags-container';

  const renderTags = async () => {
    const existingInput = tagsContainer.querySelector('.tag-input')?.parentElement;
    while (tagsContainer.firstChild) tagsContainer.removeChild(tagsContainer.firstChild);
    
    const tags = await loadTagsModule();
    const allTags = await tags.getAllTags();
    const recentTags = allTags.slice(0, 3).filter(tag => !memeData.tags.includes(tag));
    
    if (recentTags.length > 0) {
      const quickTags = document.createElement('div');
      quickTags.className = 'quick-tags';
      Object.assign(quickTags.style, {
        display: 'flex',
        gap: '4px',
        marginBottom: '8px',
        flexWrap: 'wrap'
      });
      
      recentTags.forEach(tag => {
        const chip = document.createElement('button');
        chip.className = 'quick-tag-chip';
        chip.textContent = tag;
        chip.title = getTranslation('clickToAddTag');
        chip.onclick = async () => {
          const key = currentMemeKey;
          if (key && !memeData.tags.includes(tag)) {
            const oldTags = [...memeData.tags];
            await tags.addTag(key, tag);
            memeData.tags.push(tag);
            pushUndo({ type: 'tag', memeKey: key, oldValue: oldTags, newValue: memeData.tags });
            await renderTags();
          }
        };
        Object.assign(chip.style, {
          padding: '4px 8px',
          borderRadius: '12px',
          border: '1px dashed #999',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: '11px',
          color: '#666'
        });
        quickTags.appendChild(chip);
      });
      
      tagsContainer.appendChild(quickTags);
    }
    
    memeData.tags.forEach(tag => {
      const badge = createTagBadge(tag, memeData, renderTags);
      tagsContainer.appendChild(badge);
    });

    if (existingInput) {
      tagsContainer.appendChild(existingInput);
    }
  };

  void renderTags();

  const tagInputWrapper = document.createElement('div');
  tagInputWrapper.style.position = 'relative';
  tagInputWrapper.style.marginTop = '10px';

  const tagInput = document.createElement('input');
  tagInput.className = 'tag-input';
  tagInput.type = 'text';
  tagInput.placeholder = getTranslation('addTag');
  tagInput.setAttribute('aria-label', getTranslation('addTag'));

  const dropdown = document.createElement('div');
  dropdown.className = 'tag-autocomplete';

  const allTagsRef = { value: [] as string[] };
  const highlightedIndexRef = { value: -1 };
  let debounceTimer: number | null = null;

  tagInput.oninput = (e) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      updateAutocompleteDropdown(
        (e.target as HTMLInputElement).value,
        dropdown,
        memeData,
        tagInput,
        renderTags,
        allTagsRef,
        highlightedIndexRef
      );
    }, CONFIG.DEBOUNCE_DELAY);
  };

  tagInput.onkeydown = (e) => handleKeyboardNavigation(e, dropdown, highlightedIndexRef, memeData, tagInput, renderTags);

  tagInputWrapper.appendChild(tagInput);
  tagInputWrapper.appendChild(dropdown);
  tagsContainer.appendChild(tagInputWrapper);

  return tagsContainer;
}

async function copyToClipboard(): Promise<void> {
  if (!currentMemeData) return;
  try {
    const response = await fetch(currentMemeData.imageUrl);
    const blob = await response.blob();
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    showToast(getTranslation('copiedToClipboard'));
  } catch {
    showToast(getTranslation('copyFailed'));
  }
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
  const starBtn = createStarButton(memeData);
  actionsContainer.appendChild(starBtn);
  actionsContainer.appendChild(createRegenerateButton());
  actionsContainer.appendChild(createShareButton(memeData.imageUrl, memeData.text, currentLanguage));
  actionsContainer.appendChild(createCloseButton());

  originalText = memeData.text;

  currentMemeKey = `meme_${simpleHash(memeData.text + memeData.timestamp)}`;
  currentMemeData = memeData;

  content.appendChild(actionsContainer);
  content.appendChild(createMemeImage(memeData));
  content.appendChild(createMemeText(memeData));
  content.appendChild(createTagsSection(memeData));
  overlay.appendChild(content);

  overlay.onclick = (e) => e.target === overlay && closeOverlay();
  content.onclick = (e) => e.stopPropagation();

  document.body.style.overflow = 'hidden';
  document.body.appendChild(overlay);
  currentOverlay = overlay;
  enableShortcuts();

  registerShortcut('regenerate', regenerateMeme);
  registerShortcut('favorite', () => toggleFavorite(memeData, starBtn));
  registerShortcut('copy', copyToClipboard);
  registerShortcut('tag', () => {
    const tagInput = overlay.querySelector('.tag-input') as HTMLInputElement;
    tagInput?.focus();
  });

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
