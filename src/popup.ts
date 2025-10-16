import { getShortcuts, saveShortcuts, validateShortcut, hasConflict } from './shortcutConfig';
import { getAnalytics, exportData } from './analytics';
import { MEME_TEMPLATES } from './templates';
import { getCollections, createCollection, deleteCollection } from './collections';
import { getTrendingData } from './trending';

const translations = {
  English: { save: 'Save Settings', saved: 'Saved!' },
  Spanish: { save: 'Guardar Configuración', saved: '¡Guardado!' },
  French: { save: 'Enregistrer', saved: 'Enregistré!' },
  German: { save: 'Speichern', saved: 'Gespeichert!' }
};

document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.local.get(['geminiApiKey', 'selectedLanguage', 'darkMode']);
  const geminiInput = document.getElementById('geminiApiKey') as HTMLInputElement;
  const langSelect = document.getElementById('languageSelect') as HTMLSelectElement;
  const darkModeCheckbox = document.getElementById('darkMode') as HTMLInputElement;
  
  if (geminiInput && data.geminiApiKey) {
    geminiInput.value = data.geminiApiKey;
    geminiInput.classList.add('valid');
  }
  
  if (langSelect && data.selectedLanguage) {
    langSelect.value = data.selectedLanguage;
  }
  
  if (darkModeCheckbox) {
    darkModeCheckbox.checked = data.darkMode || false;
    if (data.darkMode) document.body.classList.add('dark');
  }

  document.getElementById('settingsTab')?.addEventListener('click', () => switchTab('settings'));
  document.getElementById('statsTab')?.addEventListener('click', () => switchTab('stats'));
  document.getElementById('collectionsTab')?.addEventListener('click', () => switchTab('collections'));
  document.getElementById('trendingTab')?.addEventListener('click', () => switchTab('trending'));

  async function switchTab(tab: string) {
    ['settings', 'stats', 'collections', 'trending'].forEach(t => {
      const panel = document.getElementById(`${t}Panel`);
      const btn = document.getElementById(`${t}Tab`);
      if (panel) panel.style.display = t === tab ? 'block' : 'none';
      if (btn) {
        btn.style.background = t === tab ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5';
        btn.style.color = t === tab ? 'white' : '#666';
      }
    });
    if (tab === 'stats') await loadStats();
    if (tab === 'collections') await loadCollections();
    if (tab === 'trending') await loadTrending();
  }

  document.getElementById('exportBtn')?.addEventListener('click', exportData);
  
  document.getElementById('templatesBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('templatesModal')!;
    modal.style.display = 'flex';
    const list = document.getElementById('templatesList')!;
    list.innerHTML = '';
    MEME_TEMPLATES.forEach(template => {
      const item = document.createElement('div');
      item.textContent = template;
      item.style.cssText = 'padding: 8px; background: #f5f5f5; border-radius: 6px; font-size: 11px;';
      list.appendChild(item);
    });
  });

  document.getElementById('closeTemplates')?.addEventListener('click', () => {
    document.getElementById('templatesModal')!.style.display = 'none';
  });

  document.getElementById('newCollectionBtn')?.addEventListener('click', async () => {
    const name = prompt('Collection name:');
    if (name?.trim()) {
      await createCollection(name.trim());
      await loadCollections();
    }
  });

  (window as unknown as { deleteCol: (id: string) => Promise<void> }).deleteCol = async (id: string) => {
    if (confirm('Delete this collection?')) {
      await deleteCollection(id);
      await loadCollections();
    }
  };
});

async function loadCollections() {
  const collections = await getCollections();
  const content = document.getElementById('collectionsContent')!;
  if (collections.length === 0) {
    content.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">No collections yet</div>';
    return;
  }
  content.innerHTML = collections.map(col => `
    <div style="padding: 12px; background: #f5f5f5; border-radius: 8px; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="font-weight: 600; font-size: 12px;">${col.name}</div>
        <button onclick="deleteCol('${col.id}')" style="background: none; border: none; cursor: pointer; font-size: 16px;">🗑️</button>
      </div>
      <div style="font-size: 10px; color: #666; margin-top: 4px;">${col.memeIds.length} memes</div>
    </div>
  `).join('');
}

async function loadTrending() {
  const trending = await getTrendingData();
  const content = document.getElementById('trendingContent')!;
  content.innerHTML = `
    <div style="display: grid; gap: 12px;">
      ${trending.last7Days.length ? `
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">🔥 Your Top Templates (7 days)</div>
        ${trending.last7Days.map(t => `<div style="font-size: 10px; color: #666;">${t.template}: ${t.count} uses</div>`).join('')}
      </div>` : ''}
      ${trending.mostShared.length ? `
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">📤 Your Most Shared</div>
        ${trending.mostShared.map(t => `<div style="font-size: 10px; color: #666;">${t.template}: ~${t.shares} shares</div>`).join('')}
      </div>` : ''}
      ${trending.risingStars.length ? `
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">📈 Your Rising Stars</div>
        ${trending.risingStars.map(t => `<div style="font-size: 10px; color: #666;">${t.trend} ${t.template}</div>`).join('')}
      </div>` : ''}
      ${trending.untried.length ? `
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">✨ Templates to Try</div>
        ${trending.untried.map(t => `<div style="font-size: 10px; color: #666;">${t}</div>`).join('')}
      </div>` : ''}
    </div>
  `;
}

