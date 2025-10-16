import { getShortcuts, saveShortcuts, validateShortcut, hasConflict } from './shortcutConfig';
import { getAnalytics, exportData } from './analytics';
import { MEME_TEMPLATES } from './templates';
import { getTrendingData } from './trending';

const translations = {
  English: {
    title: '🎭 Chuckle Settings',
    apiKeyLabel: '🔑 Gemini API Key',
    languageLabel: '🌐 Language',
    darkModeLabel: '🌙 Dark Mode',
    saveButton: '💾 Save Settings',
    saved: 'Saved!',
    getKeyInfo: 'Get key from',
    howToUse: 'How to use: Highlight text → Right-click → Remix as a Meme',
    madeBy: 'Meme generator, made by',
    settingsTab: '⚙️ Settings',
    statsTab: '📊 Stats',
    trendingTab: '🔥 Trending',
    trendingTitle: '🔥 Your Trending',
    topTemplates7Days: '🔥 Your Top Templates (7 days)',
    mostShared: '📤 Your Most Shared',
    risingStars: '📈 Your Rising Stars',
    templatesToTry: '✨ Templates to Try',
    uses: 'uses',
    shares: 'shares',
    statsTitle: '📊 Your Meme Stats',
    totalMemes: 'Total Memes',
    favorites: 'Favorites',
    topTemplates: '🏆 Top Templates',
    topTags: '🏷️ Top Tags',
    sharesLabel: '📤 Shares'
  },
  Spanish: {
    title: '🎭 Configuración de Chuckle',
    apiKeyLabel: '🔑 Clave API de Gemini',
    languageLabel: '🌐 Idioma',
    darkModeLabel: '🌙 Modo Oscuro',
    saveButton: '💾 Guardar Configuración',
    saved: '¡Guardado!',
    getKeyInfo: 'Obtener clave de',
    howToUse: 'Cómo usar: Resaltar texto → Clic derecho → Remix as a Meme',
    madeBy: 'Generador de memes, hecho por',
    settingsTab: '⚙️ Configuración',
    statsTab: '📊 Estadísticas',
    trendingTab: '🔥 Tendencias',
    trendingTitle: '🔥 Tus Tendencias',
    topTemplates7Days: '🔥 Tus Plantillas Más Usadas (7 días)',
    mostShared: '📤 Más Compartidos',
    risingStars: '📈 Estrellas Emergentes',
    templatesToTry: '✨ Plantillas para Probar',
    uses: 'usos',
    shares: 'compartidos',
    statsTitle: '📊 Tus Estadísticas',
    totalMemes: 'Memes Totales',
    favorites: 'Favoritos',
    topTemplates: '🏆 Mejores Plantillas',
    topTags: '🏷️ Mejores Etiquetas',
    sharesLabel: '📤 Compartidos'
  },
  French: {
    title: '🎭 Paramètres Chuckle',
    apiKeyLabel: '🔑 Clé API Gemini',
    languageLabel: '🌐 Langue',
    darkModeLabel: '🌙 Mode Sombre',
    saveButton: '💾 Enregistrer',
    saved: 'Enregistré!',
    getKeyInfo: 'Obtenir la clé de',
    howToUse: 'Comment utiliser: Surligner le texte → Clic droit → Remix as a Meme',
    madeBy: 'Générateur de mèmes, créé par',
    settingsTab: '⚙️ Paramètres',
    statsTab: '📊 Statistiques',
    trendingTab: '🔥 Tendances',
    trendingTitle: '🔥 Vos Tendances',
    topTemplates7Days: '🔥 Vos Meilleurs Modèles (7 jours)',
    mostShared: '📤 Les Plus Partagés',
    risingStars: '📈 Étoiles Montantes',
    templatesToTry: '✨ Modèles à Essayer',
    uses: 'utilisations',
    shares: 'partages',
    statsTitle: '📊 Vos Statistiques',
    totalMemes: 'Memes Totaux',
    favorites: 'Favoris',
    topTemplates: '🏆 Meilleurs Modèles',
    topTags: '🏷️ Meilleures Étiquettes',
    sharesLabel: '📤 Partages'
  },
  German: {
    title: '🎭 Chuckle Einstellungen',
    apiKeyLabel: '🔑 Gemini API-Schlüssel',
    languageLabel: '🌐 Sprache',
    darkModeLabel: '🌙 Dunkler Modus',
    saveButton: '💾 Speichern',
    saved: 'Gespeichert!',
    getKeyInfo: 'Schlüssel erhalten von',
    howToUse: 'Verwendung: Text markieren → Rechtsklick → Remix as a Meme',
    madeBy: 'Meme-Generator, erstellt von',
    settingsTab: '⚙️ Einstellungen',
    statsTab: '📊 Statistiken',
    trendingTab: '🔥 Trends',
    trendingTitle: '🔥 Ihre Trends',
    topTemplates7Days: '🔥 Ihre Top-Vorlagen (7 Tage)',
    mostShared: '📤 Am Meisten Geteilt',
    risingStars: '📈 Aufstrebende Stars',
    templatesToTry: '✨ Vorlagen zum Ausprobieren',
    uses: 'Verwendungen',
    shares: 'Teilungen',
    statsTitle: '📊 Ihre Statistiken',
    totalMemes: 'Memes Gesamt',
    favorites: 'Favoriten',
    topTemplates: '🏆 Top-Vorlagen',
    topTags: '🏷️ Top-Tags',
    sharesLabel: '📤 Teilungen'
  }
};

