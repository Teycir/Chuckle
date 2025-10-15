import { getShortcuts, saveShortcuts, validateShortcut, hasConflict, DEFAULT_SHORTCUTS } from './shortcutConfig';
import { getAnalytics, exportData } from './analytics';
import { MEME_TEMPLATES } from './templates';

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

  const shortcuts = await getShortcuts();
  (document.getElementById('shortcut-regenerate') as HTMLInputElement).value = shortcuts.regenerate;
  (document.getElementById('shortcut-favorite') as HTMLInputElement).value = shortcuts.favorite;
  (document.getElementById('shortcut-copy') as HTMLInputElement).value = shortcuts.copy;
  (document.getElementById('shortcut-tag') as HTMLInputElement).value = shortcuts.tag;
  (document.getElementById('shortcut-history') as HTMLInputElement).value = shortcuts.history;

  document.getElementById('settingsTab')?.addEventListener('click', () => {
    document.getElementById('settingsPanel')!.style.display = 'block';
    document.getElementById('statsPanel')!.style.display = 'none';
    document.getElementById('settingsTab')!.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    document.getElementById('settingsTab')!.style.color = 'white';
    document.getElementById('statsTab')!.style.background = '#f5f5f5';
    document.getElementById('statsTab')!.style.color = '#666';
  });

  document.getElementById('statsTab')?.addEventListener('click', async () => {
    document.getElementById('settingsPanel')!.style.display = 'none';
    document.getElementById('statsPanel')!.style.display = 'block';
    document.getElementById('statsTab')!.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    document.getElementById('statsTab')!.style.color = 'white';
    document.getElementById('settingsTab')!.style.background = '#f5f5f5';
    document.getElementById('settingsTab')!.style.color = '#666';
    await loadStats();
  });

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
});

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
        <div style="font-size: 10px; color: #666;">🔴 Reddit: ${stats.shareStats.reddit}</div>
        <div style="font-size: 10px; color: #666;">📘 Facebook: ${stats.shareStats.facebook}</div>
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

  const shortcuts = {
    regenerate: (document.getElementById('shortcut-regenerate') as HTMLInputElement).value.toLowerCase(),
    favorite: (document.getElementById('shortcut-favorite') as HTMLInputElement).value.toLowerCase(),
    copy: (document.getElementById('shortcut-copy') as HTMLInputElement).value.toLowerCase(),
    tag: (document.getElementById('shortcut-tag') as HTMLInputElement).value.toLowerCase(),
    history: (document.getElementById('shortcut-history') as HTMLInputElement).value.toLowerCase()
  };

  for (const [action, shortcut] of Object.entries(shortcuts)) {
    if (!validateShortcut(shortcut)) {
      statusMsg.textContent = `⚠️ Invalid shortcut for ${action}`;
      statusMsg.className = 'status-msg error';
      setTimeout(() => { statusMsg.textContent = ''; statusMsg.className = 'status-msg'; }, 3000);
      return;
    }
    if (hasConflict(shortcuts, shortcut, action as keyof typeof shortcuts)) {
      statusMsg.textContent = `⚠️ Duplicate shortcut: ${shortcut}`;
      statusMsg.className = 'status-msg error';
      setTimeout(() => { statusMsg.textContent = ''; statusMsg.className = 'status-msg'; }, 3000);
      return;
    }
  }
  
  try {
    saveBtn.disabled = true;
    statusMsg.textContent = 'Saving...';
    statusMsg.className = 'status-msg';
    
    await chrome.storage.local.set({ 
      geminiApiKey: key,
      selectedLanguage: lang
    });
    await saveShortcuts(shortcuts);
    
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

if (document.body.classList.contains('dark')) {
  const style = document.createElement('style');
  style.textContent = `
    body.dark .tab-btn { background: #2a2a3e !important; color: #e0e0e0 !important; }
    body.dark .tab-btn.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; color: white !important; }
    body.dark #statsContent > div > div { background: #2a2a3e !important; color: #e0e0e0 !important; }
    body.dark #templatesModal > div { background: #1a1a2e !important; color: #e0e0e0 !important; }
    body.dark #templatesList > div { background: #2a2a3e !important; color: #e0e0e0 !important; }
  `;
  document.head.appendChild(style);
}
