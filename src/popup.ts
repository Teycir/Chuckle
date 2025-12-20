import { getAnalytics, exportData } from './analytics';
import { validateAndSetupModels } from './modelValidator';

let elements: Record<string, HTMLElement | null> = {};

function getElements() {
  if (!elements) {
    elements = {
      openrouterApiKey: document.getElementById('openrouterApiKey'),
      languageSelect: document.getElementById('languageSelect'),
      darkMode: document.getElementById('darkMode'),
      statusMsg: document.getElementById('statusMsg'),
    };
  }
  return elements;
}

function updateModelLabel(labelId: string, modelName: string) {
  const label = document.getElementById(labelId);
  if (label && modelName) {
    const displayName = modelName.split('/').pop() || modelName;
    label.textContent = `🤖 ${displayName}`;
    label.style.color = '#137333';
    label.style.background = '#e6f4ea';
  }
}

const translations = {
  English: {
    title: '🎭 Chuckle Settings',
    openrouterKeyLabel: '🔑 OpenRouter Key',
    apiHelp: 'Get key from',
    languageLabel: '🌐 Language',
    darkModeLabel: '🌙 Dark Mode',
    offlineModeLabel: '📴 Offline Mode',
    saveButton: '💾 Save Settings',
    saved: 'Saved!',
    getKeyInfo: 'Get key from',
    howToUse: 'How to use: Highlight text → Right-click → Remix as a Meme',
    madeBy: 'Meme generator, made by',
    settingsTab: '⚙️ Settings',
    statsTab: '📊 Stats',
    statsTitle: '📊 Your Meme Stats',
    totalMemes: 'Total Memes',
    topTemplates: '🏆 Top Templates',
    sharesLabel: '📤 Shares',
    exportData: '📥 Export Data',
    invalidKeyFormat: 'Invalid API key format',
    cannotLoadModels: 'Cannot load models - API key may be invalid',
    noModelsFound: 'No compatible models found',
  },
  Spanish: {
    title: '🎭 Configuración de Chuckle',
    openrouterKeyLabel: '🔑 Clave OpenRouter',
    apiHelp: 'Obtener clave de',
    languageLabel: '🌐 Idioma',
    darkModeLabel: '🌙 Modo Oscuro',
    offlineModeLabel: '📴 Modo Sin Conexión',
    saveButton: '💾 Guardar Configuración',
    saved: '¡Guardado!',
    getKeyInfo: 'Obtener clave de',
    howToUse: 'Cómo usar: Resaltar texto → Clic derecho → Remix as a Meme',
    madeBy: 'Generador de memes, hecho por',
    settingsTab: '⚙️ Configuración',
    statsTab: '📊 Estadísticas',
    statsTitle: '📊 Tus Estadísticas',
    totalMemes: 'Memes Totales',
    topTemplates: '🏆 Mejores Plantillas',
    sharesLabel: '📤 Compartidos',
    exportData: '📥 Exportar Datos',
    invalidKeyFormat: 'Formato de clave API inválido',
    cannotLoadModels: 'No se pueden cargar modelos - la clave API puede ser inválida',
    noModelsFound: 'No se encontraron modelos compatibles',
  },
  French: {
    title: '🎭 Paramètres Chuckle',
    openrouterKeyLabel: '🔑 Clé OpenRouter',
    apiHelp: 'Obtenir la clé de',
    languageLabel: '🌐 Langue',
    darkModeLabel: '🌙 Mode Sombre',
    offlineModeLabel: '📴 Mode Hors Ligne',
    saveButton: '💾 Enregistrer',
    saved: 'Enregistré!',
    getKeyInfo: 'Obtenir la clé de',
    howToUse: 'Comment utiliser: Surligner le texte → Clic droit → Remix as a Meme',
    madeBy: 'Générateur de mèmes, créé par',
    settingsTab: '⚙️ Paramètres',
    statsTab: '📊 Statistiques',
    statsTitle: '📊 Vos Statistiques',
    totalMemes: 'Memes Totaux',
    topTemplates: '🏆 Meilleurs Modèles',
    sharesLabel: '📤 Partages',
    exportData: '📥 Exporter les Données',
    invalidKeyFormat: 'Format de clé API invalide',
    cannotLoadModels: 'Impossible de charger les modèles - la clé API peut être invalide',
    noModelsFound: 'Aucun modèle compatible trouvé',
  },
  German: {
    title: '🎭 Chuckle Einstellungen',
    openrouterKeyLabel: '🔑 OpenRouter-Schlüssel',
    apiHelp: 'Schlüssel erhalten von',
    languageLabel: '🌐 Sprache',
    darkModeLabel: '🌙 Dunkler Modus',
    offlineModeLabel: '📴 Offline-Modus',
    saveButton: '💾 Speichern',
    saved: 'Gespeichert!',
    getKeyInfo: 'Schlüssel erhalten von',
    howToUse: 'Verwendung: Text markieren → Rechtsklick → Remix as a Meme',
    madeBy: 'Meme-Generator, erstellt von',
    settingsTab: '⚙️ Einstellungen',
    statsTab: '📊 Statistiken',
    statsTitle: '📊 Ihre Statistiken',
    totalMemes: 'Memes Gesamt',
    topTemplates: '🏆 Top-Vorlagen',
    sharesLabel: '📤 Teilungen',
    exportData: '📥 Daten Exportieren',
    invalidKeyFormat: 'Ungültiges API-Schlüsselformat',
    cannotLoadModels: 'Modelle können nicht geladen werden - API-Schlüssel möglicherweise ungültig',
    noModelsFound: 'Keine kompatiblen Modelle gefunden',
  },
};