function updateUILanguage(lang: string) {
  const t = translations[lang as keyof typeof translations] || translations.English;
  
  const title = document.querySelector('#settingsPanel h2');
  if (title) title.textContent = t.title;
  
  const apiKeyLabel = document.querySelector('label[for="geminiApiKey"]');
  if (apiKeyLabel) apiKeyLabel.textContent = t.apiKeyLabel;
  
  const langLabel = document.querySelector('label[for="languageSelect"]');
  if (langLabel) langLabel.textContent = t.languageLabel;
  
  const darkModeLabel = document.querySelector('label[for="darkMode"]');
  if (darkModeLabel) darkModeLabel.textContent = t.darkModeLabel;
  
  const saveBtn = document.getElementById('saveKey');
  if (saveBtn) saveBtn.textContent = t.saveButton;
  
  const settingsTab = document.getElementById('settingsTab');
  if (settingsTab) settingsTab.textContent = t.settingsTab;
  
  const statsTab = document.getElementById('statsTab');
  if (statsTab) statsTab.textContent = t.statsTab;
  
  const trendingTab = document.getElementById('trendingTab');
  if (trendingTab) trendingTab.textContent = t.trendingTab;
  
  const trendingTitle = document.querySelector('#trendingPanel h2');
  if (trendingTitle) trendingTitle.textContent = t.trendingTitle;
  
  const statsTitle = document.querySelector('#statsPanel h2');
  if (statsTitle) statsTitle.textContent = t.statsTitle;
  
  const infoTexts = document.querySelectorAll('.info');
  if (infoTexts[0]) {
    const link = infoTexts[0].querySelector('a');
    infoTexts[0].innerHTML = `${t.getKeyInfo} <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer">Google AI Studio</a>`;
  }
  if (infoTexts[1]) {
    infoTexts[1].textContent = t.howToUse;
  }
  
  const footer = document.querySelector('.footer-text');
  if (footer) {
    const link = footer.querySelector('a');
    footer.innerHTML = `<span>${t.madeBy}</span> <a href="https://teycirbensoltane.tn/" target="_blank" rel="noopener noreferrer">Teycir</a>`;
  }
}

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
    updateUILanguage(data.selectedLanguage);
  }
  
  if (darkModeCheckbox) {
    darkModeCheckbox.checked = data.darkMode || false;
    if (data.darkMode) document.body.classList.add('dark');
  }

  document.getElementById('settingsTab')?.addEventListener('click', () => switchTab('settings'));
  document.getElementById('statsTab')?.addEventListener('click', () => switchTab('stats'));
  document.getElementById('trendingTab')?.addEventListener('click', () => switchTab('trending'));
  
  langSelect?.addEventListener('change', (e) => {
    const lang = (e.target as HTMLSelectElement).value;
    updateUILanguage(lang);
  });

  async function switchTab(tab: string) {
    ['settings', 'stats', 'trending'].forEach(t => {
      const panel = document.getElementById(`${t}Panel`);
      const btn = document.getElementById(`${t}Tab`);
      if (panel) panel.style.display = t === tab ? 'block' : 'none';
      if (btn) {
        btn.style.background = t === tab ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5';
        btn.style.color = t === tab ? 'white' : '#666';
      }
    });
    if (tab === 'stats') await loadStats();
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

});

