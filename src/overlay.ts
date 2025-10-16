import type { MemeData } from './types';
import { simpleHash, updateMeme } from './storage';
import { CONFIG } from './config';
import { pushUndo } from './undo';
import { enableShortcuts, disableShortcuts, registerShortcut } from './shortcuts';
import { analyzeMemeContext, generateMemeImage } from './geminiService';
import { showLoading, hideLoading } from './loading';
import { createShareButton } from './social-share';
import { getCollections, addMemeToCollection, removeMemeFromCollection } from './collections';

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
  starBtn.setAttribute('aria-label', memeData.isFavorite ? 'Remove from favorites' : 'Add to favorites');
  starBtn.title = memeData.isFavorite ? 'Remove from favorites (F)' : 'Add to favorites (F)';
  if (currentMemeKey) {
    pushUndo({ type: 'favorite', memeKey: currentMemeKey, oldValue, newValue: memeData.isFavorite });
    await updateMeme(currentMemeKey, { isFavorite: memeData.isFavorite });
  }
}

function createStarButton(memeData: MemeData): HTMLButtonElement {
  const starBtn = createButton('star-btn', memeData.isFavorite ? '⭐' : '☆', async () => {
    await toggleFavorite(memeData, starBtn);
  });
  starBtn.setAttribute('aria-label', memeData.isFavorite ? 'Remove from favorites' : 'Add to favorites');
  starBtn.setAttribute('role', 'button');
  starBtn.title = memeData.isFavorite ? 'Remove from favorites (F)' : 'Add to favorites (F)';
  return starBtn;
}

function createCloseButton(): HTMLButtonElement {
  const closeBtn = createButton('close-btn', '×', closeOverlay);
  closeBtn.setAttribute('aria-label', 'Close meme overlay');
  closeBtn.setAttribute('role', 'button');
  return closeBtn;
}

async function regenerateMeme(): Promise<void> {
  if (!originalText) return;
  try {
    showLoading('Regenerating meme...');
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
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Regeneration failed:', error);
  }
}

function createRegenerateButton(): HTMLButtonElement {
  const regenBtn = createButton('regenerate-btn', '🎲', regenerateMeme);
  regenBtn.setAttribute('aria-label', 'Try another meme variant');
  regenBtn.setAttribute('role', 'button');
  regenBtn.title = 'Try Another (R)';
  return regenBtn;
}

function createCollectionButton(): HTMLButtonElement {
  const btn = createButton('collection-btn', '📁', async () => {
    const collections = await getCollections();
    const dropdown = document.createElement('div');
    dropdown.className = 'collection-dropdown';
    Object.assign(dropdown.style, {
      position: 'absolute',
      background: '#fff',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '8px',
      zIndex: '10000',
      minWidth: '150px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    });

    collections.forEach(col => {
      const item = document.createElement('div');
      item.textContent = col.name;
      item.style.padding = '6px';
      item.style.cursor = 'pointer';
      item.onclick = async () => {
        if (currentMemeKey) {
          if (col.memeIds.includes(currentMemeKey)) {
            await removeMemeFromCollection(col.id, currentMemeKey);
            showToast(`Removed from ${col.name}`);
          } else {
            await addMemeToCollection(col.id, currentMemeKey);
            showToast(`Added to ${col.name}`);
          }
        }
        dropdown.remove();
      };
      dropdown.appendChild(item);
    });

    btn.appendChild(dropdown);
    setTimeout(() => dropdown.onclick = (e) => e.stopPropagation(), 0);
    setTimeout(() => document.addEventListener('click', () => dropdown.remove(), { once: true }), 0);
  });
  btn.title = 'Add to Collection';
  return btn;
}

function createMemeImage(memeData: MemeData): HTMLImageElement {
  const img = document.createElement('img');
  img.className = 'meme-image';
  img.src = memeData.imageUrl;
  img.alt = `Meme: ${memeData.text}`;
  img.ondblclick = regenerateMeme;
  img.style.cursor = 'pointer';
  img.title = 'Double-click to regenerate';
  return img;
}

function createMemeText(memeData: MemeData): HTMLDivElement {
  const text = document.createElement('div');
  text.className = 'meme-text';
  text.contentEditable = 'true';
  text.textContent = memeData.text;
  text.title = 'Click to edit text';
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
        chip.title = 'Click to add tag';
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
  tagInput.placeholder = 'Add tag... (Press T)';
  tagInput.setAttribute('aria-label', 'Add tag to meme');

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
    showToast('Copied to clipboard');
  } catch {
    showToast('Copy failed');
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

  const { darkMode } = await chrome.storage.local.get(['darkMode']);

  const overlay = document.createElement('div');
  overlay.className = `meme-overlay${darkMode ? ' dark' : ''}`;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const content = document.createElement('div');
  content.className = 'meme-content';

  const header = document.createElement('div');
  header.className = 'meme-header';
  const starBtn = createStarButton(memeData);
  header.appendChild(starBtn);
  header.appendChild(createRegenerateButton());
  header.appendChild(createCollectionButton());
  header.appendChild(createShareButton(memeData.imageUrl, memeData.text));
  header.appendChild(createCloseButton());

  originalText = memeData.text;

  currentMemeKey = `meme_${simpleHash(memeData.text + memeData.timestamp)}`;
  currentMemeData = memeData;

  content.appendChild(header);
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

  const closeBtn = header.querySelector('.close-btn') as HTMLButtonElement;
  closeBtn?.focus();

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
