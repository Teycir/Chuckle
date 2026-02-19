import { getAnalytics, exportData } from './analytics';

let elements: Record<string, HTMLElement | null> = {};

function getElements() {
  if (!elements || Object.keys(elements).length === 0) {
    elements = {
      languageSelect: document.getElementById('languageSelect'),
      darkMode: document.getElementById('darkMode'),
      statusMsg: document.getElementById('statusMsg'),
    };
  }
  return elements;
}

const translations = {
  English: {
    title: '🎭 Chuckle Settings',
    languageLabel: '🌐 Language',
    darkModeLabel: '🌙 Dark Mode',
    saveButton: '💾 Save Settings',
    saved: 'Saved!',
    howToUse: 'How to use: Highlight text → Right-click → Remix as a Meme',
    madeBy: 'Meme generator, made by',
    settingsTab: '⚙️ Settings',
    statsTab: '📊 Stats',
    statsTitle: '📊 Your Meme Stats',
    totalMemes: 'Total Memes',
    topTemplates: '🏆 Top Templates',
    sharesLabel: '📤 Shares',
    exportData: '📥 Export Data',
  },
  Spanish: {
    title: '🎭 Configuración de Chuckle',
    languageLabel: '🌐 Idioma',
    darkModeLabel: '🌙 Modo Oscuro',
    saveButton: '💾 Guardar Configuración',
    saved: '¡Guardado!',
    howToUse: 'Cómo usar: Resaltar texto → Clic derecho → Remix as a Meme',
    madeBy: 'Generador de memes, hecho por',
    settingsTab: '⚙️ Configuración',
    statsTab: '📊 Estadísticas',
    statsTitle: '📊 Tus Estadísticas',
    totalMemes: 'Memes Totales',
    topTemplates: '🏆 Mejores Plantillas',
    sharesLabel: '📤 Compartidos',
    exportData: '📥 Exportar Datos',
  },
  French: {
    title: '🎭 Paramètres Chuckle',
    languageLabel: '🌐 Langue',
    darkModeLabel: '🌙 Mode Sombre',
    saveButton: '💾 Enregistrer',
    saved: 'Enregistré!',
    howToUse: 'Comment utiliser: Surligner le texte → Clic droit → Remix as a Meme',
    madeBy: 'Générateur de mèmes, créé par',
    settingsTab: '⚙️ Paramètres',
    statsTab: '📊 Statistiques',
    statsTitle: '📊 Vos Statistiques',
    totalMemes: 'Memes Totaux',
    topTemplates: '🏆 Meilleurs Modèles',
    sharesLabel: '📤 Partages',
    exportData: '📥 Exporter les Données',
  },
  German: {
    title: '🎭 Chuckle Einstellungen',
    languageLabel: '🌐 Sprache',
    darkModeLabel: '🌙 Dunkler Modus',
    saveButton: '💾 Speichern',
    saved: 'Gespeichert!',
    howToUse: 'Verwendung: Text markieren → Rechtsklick → Remix as a Meme',
    madeBy: 'Meme-Generator, erstellt von',
    settingsTab: '⚙️ Einstellungen',
    statsTab: '📊 Statistiken',
    statsTitle: '📊 Ihre Statistiken',
    totalMemes: 'Memes Gesamt',
    topTemplates: '🏆 Top-Vorlagen',
    sharesLabel: '📤 Teilungen',
    exportData: '📥 Daten Exportieren',
  },
};

function updateUILanguage(lang: string) {
  const t = translations[lang as keyof typeof translations] || translations.English;

  const title = document.querySelector('#settingsPanel h2');
  if (title) title.textContent = t.title;

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

  const statsTitle = document.querySelector('#statsPanel h2');
  if (statsTitle) statsTitle.textContent = t.statsTitle;

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.textContent = t.exportData;
}

document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.local.get([
    'selectedLanguage',
    'darkMode',
  ]);
  const {
    languageSelect: langSelect,
    darkMode: darkModeCheckbox,
  } = getElements();

  if (langSelect && data.selectedLanguage) {
    (langSelect as HTMLSelectElement).value = data.selectedLanguage;
    updateUILanguage(data.selectedLanguage);
  }

  if (darkModeCheckbox) {
    (darkModeCheckbox as HTMLInputElement).checked =
      data.darkMode !== undefined ? data.darkMode : true;
    if ((darkModeCheckbox as HTMLInputElement).checked) document.body.classList.add('dark');
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
      ${stats.topTemplates.length
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

document.getElementById('saveKey')?.addEventListener('click', async () => {
  const {
    languageSelect: langSelect,
    statusMsg,
  } = getElements();
  const saveBtn = document.getElementById('saveKey') as HTMLButtonElement;

  if (!statusMsg || !langSelect) return;

  const lang = (langSelect as HTMLSelectElement).value;
  const t = translations[lang as keyof typeof translations] || translations.English;

  try {
    if (saveBtn) saveBtn.disabled = true;
    statusMsg.textContent = 'Saving settings...';
    statusMsg.className = 'status-msg';

    const storageData: Record<string, any> = {
      selectedLanguage: lang,
    };

    await chrome.storage.local.set(storageData);

    updateUILanguage(lang);

    statusMsg.textContent = `✓ ${t.saved}`;
    statusMsg.className = 'status-msg success';

    setTimeout(() => {
      statusMsg.textContent = '';
      statusMsg.className = 'status-msg';
    }, 2000);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to save settings';
    statusMsg.textContent = `⚠️ ${errorMsg}`;
    statusMsg.className = 'status-msg error';
    setTimeout(() => {
      statusMsg.textContent = '';
      statusMsg.className = 'status-msg';
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

