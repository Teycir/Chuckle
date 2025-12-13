import { MEME_TEMPLATES } from './constants';
import { analyzeMemeContext, generateMemeImage } from './geminiService';

const params = new URLSearchParams(window.location.search);
const dataStr = params.get('data');
let memeData = dataStr ? JSON.parse(decodeURIComponent(dataStr)) : null;
let currentTemplate = memeData?.template;
let isManualEdit = false;

const img = document.getElementById('memeImage') as HTMLImageElement;
const textEditor = document.getElementById('textEditor') as HTMLDivElement;
const templatesDiv = document.getElementById('templates') as HTMLDivElement;
const loading = document.getElementById('loading') as HTMLDivElement;

if (memeData) {
  img.src = memeData.imageUrl;
  textEditor.textContent = memeData.text;
  
  chrome.storage.local.get(['darkMode', 'offlineMode'], (data) => {
    if (data.darkMode) document.body.classList.add('dark');
    isOffline = data.offlineMode || false;
    if (offlineIcon && offlineText) {
      offlineIcon.textContent = isOffline ? '📴' : '📡';
      offlineText.textContent = isOffline ? 'Offline' : 'Online';
    }
  });
  
  MEME_TEMPLATES.forEach(template => {
    const btn = document.createElement('button');
    btn.className = 'template-btn';
    btn.textContent = template.name;
    if (template.id === currentTemplate) btn.classList.add('active');
    btn.onclick = () => regenerate(template.id);
    templatesDiv.appendChild(btn);
  });
}

textEditor.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    isManualEdit = true;
    regenerate();
  }
});

async function regenerate(templateId?: string) {
  loading.classList.add('show');
  try {
    const text = isManualEdit ? textEditor.textContent || '' : memeData.originalInput || memeData.text;
    const template = templateId || currentTemplate || await analyzeMemeContext(text);
    currentTemplate = template;
    
    const { watermarkedUrl, formattedText } = await generateMemeImage(template, text, isManualEdit, !!templateId);
    
    img.src = watermarkedUrl;
    if (!isManualEdit) textEditor.textContent = formattedText;
    memeData.imageUrl = watermarkedUrl;
    memeData.text = formattedText;
    memeData.template = template;
    
    document.querySelectorAll('.template-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(document.querySelectorAll('.template-btn')).find(
      btn => btn.textContent === MEME_TEMPLATES.find(t => t.id === template)?.name
    );
    activeBtn?.classList.add('active');
    
    isManualEdit = false;
  } catch (error) {
    alert('Regeneration failed: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    loading.classList.remove('show');
  }
}

document.getElementById('downloadBtn')?.addEventListener('click', async () => {
  const response = await fetch(img.src);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meme-${Date.now()}.png`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('shareBtn')?.addEventListener('click', async () => {
  const modal = document.createElement('div');
  modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 999999; display: flex; align-items: center; justify-content: center;';
  
  const content = document.createElement('div');
  content.style.cssText = 'background: white; border-radius: 20px; padding: 64px; max-width: 640px; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3);';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; background: transparent; border: none; width: 40px; height: 40px; font-size: 36px; cursor: pointer; color: #999;';
  closeBtn.onclick = () => modal.remove();
  
  const title = document.createElement('div');
  title.textContent = 'Share Meme';
  title.style.cssText = 'font-size: 24px; font-weight: 700; color: #333; margin-bottom: 16px; text-align: center;';
  
  const statusText = document.createElement('div');
  statusText.style.cssText = 'font-size: 16px; font-weight: 700; color: #333; text-align: center; margin-bottom: 32px; min-height: 24px;';
  
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = 'display: flex; justify-content: center; gap: 48px;';
  
  const platforms = [
    { name: 'Twitter', icon: '<svg width="80" height="80" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>', url: 'https://twitter.com/compose/tweet' },
    { name: 'LinkedIn', icon: '<svg width="80" height="80" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>', url: 'https://www.linkedin.com/feed/' },
    { name: 'Email', icon: '<svg width="80" height="80" viewBox="0 0 24 24" fill="#EA4335"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>', url: 'mailto:' }
  ];
  
  platforms.forEach(platform => {
    const btn = document.createElement('button');
    btn.innerHTML = platform.icon;
    btn.style.cssText = 'background: transparent; border: none; cursor: pointer; padding: 20px; border-radius: 20px; transition: all 0.2s;';
    btn.onmouseover = () => { btn.style.transform = 'scale(1.1)'; btn.style.background = '#f5f5f5'; };
    btn.onmouseout = () => { btn.style.transform = 'scale(1)'; btn.style.background = 'transparent'; };
    btn.onclick = async () => {
      statusText.textContent = 'Text copied!';
      await navigator.clipboard.writeText(`Check this meme: ${memeData.text}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      statusText.textContent = 'Image downloaded!';
      const response = await fetch(img.src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meme-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      window.open(platform.url, '_blank');
      modal.remove();
    };
    buttonsContainer.appendChild(btn);
  });
  
  content.appendChild(closeBtn);
  content.appendChild(title);
  content.appendChild(statusText);
  content.appendChild(buttonsContainer);
  modal.appendChild(content);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  
  document.body.appendChild(modal);
});

document.getElementById('regenerateBtn')?.addEventListener('click', async () => {
  loading.classList.add('show');
  try {
    const currentText = textEditor.textContent?.trim() || '';
    const hasTextChanged = currentText !== memeData.text;
    
    if (hasTextChanged) {
      // User edited text - use edited text with current template
      const { watermarkedUrl, formattedText } = await generateMemeImage(currentTemplate, currentText, true, true);
      img.src = watermarkedUrl;
      textEditor.textContent = formattedText;
      memeData.imageUrl = watermarkedUrl;
      memeData.text = formattedText;
    } else {
      // Text unchanged - regenerate with new template and formatting
      const text = memeData.originalInput || memeData.text;
      const template = await analyzeMemeContext(text, Date.now());
      currentTemplate = template;
      const { watermarkedUrl, formattedText } = await generateMemeImage(template, text, false, true);
      img.src = watermarkedUrl;
      textEditor.textContent = formattedText;
      memeData.imageUrl = watermarkedUrl;
      memeData.text = formattedText;
      memeData.template = template;
      document.querySelectorAll('.template-btn').forEach(btn => btn.classList.remove('active'));
      const activeBtn = Array.from(document.querySelectorAll('.template-btn')).find(
        btn => btn.textContent === MEME_TEMPLATES.find(t => t.id === template)?.name
      );
      activeBtn?.classList.add('active');
    }
  } catch (error) {
    alert('Regeneration failed: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    loading.classList.remove('show');
  }
});

document.getElementById('closeBtn')?.addEventListener('click', () => {
  window.close();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.close();
});

// Offline mode toggle
let isOffline = false;
const offlineIndicator = document.getElementById('offlineIndicator');
const offlineIcon = document.getElementById('offlineIcon');
const offlineText = document.getElementById('offlineText');

offlineIndicator?.addEventListener('click', () => {
  isOffline = !isOffline;
  chrome.storage.local.set({ offlineMode: isOffline });
  if (offlineIcon && offlineText) {
    offlineIcon.textContent = isOffline ? '📴' : '📡';
    offlineText.textContent = isOffline ? 'Offline' : 'Online';
  }
});

chrome.storage.local.get(['offlineMode'], (data) => {
  isOffline = data.offlineMode || false;
  if (offlineIcon && offlineText) {
    offlineIcon.textContent = isOffline ? '📴' : '📡';
    offlineText.textContent = isOffline ? 'Offline' : 'Online';
  }
});