function updateUILanguage(lang: string) {
  const t = translations[lang as keyof typeof translations] || translations.English;

  const title = document.querySelector('#settingsPanel h2');
  if (title) title.textContent = t.title;

  const openrouterKeyLabel = document.querySelector('label[for="openrouterApiKey"]');
  if (openrouterKeyLabel) openrouterKeyLabel.textContent = t.openrouterKeyLabel;

  const openrouterHelpText = document.getElementById('openrouterKeyHelpText');
  if (openrouterHelpText) openrouterHelpText.textContent = t.apiHelp;

  const langLabel = document.querySelector('label[for="languageSelect"]');
  if (langLabel) langLabel.textContent = t.languageLabel;

  const darkModeLabel = document.querySelector('label[for="darkMode"]');
  if (darkModeLabel) darkModeLabel.textContent = t.darkModeLabel;

  const offlineModeLabel = document.querySelector('label[for="offlineMode"]');
  if (offlineModeLabel) offlineModeLabel.textContent = t.offlineModeLabel;

  const saveBtn = document.getElementById('saveKey');
  if (saveBtn) saveBtn.textContent = t.saveButton;

  const settingsTab = document.getElementById('settingsTab');
  if (settingsTab) settingsTab.textContent = t.settingsTab;

  const statsTab = document.getElementById('statsTab');
  if (statsTab) statsTab.textContent = t.statsTab;

  const statsTitle = document.querySelector('#statsPanel h2');
  if (statsTitle) statsTitle.textContent = t.statsTitle;

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.textContent = t.exportData;
}

