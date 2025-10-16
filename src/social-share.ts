import { addWatermark } from './watermark';

interface SharePlatform {
  name: string;
  icon: string;
  getUrl: (imageUrl: string, text: string) => string;
}

const shareTranslations = {
  English: {
    shareMeme: 'Share meme',
    shareOn: 'Share on',
    emailSubject: 'Check out this meme!'
  },
  Spanish: {
    shareMeme: 'Compartir meme',
    shareOn: 'Compartir en',
    emailSubject: '¡Mira este meme!'
  },
  French: {
    shareMeme: 'Partager le meme',
    shareOn: 'Partager sur',
    emailSubject: 'Regardez ce meme!'
  },
  German: {
    shareMeme: 'Meme teilen',
    shareOn: 'Teilen auf',
    emailSubject: 'Schau dir dieses Meme an!'
  }
};

function getTranslation(key: keyof typeof shareTranslations.English, lang: string = 'English'): string {
  const language = lang as keyof typeof shareTranslations;
  return shareTranslations[language]?.[key] || shareTranslations.English[key];
}

function getPlatforms(lang: string): SharePlatform[] {
  return [
    {
      name: 'Twitter',
      icon: '𝕏',
      getUrl: (img, txt) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(txt + '\n\n' + img)}`
    },
    {
      name: 'LinkedIn',
      icon: 'in',
      getUrl: (img) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(img)}`
    },
    {
      name: 'Email',
      icon: '✉️',
      getUrl: (img, txt) => `mailto:?subject=${encodeURIComponent(getTranslation('emailSubject', lang))}&body=${encodeURIComponent(txt + '\n\n' + img)}`
    }
  ];
}

async function trackShare(platform: string): Promise<void> {
  const key = `share_${platform.toLowerCase()}`;
  const data = await chrome.storage.local.get(key);
  await chrome.storage.local.set({ [key]: (data[key] || 0) + 1 });
}

function createShareMenu(imageUrl: string, text: string, lang: string): HTMLDivElement {
  const menu = document.createElement('div');
  menu.className = 'share-menu';

  getPlatforms(lang).forEach(platform => {
    const btn = document.createElement('button');
    btn.className = 'share-option';
    btn.innerHTML = `${platform.icon} ${getTranslation('shareOn', lang)} ${platform.name}`;
    btn.onclick = () => {
      window.open(platform.getUrl(imageUrl, text), '_blank');
      trackShare(platform.name);
      menu.remove();
    };
    menu.appendChild(btn);
  });

  return menu;
}

export function createShareButton(imageUrl: string, text: string, lang: string = 'English'): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'share-btn';
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display: block; pointer-events: none;"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M15.5 6.5L8.5 10.5M8.5 13.5L15.5 17.5" stroke="currentColor" stroke-width="2" fill="none"/></svg>';
  btn.setAttribute('data-tooltip', getTranslation('shareMeme', lang));
  
  const menu = createShareMenu(imageUrl, text, lang);
  btn.appendChild(menu);
  
  btn.onclick = (e) => {
    e.stopPropagation();
    menu.classList.toggle('visible');
  };
  
  return btn;
}
