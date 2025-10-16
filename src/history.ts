import { getAllMemes, simpleHash } from './storage';
import { createOverlay } from './overlay';
import type { MemeData } from './types';

let currentPanel: HTMLElement | null = null;
let allMemes: MemeData[] = [];
let recentFilterActive = false;

export async function createHistoryPanel(): Promise<void> {
  if (currentPanel) {
    currentPanel.remove();
  }
  const prefs = await chrome.storage.local.get(['historyFilters']);
  if (prefs.historyFilters) {
    recentFilterActive = prefs.historyFilters.recent || false;
  } else {
    recentFilterActive = false;
  }

  const { darkMode } = await chrome.storage.local.get(['darkMode']);
  allMemes = await getAllMemes();

  const panel = document.createElement('div');
  panel.className = 'history-panel';
  if (darkMode) panel.classList.add('dark');

  Object.assign(panel.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '300px',
    maxHeight: '80vh',
    backgroundColor: darkMode ? '#1a1a2e' : '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    zIndex: '9999',
    overflow: 'auto'
  });

  const header = document.createElement('div');
  Object.assign(header.style, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  });

  const title = document.createElement('h3');
  title.textContent = 'History';
  Object.assign(title.style, {
    margin: '0',
    fontSize: '18px',
    color: darkMode ? '#fff' : '#333'
  });

  const closeBtn = document.createElement('button');
  closeBtn.className = 'history-close';
  closeBtn.textContent = '×';
  closeBtn.onclick = () => toggleHistoryPanel();
  Object.assign(closeBtn.style, {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: darkMode ? '#fff' : '#333'
  });

  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  const controls = document.createElement('div');
  Object.assign(controls.style, {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px'
  });

  const searchInput = document.createElement('input');
  searchInput.className = 'history-search';
  searchInput.type = 'text';
  searchInput.placeholder = 'Search memes...';
  searchInput.setAttribute('aria-label', 'Search memes by text or template');
  searchInput.oninput = (e) => searchHistory((e.target as HTMLInputElement).value);
  Object.assign(searchInput.style, {
    flex: '1',
    padding: '8px',
    borderRadius: '6px',
    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
    backgroundColor: darkMode ? '#2a2a3e' : '#fff',
    color: darkMode ? '#fff' : '#333',
    fontSize: '14px'
  });

  const filterBtns = document.createElement('div');
  Object.assign(filterBtns.style, {
    display: 'flex',
    gap: '6px'
  });

  const recentBtn = document.createElement('button');
  recentBtn.className = 'recent-filter';
  recentBtn.textContent = '🕐';
  recentBtn.setAttribute('aria-label', 'Filter recent');
  recentBtn.onclick = async () => await filterRecent();
  Object.assign(recentBtn.style, {
    padding: '8px 12px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: darkMode ? '#2a2a3e' : '#f5f5f5',
    cursor: 'pointer',
    fontSize: '16px',
    opacity: recentFilterActive ? '1' : '0.5'
  });

  filterBtns.appendChild(recentBtn);

  controls.appendChild(searchInput);
  controls.appendChild(filterBtns);
  panel.appendChild(controls);

  const noResults = document.createElement('div');
  noResults.className = 'no-results';
  noResults.textContent = 'No results found';
  Object.assign(noResults.style, {
    textAlign: 'center',
    color: darkMode ? '#999' : '#666',
    padding: '20px',
    display: 'none'
  });
  panel.appendChild(noResults);



  if (allMemes.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-history';
    empty.textContent = 'No memes yet';
    Object.assign(empty.style, {
      textAlign: 'center',
      color: darkMode ? '#999' : '#666',
      padding: '20px'
    });
    panel.appendChild(empty);
  } else {
    allMemes.forEach(meme => {
      const memeId = `meme_${simpleHash(meme.text + meme.timestamp)}`;
      const item = document.createElement('div');
      item.className = 'history-item';
      item.dataset.memeId = memeId;
      item.onclick = () => createOverlay(meme);
      Object.assign(item.style, {
        marginBottom: '10px',
        padding: '10px',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: darkMode ? '#2a2a3e' : '#f5f5f5',
        transition: 'transform 0.2s'
      });

      item.onmouseenter = () => item.style.transform = 'scale(1.02)';
      item.onmouseleave = () => item.style.transform = 'scale(1)';

      const img = document.createElement('img');
      img.src = meme.imageUrl;
      img.alt = meme.text;
      Object.assign(img.style, {
        width: '100%',
        borderRadius: '4px',
        marginBottom: '5px'
      });

      const text = document.createElement('div');
      text.className = 'meme-text';
      const displayText = meme.text.length > 50 ? meme.text.slice(0, 50) + '...' : meme.text;
      text.innerHTML = displayText;
      Object.assign(text.style, {
        fontSize: '12px',
        color: darkMode ? '#ccc' : '#555',
        marginBottom: '5px'
      });

      item.appendChild(img);
      item.appendChild(text);
      panel.appendChild(item);
    });
  }

  document.body.appendChild(panel);
  currentPanel = panel;
}

export function toggleHistoryPanel(): void {
  if (currentPanel) {
    if (currentPanel.style.display === 'none') {
      currentPanel.style.display = 'block';
    } else {
      currentPanel.style.display = 'none';
    }
  }
}

export function isHistoryPanelOpen(): boolean {
  return currentPanel !== null && currentPanel.style.display !== 'none';
}



export async function applyFilters(): Promise<void> {
  if (!currentPanel) return;

  const items = currentPanel.querySelectorAll('.history-item');
  const noResults = currentPanel.querySelector('.no-results') as HTMLElement;
  const searchInput = currentPanel.querySelector('.history-search') as HTMLInputElement;
  const searchQuery = searchInput?.value.toLowerCase() || '';
  
  await chrome.storage.local.set({
    historyFilters: {
      recent: recentFilterActive
    }
  });
  
  let visibleCount = 0;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  items.forEach((item) => {
    const memeId = (item as HTMLElement).dataset.memeId;
    const meme = allMemes.find(m => `meme_${simpleHash(m.text + m.timestamp)}` === memeId);
    if (!meme) return;

    const matchesSearch = searchQuery === '' || 
      meme.text.toLowerCase().includes(searchQuery) ||
      meme.template.toLowerCase().includes(searchQuery);
    
    const matchesRecent = !recentFilterActive || (now - meme.timestamp < dayMs);

    if (matchesSearch && matchesRecent) {
      (item as HTMLElement).style.display = 'block';
      visibleCount++;
      
      if (searchQuery) {
        const textEl = item.querySelector('.meme-text') as HTMLElement;
        if (textEl) {
          const originalText = meme.text.length > 50 ? meme.text.slice(0, 50) + '...' : meme.text;
          textEl.innerHTML = highlightText(originalText, searchQuery);
        }
      }
    } else {
      (item as HTMLElement).style.display = 'none';
    }
  });

  if (noResults) {
    noResults.style.display = visibleCount === 0 && searchQuery !== '' ? 'block' : 'none';
  }
}

export async function searchHistory(_query: string): Promise<void> {
  await applyFilters();
}

export async function filterRecent(): Promise<void> {
  if (!currentPanel) return;

  recentFilterActive = !recentFilterActive;

  const filterBtn = currentPanel.querySelector('.recent-filter') as HTMLElement;
  if (filterBtn) {
    filterBtn.style.opacity = recentFilterActive ? '1' : '0.5';
  }

  await applyFilters();
}



function highlightText(text: string, query: string): string {
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark style="background:#ffeb3b;color:#000;padding:2px 0;">$1</mark>');
}
