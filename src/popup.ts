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
});

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
