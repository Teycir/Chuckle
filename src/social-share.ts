interface SharePlatform {
  name: string;
  icon: string;
  getUrl: (imageUrl: string, text: string) => string;
}

const PLATFORMS: SharePlatform[] = [
  {
    name: 'Twitter',
    icon: '𝕏',
    getUrl: (img, txt) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(txt + '\n\n' + img)}`
  },
  {
    name: 'Reddit',
    icon: '🔴',
    getUrl: (img, txt) => `https://reddit.com/submit?url=${encodeURIComponent(img)}&title=${encodeURIComponent(txt)}`
  },
  {
    name: 'LinkedIn',
    icon: '💼',
    getUrl: (img) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(img)}`
  },
  {
    name: 'Email',
    icon: '📧',
    getUrl: (img, txt) => `mailto:?subject=${encodeURIComponent('Check out this meme!')}&body=${encodeURIComponent(txt + '\n\n' + img)}`
  }
];

async function trackShare(platform: string): Promise<void> {
  const key = `share_${platform.toLowerCase()}`;
  const data = await chrome.storage.local.get(key);
  await chrome.storage.local.set({ [key]: (data[key] || 0) + 1 });
}

function createShareMenu(imageUrl: string, text: string): HTMLDivElement {
  const menu = document.createElement('div');
  menu.className = 'share-menu';
  Object.assign(menu.style, {
    position: 'absolute',
    top: '45px',
    right: '10px',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    padding: '8px',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    zIndex: '1000'
  });

  PLATFORMS.forEach(platform => {
    const btn = document.createElement('button');
    btn.textContent = platform.icon;
    btn.title = `Share on ${platform.name}`;
    Object.assign(btn.style, {
      padding: '8px 12px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '18px',
      background: '#f5f5f5',
      transition: 'transform 0.2s'
    });
    btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
    btn.onmouseleave = () => btn.style.transform = 'scale(1)';
    btn.onclick = () => {
      window.open(platform.getUrl(imageUrl, text), '_blank');
      trackShare(platform.name);
      menu.remove();
    };
    menu.appendChild(btn);
  });

  return menu;
}

export function createShareButton(imageUrl: string, text: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'share-btn';
  btn.textContent = '🚀';
  btn.title = 'Share meme';
  Object.assign(btn.style, {
    position: 'absolute',
    top: '10px',
    right: '50px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    zIndex: '1',
    opacity: '0.8',
    transition: 'opacity 0.2s'
  });
  btn.onmouseenter = () => btn.style.opacity = '1';
  btn.onmouseleave = () => btn.style.opacity = '0.8';
  
  btn.onclick = () => {
    const existing = document.querySelector('.share-menu');
    if (existing) {
      existing.remove();
      return;
    }
    const menu = createShareMenu(imageUrl, text);
    btn.parentElement?.appendChild(menu);
    
    const closeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node) && e.target !== btn) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  };
  
  return btn;
}