async function loadTrending() {
  const { selectedLanguage } = await chrome.storage.local.get(['selectedLanguage']);
  const lang = selectedLanguage || 'English';
  const t = translations[lang as keyof typeof translations] || translations.English;
  
  const trending = await getTrendingData();
  const content = document.getElementById('trendingContent')!;
  content.innerHTML = `
    <div style="display: grid; gap: 12px;">
      ${trending.last7Days.length ? `
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">${t.topTemplates7Days}</div>
        ${trending.last7Days.map(item => `<div style="font-size: 10px; color: #666;">${item.template}: ${item.count} ${t.uses}</div>`).join('')}
      </div>` : ''}
      ${trending.mostShared.length ? `
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">${t.mostShared}</div>
        ${trending.mostShared.map(item => `<div style="font-size: 10px; color: #666;">${item.template}: ~${item.shares} ${t.shares}</div>`).join('')}
      </div>` : ''}
      ${trending.risingStars.length ? `
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">${t.risingStars}</div>
        ${trending.risingStars.map(item => `<div style="font-size: 10px; color: #666;">${item.trend} ${item.template}</div>`).join('')}
      </div>` : ''}
      ${trending.untried.length ? `
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">${t.templatesToTry}</div>
        ${trending.untried.map(item => `<div style="font-size: 10px; color: #666;">${item}</div>`).join('')}
      </div>` : ''}
    </div>
  `;
}

async function loadStats() {
  const { selectedLanguage } = await chrome.storage.local.get(['selectedLanguage']);
  const lang = selectedLanguage || 'English';
  const t = translations[lang as keyof typeof translations] || translations.English;
  
  const stats = await getAnalytics();
  const content = document.getElementById('statsContent')!;
  content.innerHTML = `
    <div style="display: grid; gap: 12px;">
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 700; color: #667eea;">${stats.totalMemes}</div>
        <div style="font-size: 10px; color: #666; text-transform: uppercase;">${t.totalMemes}</div>
      </div>
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 700; color: #764ba2;">${stats.favoritesCount} (${stats.favoritesPercent}%)</div>
        <div style="font-size: 10px; color: #666; text-transform: uppercase;">${t.favorites}</div>
      </div>
      ${stats.topTemplates.length ? `
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">${t.topTemplates}</div>
        ${stats.topTemplates.map(item => `<div style="font-size: 10px; color: #666;">${item.name}: ${item.count}</div>`).join('')}
      </div>` : ''}
      ${stats.topTags.length ? `
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">${t.topTags}</div>
        ${stats.topTags.map(item => `<div style="font-size: 10px; color: #666;">${item.name}: ${item.count}</div>`).join('')}
      </div>` : ''}
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">${t.sharesLabel}</div>
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
    
    updateUILanguage(lang);
    
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
  body.dark #trendingContent > div > div { background: #2a2a3e !important; color: #e0e0e0 !important; }
  body.dark #templatesModal > div { background: #1a1a2e !important; color: #e0e0e0 !important; }
  body.dark #templatesList > div { background: #2a2a3e !important; color: #e0e0e0 !important; }
`;
document.head.appendChild(darkStyle);
