import { getAnalytics, exportData } from './analytics';

let cachedModels: any = null;
let cachedApiKey: string | null = null;
let elements: any = null;

function getElements() {
  if (!elements) {
    elements = {
      providerSelect: document.getElementById('providerSelect'),
      geminiApiKey: document.getElementById('geminiApiKey'),
      openrouterApiKey: document.getElementById('openrouterApiKey'),
      languageSelect: document.getElementById('languageSelect'),
      darkMode: document.getElementById('darkMode'),
      statusMsg: document.getElementById('statusMsg')
    };
  }
  return elements;
}

function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function loadOpenRouterModels(apiKey: string): Promise<any[]> {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 20) return [];
  
  const { statusMsg } = getElements();
  
  try {
    if (statusMsg) {
      statusMsg.textContent = 'Loading models...';
      statusMsg.className = 'status-msg';
    }
    
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('lib/model-selector.js');
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    
    const selected = (window as any).selectBestOpenAIModels(data.data);
    
    if (!selected.primary) throw new Error('No free models found');
    
    await chrome.storage.local.set({ 
      openrouterPrimaryModel: selected.primary,
      openrouterFallbackModels: selected.fallbacks
    });
    
    const modelName = selected.primary.split('/').pop();
    const tooltip = document.getElementById('openrouterModelTooltip');
    console.log('[Chuckle] OpenRouter tooltip element:', tooltip);
    console.log('[Chuckle] OpenRouter model name:', modelName);
    if (tooltip) {
      tooltip.textContent = `🤖 ${modelName}`;
      console.log('[Chuckle] OpenRouter tooltip updated:', tooltip.textContent);
    } else {
      console.error('[Chuckle] OpenRouter tooltip element not found!');
    }
    
    if (statusMsg) {
      statusMsg.textContent = `✓ Model: ${modelName}`;
      statusMsg.className = 'status-msg success';
      setTimeout(() => {
        statusMsg.textContent = '';
        statusMsg.className = 'status-msg';
      }, 2000);
    }
    
    return data.data;
  } catch (error) {
    console.error('Failed to load OpenRouter models:', error);
    if (statusMsg) {
      statusMsg.textContent = `⚠️ ${error instanceof Error ? error.message : 'Error'}`;
      statusMsg.className = 'status-msg error';
      setTimeout(() => {
        statusMsg.textContent = '';
        statusMsg.className = 'status-msg';
      }, 4000);
    }
    return [];
  }
}

async function loadModels(apiKey: string): Promise<any[]> {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 39) return [];
  if (cachedModels && constantTimeCompare(cachedApiKey || '', apiKey)) {
    return cachedModels;
  }
  
  const { statusMsg } = getElements();
  
  try {
    if (statusMsg) {
      statusMsg.textContent = 'Loading models...';
      statusMsg.className = 'status-msg';
    }
    
    const url = new URL('https://generativelanguage.googleapis.com/v1beta/models');
    url.searchParams.set('key', apiKey);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }
    const data = await response.json();
    
    const models = data.models?.filter((m: any) => {
      if (!m.supportedGenerationMethods?.includes('generateContent')) return false;
      const displayName = m.displayName.toLowerCase();
      return displayName.includes('flash') && !displayName.includes('lite');
    }).sort((a: any, b: any) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aVersion = parseFloat((aName.match(/(\d+\.\d+)/) || ['0'])[0]);
      const bVersion = parseFloat((bName.match(/(\d+\.\d+)/) || ['0'])[0]);
      if (aVersion !== bVersion) return bVersion - aVersion;
      const aHasPreview = aName.includes('preview');
      const bHasPreview = bName.includes('preview');
      if (aHasPreview !== bHasPreview) return aHasPreview ? 1 : -1;
      return a.name.length - b.name.length;
    }) || [];
    
    const latestVersion = models[0] ? parseFloat((models[0].name.toLowerCase().match(/(\d+\.\d+)/) || ['0'])[0]) : 0;
    const latestStable = models.find((m: any) => !m.name.toLowerCase().includes('preview') && parseFloat((m.name.toLowerCase().match(/(\d+\.\d+)/) || ['0'])[0]) === latestVersion);
    const latestPreview = models.find((m: any) => m.name.toLowerCase().includes('preview') && parseFloat((m.name.toLowerCase().match(/(\d+\.\d+)/) || ['0'])[0]) === latestVersion);
    const prevVersion = models.find((m: any) => parseFloat((m.name.toLowerCase().match(/(\d+\.\d+)/) || ['0'])[0]) < latestVersion);
    
    const primary = latestStable?.name || latestPreview?.name || prevVersion?.name;
    const fallbacks = [latestPreview?.name, prevVersion?.name].filter(Boolean).filter((m: any) => m !== primary).slice(0, 2);
    
    cachedModels = models;
    cachedApiKey = apiKey;
    
    await chrome.storage.local.set({ 
      primaryModel: primary,
      fallbackModels: fallbacks
    });
    
    if (primary) {
      const modelName = primary.split('/').pop();
      const tooltip = document.getElementById('geminiModelTooltip');
      if (tooltip) tooltip.textContent = `🤖 ${modelName}`;
    }
    
    if (statusMsg) {
      statusMsg.textContent = primary ? `✓ Model loaded` : '⚠️ No models found';
      statusMsg.className = primary ? 'status-msg success' : 'status-msg error';
      setTimeout(() => {
        statusMsg.textContent = '';
        statusMsg.className = 'status-msg';
      }, 2000);
    }
    
    return models;
  } catch (error) {
    console.error('Failed to load models:', error);
    
    if (statusMsg) {
      const isAbort = error instanceof Error && error.name === 'AbortError';
      statusMsg.textContent = isAbort ? '⚠️ Request timeout' : `⚠️ ${error instanceof Error ? error.message : 'Error'}`;
      statusMsg.className = 'status-msg error';
      setTimeout(() => {
        statusMsg.textContent = '';
        statusMsg.className = 'status-msg';
      }, 4000);
    }
    
    return [];
  }
}

