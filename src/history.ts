import { getAllMemes } from './storage';
import { createOverlay } from './overlay';
import type { MemeData } from './types';

let currentPanel: HTMLElement | null = null;
let allMemes: MemeData[] = [];
let favoritesFilterActive = false;
let activeTagFilters: Set<string> = new Set();

export async function createHistoryPanel(): Promise<void> {
  if (currentPanel) {
    currentPanel.remove();
  }
  favoritesFilterActive = false;
  activeTagFilters.clear();

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

  const filterBtn = document.createElement('button');
  filterBtn.className = 'favorites-filter';
  filterBtn.textContent = '⭐';
  filterBtn.onclick = async () => await filterFavorites();
  Object.assign(filterBtn.style, {
    padding: '8px 12px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: darkMode ? '#2a2a3e' : '#f5f5f5',
    cursor: 'pointer',
    fontSize: '16px',
    opacity: favoritesFilterActive ? '1' : '0.5'
  });

  controls.appendChild(searchInput);
  controls.appendChild(filterBtn);
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

  const noFavorites = document.createElement('div');
  noFavorites.className = 'no-favorites';
  noFavorites.textContent = 'No favorites yet';
  Object.assign(noFavorites.style, {
    textAlign: 'center',
    color: darkMode ? '#999' : '#666',
    padding: '20px',
    display: 'none'
  });
  panel.appendChild(noFavorites);

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
      const item = document.createElement('div');
      item.className = 'history-item';
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
      text.textContent = displayText;
      Object.assign(text.style, {
        fontSize: '12px',
        color: darkMode ? '#ccc' : '#555',
        marginBottom: '5px'
      });

      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'meme-tags';
      Object.assign(tagsDiv.style, {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px'
      });

      meme.tags.forEach(tag => {
        const tagBadge = document.createElement('span');
        tagBadge.className = 'tag-filter-badge';
        tagBadge.textContent = tag.trim();
        tagBadge.onclick = (e) => {
          e.stopPropagation();
          toggleTagFilter(tag);
        };
        Object.assign(tagBadge.style, {
          backgroundColor: activeTagFilters.has(tag) 
            ? (darkMode ? '#4a4a6e' : '#d0d0ff') 
            : (darkMode ? '#3a3a4e' : '#e0e0e0'),
          color: darkMode ? '#fff' : '#333',
          padding: '2px 6px',
          borderRadius: '8px',
          fontSize: '10px',
          cursor: 'pointer',
          border: activeTagFilters.has(tag) ? '1px solid #6060ff' : 'none'
        });

        tagsDiv.appendChild(tagBadge);
      });

      item.appendChild(img);
      item.appendChild(text);
      item.appendChild(tagsDiv);
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

export function isFavoritesFilterActive(): boolean {
  return favoritesFilterActive;
}

export function getActiveTagFilters(): string[] {
  return Array.from(activeTagFilters);
}

export function clearTagFilters(): void {
  activeTagFilters.clear();
}

export async function toggleTagFilter(tag: string): Promise<void> {
  if (activeTagFilters.has(tag)) {
    activeTagFilters.delete(tag);
  } else {
    activeTagFilters.add(tag);
  }

  await applyFilters();
}

export async function applyFilters(): Promise<void> {
  if (!currentPanel) return;

  const items = currentPanel.querySelectorAll('.history-item');
  const noResults = currentPanel.querySelector('.no-results') as HTMLElement;
  const noFavorites = currentPanel.querySelector('.no-favorites') as HTMLElement;
  const searchInput = currentPanel.querySelector('.history-search') as HTMLInputElement;
  const searchQuery = searchInput?.value.toLowerCase() || '';
  
  let visibleCount = 0;

  items.forEach((item, index) => {
    const meme = allMemes[index];
    if (!meme) return;

    const matchesSearch = searchQuery === '' || 
      meme.text.toLowerCase().includes(searchQuery) ||
      meme.template.toLowerCase().includes(searchQuery);
    
    const matchesFavorites = !favoritesFilterActive || meme.isFavorite;
    
    const matchesTags = activeTagFilters.size === 0 || 
      Array.from(activeTagFilters).every(tag => meme.tags.includes(tag));

    if (matchesSearch && matchesFavorites && matchesTags) {
      (item as HTMLElement).style.display = 'block';
      visibleCount++;
    } else {
      (item as HTMLElement).style.display = 'none';
    }
  });

  const tagBadges = currentPanel.querySelectorAll('.tag-filter-badge');
  const { darkMode } = await chrome.storage.local.get(['darkMode']);
  
  tagBadges.forEach(badge => {
    const tag = (badge.textContent || '').trim();
    if (activeTagFilters.has(tag)) {
      Object.assign((badge as HTMLElement).style, {
        backgroundColor: darkMode ? '#4a4a6e' : '#d0d0ff',
        border: '1px solid #6060ff'
      });
    } else {
      Object.assign((badge as HTMLElement).style, {
        backgroundColor: darkMode ? '#3a3a4e' : '#e0e0e0',
        border: 'none'
      });
    }
  });

  if (noResults) {
    noResults.style.display = visibleCount === 0 && searchQuery !== '' ? 'block' : 'none';
  }

  if (noFavorites) {
    noFavorites.style.display = visibleCount === 0 && favoritesFilterActive && searchQuery === '' ? 'block' : 'none';
  }
}

export async function searchHistory(query: string): Promise<void> {
  await applyFilters();
}

export async function filterFavorites(): Promise<void> {
  if (!currentPanel) return;

  favoritesFilterActive = !favoritesFilterActive;

  const filterBtn = currentPanel.querySelector('.favorites-filter') as HTMLElement;
  if (filterBtn) {
    filterBtn.style.opacity = favoritesFilterActive ? '1' : '0.5';
  }

  await applyFilters();
}
