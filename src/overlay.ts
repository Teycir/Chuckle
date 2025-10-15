import type { MemeData } from './types';
import { simpleHash, updateMeme } from './storage';
import { CONFIG } from './config';
import { pushUndo } from './undo';
import { enableShortcuts, disableShortcuts } from './shortcuts';
import { analyzeMemeContext, generateMemeImage } from './geminiService';
import { showLoading, hideLoading } from './loading';

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

function createStarButton(memeData: MemeData): HTMLButtonElement {
  const starBtn = createButton('star-btn', memeData.isFavorite ? '⭐' : '☆', async () => {
    const oldValue = memeData.isFavorite;
    memeData.isFavorite = !memeData.isFavorite;
    starBtn.textContent = memeData.isFavorite ? '⭐' : '☆';
    starBtn.setAttribute('aria-label', memeData.isFavorite ? 'Remove from favorites' : 'Add to favorites');
    if (currentMemeKey) {
      pushUndo({ type: 'favorite', memeKey: currentMemeKey, oldValue, newValue: memeData.isFavorite });
      await updateMeme(currentMemeKey, { isFavorite: memeData.isFavorite });
    }
  });
  starBtn.setAttribute('aria-label', memeData.isFavorite ? 'Remove from favorites' : 'Add to favorites');
  starBtn.setAttribute('role', 'button');
  return starBtn;
}

function createCloseButton(): HTMLButtonElement {
  const closeBtn = createButton('close-btn', '×', closeOverlay);
  closeBtn.setAttribute('aria-label', 'Close meme overlay');
  closeBtn.setAttribute('role', 'button');
  return closeBtn;
}

function createRegenerateButton(): HTMLButtonElement {
  const regenBtn = createButton('regenerate-btn', '🎲', async () => {
    if (!originalText) return;
    try {
      showLoading('Regenerating meme...');
      const template = await analyzeMemeContext(originalText, Date.now());
      const imageUrl = await generateMemeImage(template);
      
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
  });
  regenBtn.setAttribute('aria-label', 'Try another meme variant');
  regenBtn.setAttribute('role', 'button');
  regenBtn.title = 'Try Another';
  return regenBtn;
}

function createMemeImage(memeData: MemeData): HTMLImageElement {
  const img = document.createElement('img');
  img.className = 'meme-image';
  img.src = memeData.imageUrl;
  img.alt = `Meme: ${memeData.text}`;
  return img;
}

function createMemeText(memeData: MemeData): HTMLDivElement {
  const text = document.createElement('div');
  text.className = 'meme-text';
  text.textContent = memeData.text;
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

  const renderTags = () => {
    const existingInput = tagsContainer.querySelector('.tag-input')?.parentElement;
    while (tagsContainer.firstChild) tagsContainer.removeChild(tagsContainer.firstChild);
    
    memeData.tags.forEach(tag => {
      const badge = createTagBadge(tag, memeData, renderTags);
      tagsContainer.appendChild(badge);
    });

    if (existingInput) {
      tagsContainer.appendChild(existingInput);
    }
  };

  renderTags();

  const tagInputWrapper = document.createElement('div');
  tagInputWrapper.style.position = 'relative';
  tagInputWrapper.style.marginTop = '10px';

  const tagInput = document.createElement('input');
  tagInput.className = 'tag-input';
  tagInput.type = 'text';
  tagInput.placeholder = 'Add tag...';
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
  header.appendChild(createStarButton(memeData));
  header.appendChild(createRegenerateButton());
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