const translations = {
  English: {
    title: '🎭 Chuckle Settings',
    providerLabel: '🔐 AI Provider',
    apiKeyLabel: '🔑 Gemini API Key',
    apiHelp: 'Get key from',
    openrouterKeyLabel: '🔑 OpenRouter Key',
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
    noModelsFound: 'No compatible models found'
  },
  Spanish: {
    title: '🎭 Configuración de Chuckle',
    providerLabel: '🔐 Proveedor de IA',
    apiKeyLabel: '🔑 Clave API de Gemini',
    apiHelp: 'Obtener clave de',
    openrouterKeyLabel: '🔑 Clave OpenRouter',
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
    noModelsFound: 'No se encontraron modelos compatibles'
  },
  French: {
    title: '🎭 Paramètres Chuckle',
    providerLabel: '🔐 Fournisseur IA',
    apiKeyLabel: '🔑 Clé API Gemini',
    apiHelp: 'Obtenir la clé de',
    openrouterKeyLabel: '🔑 Clé OpenRouter',
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
    noModelsFound: 'Aucun modèle compatible trouvé'
  },
  German: {
    title: '🎭 Chuckle Einstellungen',
    providerLabel: '🔐 KI-Anbieter',
    apiKeyLabel: '🔑 Gemini API-Schlüssel',
    apiHelp: 'Schlüssel erhalten von',
    openrouterKeyLabel: '🔑 OpenRouter-Schlüssel',
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
    noModelsFound: 'Keine kompatiblen Modelle gefunden'
  }
};

