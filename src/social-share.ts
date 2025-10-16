import { addWatermark } from './watermark';

interface SharePlatform {
  name: string;
  icon: string;
  getUrl: (imageUrl: string, text: string) => string;
}

const shareTranslations = {
  English: {
    shareMeme: 'Share Meme',
    shareOn: 'Share on',
    emailSubject: 'Check out this meme!',
    download: 'Download',
    regenerate: 'Regenerate',
    close: 'Close',
    textCopied: 'Text copied!',
    imageDownloaded: 'Image downloaded!',
    checkThisMeme: 'Check this meme:'
  },
  Spanish: {
    shareMeme: 'Compartir Meme',
    shareOn: 'Compartir en',
    emailSubject: '¡Mira este meme!',
    download: 'Descargar',
    regenerate: 'Regenerar',
    close: 'Cerrar',
    textCopied: '¡Texto copiado!',
    imageDownloaded: '¡Imagen descargada!',
    checkThisMeme: 'Mira este meme:'
  },
  French: {
    shareMeme: 'Partager Meme',
    shareOn: 'Partager sur',
    emailSubject: 'Regardez ce meme!',
    download: 'Télécharger',
    regenerate: 'Regénérer',
    close: 'Fermer',
    textCopied: 'Texte copié!',
    imageDownloaded: 'Image téléchargée!',
    checkThisMeme: 'Regardez ce meme:'
  },
  German: {
    shareMeme: 'Meme Teilen',
    shareOn: 'Teilen auf',
    emailSubject: 'Schau dir dieses Meme an!',
    download: 'Herunterladen',
    regenerate: 'Regenerieren',
    close: 'Schließen',
    textCopied: 'Text kopiert!',
    imageDownloaded: 'Bild heruntergeladen!',
    checkThisMeme: 'Schau dir dieses Meme an:'
  }
};

function getTranslation(key: keyof typeof shareTranslations.English, lang: string = 'English'): string {
  const language = lang as keyof typeof shareTranslations;
  return shareTranslations[language]?.[key] || shareTranslations.English[key];
}

async function downloadMeme(imageUrl: string): Promise<void> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meme-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getPlatforms(lang: string): SharePlatform[] {
  return [
    {
      name: 'Twitter',
      icon: '𝕏',
      getUrl: () => 'https://twitter.com/compose/tweet'
    },
    {
      name: 'LinkedIn',
      icon: 'in',
      getUrl: () => 'https://www.linkedin.com/feed/'
    },
    {
      name: 'Email',
      icon: '✉️',
      getUrl: () => 'mailto:'
    }
  ];
}

async function trackShare(platform: string): Promise<void> {
  const key = `share_${platform.toLowerCase()}`;
  const data = await chrome.storage.local.get(key);
  await chrome.storage.local.set({ [key]: (data[key] || 0) + 1 });
}

function createShareModal(imageUrl: string, text: string, lang: string): HTMLDivElement {
  const modal = document.createElement('div');
  modal.className = 'share-modal';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 2147483648; display: flex; align-items: center; justify-content: center;';
  
  const content = document.createElement('div');
  content.style.cssText = 'background: white; border-radius: 20px; padding: 64px; max-width: 640px; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3);';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; background: transparent; border: none; width: 40px; height: 40px; font-size: 36px; cursor: pointer; color: #999; transition: color 0.2s;';
  closeBtn.onmouseover = () => closeBtn.style.color = '#333';
  closeBtn.onmouseout = () => closeBtn.style.color = '#999';
  closeBtn.onclick = () => modal.remove();
  
  const title = document.createElement('div');
  title.textContent = getTranslation('shareMeme', lang);
  title.style.cssText = 'font-size: 24px; font-weight: 700; color: #333; margin-bottom: 16px; text-align: center;';
  
  const statusText = document.createElement('div');
  statusText.style.cssText = 'font-size: 14px; color: #666; text-align: center; margin-bottom: 32px; min-height: 20px;';
  
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = 'display: flex; justify-content: center; gap: 48px;';
  
  const platforms = getPlatforms(lang);
  const icons = {
    'Twitter': '<svg width="80" height="80" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    'LinkedIn': '<svg width="80" height="80" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    'Email': '<svg width="80" height="80" viewBox="0 0 24 24" fill="#EA4335"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>'
  };
  
  platforms.forEach(platform => {
    const btn = document.createElement('button');
    btn.innerHTML = icons[platform.name as keyof typeof icons];
    btn.style.cssText = 'background: transparent; border: none; cursor: pointer; padding: 20px; border-radius: 20px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; min-width: 120px; min-height: 120px; flex-shrink: 0;';
    btn.onmouseover = () => { btn.style.transform = 'scale(1.1)'; btn.style.background = '#f5f5f5'; };
    btn.onmouseout = () => { btn.style.transform = 'scale(1)'; btn.style.background = 'transparent'; };
    btn.onclick = async () => {
      const shareText = `${getTranslation('checkThisMeme', lang)} ${text}`;
      statusText.textContent = getTranslation('textCopied', lang);
      await navigator.clipboard.writeText(shareText);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      statusText.textContent = getTranslation('imageDownloaded', lang);
      await downloadMeme(imageUrl);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      window.open(platform.getUrl(imageUrl, text), '_blank');
      trackShare(platform.name);
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
  
  return modal;
}

export function createShareButton(imageUrl: string, text: string, lang: string = 'English'): HTMLDivElement {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 4px;';
  
  const btn = document.createElement('button');
  btn.className = 'share-btn';
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display: block; pointer-events: none;"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M15.5 6.5L8.5 10.5M8.5 13.5L15.5 17.5" stroke="currentColor" stroke-width="2" fill="none"/></svg>';
  btn.setAttribute('aria-label', getTranslation('shareMeme', lang));
  
  btn.onclick = (e) => {
    e.stopPropagation();
    const modal = createShareModal(imageUrl, text, lang);
    document.body.appendChild(modal);
  };
  
  const label = document.createElement('div');
  label.textContent = getTranslation('shareMeme', lang);
  label.style.cssText = 'font-size: 10px; color: #5f6368; font-weight: 500;';
  
  container.appendChild(btn);
  container.appendChild(label);
  
  return container;
}