document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.local.get([
    'openrouterApiKey',
    'selectedLanguage',
    'darkMode',
    'offlineMode',
  ]);
  const {
    openrouterApiKey: openrouterInput,
    languageSelect: langSelect,
    darkMode: darkModeCheckbox,
  } = getElements();

  if (openrouterInput && data.openrouterApiKey) {
    (openrouterInput as HTMLInputElement).value = data.openrouterApiKey;
    if (/^sk-or-v1-[a-f0-9]{64}$/.test(data.openrouterApiKey)) {
      openrouterInput.classList.add('valid');
      await validateAndSetupModels(data.openrouterApiKey, 'openrouter', (msg, type) => {
        const { statusMsg } = getElements();
        if (statusMsg) {
          statusMsg.textContent =
            type === 'error' ? `⚠️ ${msg}` : type === 'success' ? `✓ ${msg}` : msg;
          statusMsg.className = `status-msg ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`;
          if (type === 'success') {
            setTimeout(() => {
              statusMsg.textContent = '';
              statusMsg.className = 'status-msg';
            }, 2000);
          }
        }
      }).then(success => {
        if (success) {
          chrome.storage.local.get(['openrouterPrimaryModel']).then(data => {
            if (data.openrouterPrimaryModel)
              updateModelLabel('openrouterModelLabel', data.openrouterPrimaryModel);
          });
        }
      });
    }
  }

  if (langSelect && data.selectedLanguage) {
    (langSelect as HTMLSelectElement).value = data.selectedLanguage;
    updateUILanguage(data.selectedLanguage);
  }

  if (darkModeCheckbox) {
    (darkModeCheckbox as HTMLInputElement).checked =
      data.darkMode !== undefined ? data.darkMode : true;
    if ((darkModeCheckbox as HTMLInputElement).checked) document.body.classList.add('dark');
  }

  const offlineModeCheckbox = document.getElementById('offlineMode') as HTMLInputElement;
  if (offlineModeCheckbox) {
    offlineModeCheckbox.checked = data.offlineMode || false;
  }

  const { openrouterPrimaryModel } = await chrome.storage.local.get(['openrouterPrimaryModel']);

  if (openrouterPrimaryModel && !openrouterPrimaryModel.includes('scout')) {
    updateModelLabel('openrouterModelLabel', openrouterPrimaryModel);
  }

  document.getElementById('settingsTab')?.addEventListener('click', () => switchTab('settings'));
  document.getElementById('statsTab')?.addEventListener('click', () => switchTab('stats'));

  langSelect?.addEventListener('change', (e: Event) => {
    const lang = (e.target as HTMLSelectElement).value;
    updateUILanguage(lang);
  });

  async function switchTab(tab: string) {
    ['settings', 'stats'].forEach(t => {
      const panel = document.getElementById(`${t}Panel`);
      const btn = document.getElementById(`${t}Tab`);
      if (panel) panel.style.display = t === tab ? 'block' : 'none';
      if (btn) {
        btn.style.background =
          t === tab ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5';
        btn.style.color = t === tab ? 'white' : '#666';
      }
    });
    if (tab === 'stats') await loadStats();
  }

  document.getElementById('exportBtn')?.addEventListener('click', exportData);
});

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
      ${
        stats.topTemplates.length
          ? `
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">${t.topTemplates}</div>
        ${stats.topTemplates.map(item => `<div style="font-size: 10px; color: #666;">${item.name}: ${item.count}</div>`).join('')}
      </div>`
          : ''
      }
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">${t.sharesLabel}</div>
        <div style="font-size: 10px; color: #666;">𝕏 Twitter: ${stats.shareStats.twitter}</div>
        <div style="font-size: 10px; color: #666;">💼 LinkedIn: ${stats.shareStats.linkedin}</div>
        <div style="font-size: 10px; color: #666;">📧 Email: ${stats.shareStats.email}</div>
      </div>
    </div>
  `;
}

document.getElementById('darkMode')?.addEventListener('change', e => {
  const checked = (e.target as HTMLInputElement).checked;
  document.body.classList.toggle('dark', checked);
  chrome.storage.local.set({ darkMode: checked });
});

document.getElementById('offlineMode')?.addEventListener('change', e => {
  const checked = (e.target as HTMLInputElement).checked;
  chrome.storage.local.set({ offlineMode: checked });
});

let openrouterKeyTimeout: NodeJS.Timeout;
document.getElementById('openrouterApiKey')?.addEventListener('input', e => {
  const key = (e.target as HTMLInputElement).value.trim();
  const input = e.target as HTMLInputElement;

  clearTimeout(openrouterKeyTimeout);

  if (key.length >= 20 && /^sk-or-v1-[a-f0-9]{64}$/.test(key)) {
    input.classList.add('valid');
    // Debounced auto-load models
    openrouterKeyTimeout = setTimeout(async () => {
      await validateAndSetupModels(key, 'openrouter', (msg, type) => {
        const { statusMsg } = getElements();
        if (statusMsg) {
          statusMsg.textContent =
            type === 'error' ? `⚠️ ${msg}` : type === 'success' ? `✓ ${msg}` : msg;
          statusMsg.className = `status-msg ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`;
          if (type === 'success') {
            setTimeout(() => {
              statusMsg.textContent = '';
              statusMsg.className = 'status-msg';
            }, 2000);
          }
        }
      }).then(success => {
        if (success) {
          chrome.storage.local.get(['openrouterPrimaryModel']).then(data => {
            if (data.openrouterPrimaryModel)
              updateModelLabel('openrouterModelLabel', data.openrouterPrimaryModel);
          });
        }
      });
    }, 1000);
  } else {
    input.classList.remove('valid');
  }
});

document.getElementById('saveKey')?.addEventListener('click', async () => {
  const {
    openrouterApiKey: openrouterInput,
    languageSelect: langSelect,
    statusMsg,
  } = getElements();
  const saveBtn = document.getElementById('saveKey') as HTMLButtonElement;

  if (!statusMsg || !openrouterInput || !langSelect) return;

  const openrouterKey = (openrouterInput as HTMLInputElement).value.trim();
  const lang = (langSelect as HTMLSelectElement).value;
  const t = translations[lang as keyof typeof translations] || translations.English;

  if (!openrouterKey || !/^sk-or-v1-[a-f0-9]{64}$/.test(openrouterKey)) {
    statusMsg.textContent = `⚠️ ${t.invalidKeyFormat}`;
    statusMsg.className = 'status-msg error';
    (openrouterInput as HTMLInputElement).style.borderColor = '#c5221f';
    setTimeout(() => {
      statusMsg.textContent = '';
      statusMsg.className = 'status-msg';
      (openrouterInput as HTMLInputElement).style.borderColor = '';
    }, 4000);
    return;
  }

  try {
    if (saveBtn) saveBtn.disabled = true;
    statusMsg.textContent = 'Saving settings...';
    statusMsg.className = 'status-msg';

    const { openrouterPrimaryModel, openrouterFallbackModels } = await chrome.storage.local.get([
      'openrouterPrimaryModel',
      'openrouterFallbackModels',
    ]);
    const primary = openrouterPrimaryModel;
    const fallbacks = openrouterFallbackModels || [];

    const offlineModeCheckbox = document.getElementById('offlineMode') as HTMLInputElement;
    const offlineMode = offlineModeCheckbox?.checked || false;

    const storageData: Record<string, any> = {
      openrouterApiKey: openrouterKey,
      selectedLanguage: lang,
      offlineMode,
    };

    if (primary) {
      storageData.openrouterPrimaryModel = primary;
      storageData.openrouterFallbackModels = fallbacks;
    }

    await chrome.storage.local.set(storageData);

    if (primary) {
      updateModelLabel('openrouterModelLabel', primary);
    }

    updateUILanguage(lang);

    statusMsg.textContent = `✓ ${t.saved}`;
    statusMsg.className = 'status-msg success';
    openrouterInput.classList.add('valid');
    (openrouterInput as HTMLInputElement).style.borderColor = '';

    setTimeout(() => {
      statusMsg.textContent = '';
      statusMsg.className = 'status-msg';
    }, 2000);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to save settings';
    statusMsg.textContent = `⚠️ ${errorMsg}`;
    statusMsg.className = 'status-msg error';
    (openrouterInput as HTMLInputElement).style.borderColor = '#c5221f';
    setTimeout(() => {
      statusMsg.textContent = '';
      statusMsg.className = 'status-msg';
      (openrouterInput as HTMLInputElement).style.borderColor = '';
    }, 5000);
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
});

const darkStyle = document.createElement('style');
darkStyle.textContent = `
  body.dark .tab-btn { background: #2a2a3e !important; color: #e0e0e0 !important; }
  body.dark .tab-btn.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; color: white !important; }
  body.dark #statsContent > div > div { background: #2a2a3e !important; color: #e0e0e0 !important; }
`;
document.head.appendChild(darkStyle);