function updateUILanguage(lang: string) {
  const t = translations[lang as keyof typeof translations] || translations.English;
  
  const title = document.querySelector('#settingsPanel h2');
  if (title) title.textContent = t.title;
  
  const providerLabel = document.querySelector('label[for="providerSelect"]');
  if (providerLabel) providerLabel.textContent = t.providerLabel;
  
  const apiKeyLabel = document.querySelector('label[for="geminiApiKey"]');
  if (apiKeyLabel) apiKeyLabel.textContent = t.apiKeyLabel;
  
  const openrouterKeyLabel = document.querySelector('label[for="openrouterApiKey"]');
  if (openrouterKeyLabel) openrouterKeyLabel.textContent = t.openrouterKeyLabel;
  
  const geminiHelpText = document.getElementById('geminiKeyHelpText');
  if (geminiHelpText) geminiHelpText.textContent = t.apiHelp;
  
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

document.getElementById('providerSelect')?.addEventListener('change', (e) => {
  const isOpenRouter = (e.target as HTMLSelectElement).value === 'openrouter';
  const geminiGroup = document.getElementById('geminiKeyGroup');
  const openrouterGroup = document.getElementById('openrouterKeyGroup');
  const geminiHelp = document.getElementById('geminiKeyHelp');
  const openrouterHelp = document.getElementById('openrouterKeyHelp');
  if (geminiGroup) geminiGroup.style.display = isOpenRouter ? 'none' : 'block';
  if (openrouterGroup) openrouterGroup.style.display = isOpenRouter ? 'block' : 'none';
  if (geminiHelp) geminiHelp.style.display = isOpenRouter ? 'none' : 'block';
  if (openrouterHelp) openrouterHelp.style.display = isOpenRouter ? 'block' : 'none';
});

document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.local.get(['aiProvider', 'geminiApiKey', 'openrouterApiKey', 'selectedLanguage', 'darkMode', 'offlineMode']);
  const { providerSelect, geminiApiKey: geminiInput, openrouterApiKey: openrouterInput, languageSelect: langSelect, darkMode: darkModeCheckbox } = getElements();
  
  if (providerSelect) {
    providerSelect.value = data.aiProvider || 'google';
    const isOpenRouter = (data.aiProvider || 'google') === 'openrouter';
    const geminiGroup = document.getElementById('geminiKeyGroup');
    const openrouterGroup = document.getElementById('openrouterKeyGroup');
    const geminiHelp = document.getElementById('geminiKeyHelp');
    const openrouterHelp = document.getElementById('openrouterKeyHelp');
    if (geminiGroup) geminiGroup.style.display = isOpenRouter ? 'none' : 'block';
    if (openrouterGroup) openrouterGroup.style.display = isOpenRouter ? 'block' : 'none';
    if (geminiHelp) geminiHelp.style.display = isOpenRouter ? 'none' : 'block';
    if (openrouterHelp) openrouterHelp.style.display = isOpenRouter ? 'block' : 'none';
  }
  
  if (geminiInput && data.geminiApiKey) {
    geminiInput.value = data.geminiApiKey;
    geminiInput.classList.add('valid');
  }
  
  if (openrouterInput && data.openrouterApiKey) {
    openrouterInput.value = data.openrouterApiKey;
    openrouterInput.classList.add('valid');
  }
  
  if (langSelect && data.selectedLanguage) {
    langSelect.value = data.selectedLanguage;
    updateUILanguage(data.selectedLanguage);
  }
  
  if (darkModeCheckbox) {
    darkModeCheckbox.checked = data.darkMode !== undefined ? data.darkMode : true;
    if (darkModeCheckbox.checked) document.body.classList.add('dark');
  }
  
  const offlineModeCheckbox = document.getElementById('offlineMode') as HTMLInputElement;
  if (offlineModeCheckbox) {
    offlineModeCheckbox.checked = data.offlineMode || false;
  }
  
  const { primaryModel, openrouterPrimaryModel } = await chrome.storage.local.get(['primaryModel', 'openrouterPrimaryModel']);
  
  if (primaryModel) {
    const modelName = primaryModel.split('/').pop();
    const tooltip = document.getElementById('geminiModelTooltip');
    if (tooltip) tooltip.textContent = `🤖 ${modelName}`;
  }
  
  if (openrouterPrimaryModel && !openrouterPrimaryModel.includes('scout')) {
    const modelName = openrouterPrimaryModel.split('/').pop();
    const tooltip = document.getElementById('openrouterModelTooltip');
    if (tooltip) tooltip.textContent = `🤖 ${modelName}`;
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
        btn.style.background = t === tab ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5';
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
      ${stats.topTemplates.length ? `
      <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">${t.topTemplates}</div>
        ${stats.topTemplates.map(item => `<div style="font-size: 10px; color: #666;">${item.name}: ${item.count}</div>`).join('')}
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

document.getElementById('offlineMode')?.addEventListener('change', (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  chrome.storage.local.set({ offlineMode: checked });
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

document.getElementById('openrouterApiKey')?.addEventListener('input', (e) => {
  const key = (e.target as HTMLInputElement).value.trim();
  const input = e.target as HTMLInputElement;
  if (key.length >= 20) {
    input.classList.add('valid');
  } else {
    input.classList.remove('valid');
  }
});

document.getElementById('saveKey')?.addEventListener('click', async () => {
  const { providerSelect, geminiApiKey: geminiInput, openrouterApiKey: openrouterInput, languageSelect: langSelect, statusMsg } = getElements();
  const saveBtn = document.getElementById('saveKey') as HTMLButtonElement;
  
  if (!statusMsg) return;
  
  const provider = providerSelect.value;
  const geminiKey = geminiInput.value.trim();
  const openrouterKey = openrouterInput.value.trim();
  const lang = langSelect.value;
  const t = translations[lang as keyof typeof translations] || translations.English;
  
  if (provider === 'google') {
    if (!geminiKey || !/^AIza[0-9A-Za-z_-]{35}$/.test(geminiKey)) {
      statusMsg.textContent = `⚠️ ${t.invalidKeyFormat}`;
      statusMsg.className = 'status-msg error';
      geminiInput.style.borderColor = '#c5221f';
      setTimeout(() => { statusMsg.textContent = ''; statusMsg.className = 'status-msg'; geminiInput.style.borderColor = ''; }, 4000);
      return;
    }
  } else {
    if (!openrouterKey || !/^sk-or-v1-[a-f0-9]{64}$/.test(openrouterKey)) {
      statusMsg.textContent = `⚠️ ${t.invalidKeyFormat}`;
      statusMsg.className = 'status-msg error';
      openrouterInput.style.borderColor = '#c5221f';
      setTimeout(() => { statusMsg.textContent = ''; statusMsg.className = 'status-msg'; openrouterInput.style.borderColor = ''; }, 4000);
      return;
    }
  }

  try {
    if (saveBtn) saveBtn.disabled = true;
    statusMsg.textContent = 'Testing API key...';
    statusMsg.className = 'status-msg';
    
    await chrome.storage.local.remove(['primaryModel', 'fallbackModels', 'openrouterPrimaryModel', 'openrouterFallbackModels']);
    
    let primary, fallbacks;
    if (provider === 'google') {
      const models = await loadModels(geminiKey);
      if (models.length === 0) throw new Error(t.cannotLoadModels);
      const { primaryModel, fallbackModels } = await chrome.storage.local.get(['primaryModel', 'fallbackModels']);
      primary = primaryModel;
      fallbacks = fallbackModels;
      if (!primary) throw new Error(t.noModelsFound);
    } else {
      const models = await loadOpenRouterModels(openrouterKey);
      if (models.length === 0) throw new Error(t.cannotLoadModels);
      const { openrouterPrimaryModel, openrouterFallbackModels } = await chrome.storage.local.get(['openrouterPrimaryModel', 'openrouterFallbackModels']);
      primary = openrouterPrimaryModel;
      fallbacks = openrouterFallbackModels;
      if (!primary) throw new Error(t.noModelsFound);
    }
    
    const offlineModeCheckbox = document.getElementById('offlineMode') as HTMLInputElement;
    const offlineMode = offlineModeCheckbox?.checked || false;
    
    const storageData: any = { 
      aiProvider: provider,
      geminiApiKey: geminiKey,
      openrouterApiKey: openrouterKey,
      selectedLanguage: lang,
      offlineMode
    };
    
    if (provider === 'google') {
      storageData.primaryModel = primary;
      storageData.fallbackModels = fallbacks;
    } else {
      storageData.openrouterPrimaryModel = primary;
      storageData.openrouterFallbackModels = fallbacks;
    }
    
    await chrome.storage.local.set(storageData);
    
    if (provider === 'google' && primary) {
      const modelName = primary.split('/').pop();
      const tooltip = document.getElementById('geminiModelTooltip');
      if (tooltip) tooltip.textContent = `🤖 ${modelName}`;
    } else if (provider === 'openrouter' && primary) {
      const modelName = primary.split('/').pop();
      const tooltip = document.getElementById('openrouterModelTooltip');
      if (tooltip) tooltip.textContent = `🤖 ${modelName}`;
    }
    
    updateUILanguage(lang);
    
    const t = translations[lang as keyof typeof translations] || translations.English;
    statusMsg.textContent = `✓ ${t.saved}`;
    statusMsg.className = 'status-msg success';
    if (provider === 'google') {
      geminiInput.classList.add('valid');
      geminiInput.style.borderColor = '';
    } else {
      openrouterInput.classList.add('valid');
      openrouterInput.style.borderColor = '';
    }
    
    setTimeout(() => {
      statusMsg.textContent = '';
      statusMsg.className = 'status-msg';
    }, 2000);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to save settings';
    statusMsg.textContent = `⚠️ ${errorMsg}`;
    statusMsg.className = 'status-msg error';
    if (provider === 'google') {
      geminiInput.style.borderColor = '#c5221f';
    } else {
      openrouterInput.style.borderColor = '#c5221f';
    }
    setTimeout(() => { 
      statusMsg.textContent = ''; 
      statusMsg.className = 'status-msg';
      geminiInput.style.borderColor = '';
      openrouterInput.style.borderColor = '';
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