async function loadStats() {
  const stats = await getAnalytics();
  const content = document.getElementById('statsContent')!;
  content.innerHTML = `
    <div style="display: grid; gap: 12px;">
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 700; color: #667eea;">${stats.totalMemes}</div>
        <div style="font-size: 10px; color: #666; text-transform: uppercase;">Total Memes</div>
      </div>
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 700; color: #764ba2;">${stats.favoritesCount} (${stats.favoritesPercent}%)</div>
        <div style="font-size: 10px; color: #666; text-transform: uppercase;">Favorites</div>
      </div>
      ${stats.topTemplates.length ? `
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">🏆 Top Templates</div>
        ${stats.topTemplates.map(t => `<div style="font-size: 10px; color: #666;">${t.name}: ${t.count}</div>`).join('')}
      </div>` : ''}
      ${stats.topTags.length ? `
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">🏷️ Top Tags</div>
        ${stats.topTags.map(t => `<div style="font-size: 10px; color: #666;">${t.name}: ${t.count}</div>`).join('')}
      </div>` : ''}
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">📤 Shares</div>
        <div style="font-size: 10px; color: #666;">𝕏 Twitter: ${stats.shareStats.twitter}</div>
        <div style="font-size: 10px; color: #666;">💼 LinkedIn: ${stats.shareStats.linkedin}</div>
        <div style="font-size: 10px; color: #666;">📧 Email: ${stats.shareStats.email}</div>
      </div>
    </div>
  `;
}

document.getElementById('darkMode')?.addEventListener('change', (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  document.body.classList.toggle('dark', checked);
  chrome.storage.local.set({ darkMode: checked });
});

document.getElementById('geminiApiKey')?.addEventListener('input', (e) => {
  const key = (e.target as HTMLInputElement).value.trim();
  const input = e.target as HTMLInputElement;
  if (key.length >= 39 && /^AIza[0-9A-Za-z_-]{35}$/.test(key)) {
    input.classList.add('valid');
  } else {
    input.classList.remove('valid');
  }
});

document.getElementById('saveKey')?.addEventListener('click', async () => {
  const geminiInput = document.getElementById('geminiApiKey') as HTMLInputElement;
  const langSelect = document.getElementById('languageSelect') as HTMLSelectElement;
  const statusMsg = document.getElementById('statusMsg') as HTMLDivElement;
  const saveBtn = document.getElementById('saveKey') as HTMLButtonElement;
  
  const key = geminiInput.value.trim();
  const lang = langSelect.value;
  
  if (!key || key.length < 39 || !/^AIza[0-9A-Za-z_-]{35}$/.test(key)) {
    statusMsg.textContent = '⚠️ Please enter a valid API key';
    statusMsg.className = 'status-msg error';
    setTimeout(() => { statusMsg.textContent = ''; statusMsg.className = 'status-msg'; }, 3000);
    return;
  }

  try {
    saveBtn.disabled = true;
    statusMsg.textContent = 'Saving...';
    statusMsg.className = 'status-msg';
    
    await chrome.storage.local.set({ 
      geminiApiKey: key,
      selectedLanguage: lang
    });
    
    const t = translations[lang as keyof typeof translations] || translations.English;
    statusMsg.textContent = `✓ ${t.saved}`;
    statusMsg.className = 'status-msg success';
    geminiInput.classList.add('valid');
    
    setTimeout(() => {
      statusMsg.textContent = '';
      statusMsg.className = 'status-msg';
    }, 2000);
  } catch (error) {
    statusMsg.textContent = '⚠️ Failed to save';
    statusMsg.className = 'status-msg error';
  } finally {
    saveBtn.disabled = false;
  }
});

const darkStyle = document.createElement('style');
darkStyle.textContent = `
  body.dark .tab-btn { background: #2a2a3e !important; color: #e0e0e0 !important; }
  body.dark .tab-btn.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; color: white !important; }
  body.dark #statsContent > div > div { background: #2a2a3e !important; color: #e0e0e0 !important; }
  body.dark #collectionsContent > div { background: #2a2a3e !important; color: #e0e0e0 !important; }
  body.dark #trendingContent > div > div { background: #2a2a3e !important; color: #e0e0e0 !important; }
  body.dark #templatesModal > div { background: #1a1a2e !important; color: #e0e0e0 !important; }
  body.dark #templatesList > div { background: #2a2a3e !important; color: #e0e0e0 !important; }
`;
document.head.appendChild(darkStyle);
