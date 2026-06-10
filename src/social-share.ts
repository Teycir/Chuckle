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

/**
 * Returns a Blob for any image src — handles data: URLs without fetch
 * (fetch on data: URLs is blocked by the extension's connect-src CSP).
 */
async function getImageBlob(src: string): Promise<Blob> {
  if (src.startsWith('data:')) {
    const [header, base64] = src.split(',');
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  const response = await fetch(src);
  return response.blob();
}

async function downloadMeme(imageUrl: string): Promise<void> {
  const blob = await getImageBlob(imageUrl);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meme-${Date.now()}.png`;
  // Must be in DOM for Chrome to honour the download attribute
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getPlatforms(_lang: string): SharePlatform[] {
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
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const modal = document.createElement('div');
  modal.className = 'share-modal';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 2147483648; display: flex; align-items: center; justify-content: center;';

  const content = document.createElement('div');
  content.style.cssText = 'background: white; border-radius: 20px; padding: 40px 48px 36px; max-width: 480px; width: 90%; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3);';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; background: transparent; border: none; width: 40px; height: 40px; font-size: 36px; cursor: pointer; color: #999; transition: color 0.2s;';
  closeBtn.onmouseover = () => closeBtn.style.color = '#333';
  closeBtn.onmouseout = () => closeBtn.style.color = '#999';
  closeBtn.onclick = () => modal.remove();

  const title = document.createElement('div');
  title.textContent = getTranslation('shareMeme', lang);
  title.style.cssText = 'font-size: 22px; font-weight: 700; color: #333; margin-bottom: 28px; text-align: center;';

  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = 'display: flex; justify-content: center; gap: 24px;';

  const statusText = document.createElement('div');
  statusText.style.cssText = 'font-size: 14px; font-weight: 600; color: #667eea; text-align: center; margin-top: 20px; min-height: 20px;';

  // SVG path data per platform
  const platformDefs = [
    {
      name: 'Twitter',
      color: '#000000',
      paths: ['M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'],
      getUrl: () => 'https://twitter.com/compose/tweet'
    },
    {
      name: 'LinkedIn',
      color: '#0A66C2',
      paths: ['M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'],
      getUrl: () => 'https://www.linkedin.com/feed/'
    },
    {
      name: 'Email',
      color: '#EA4335',
      paths: ['M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'],
      getUrl: () => 'mailto:'
    }
  ];

  platformDefs.forEach(platform => {
    const btn = document.createElement('button');
    btn.style.cssText = 'background: transparent; border: none; cursor: pointer; padding: 16px 20px; border-radius: 16px; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 10px;';
    btn.onmouseover = () => { btn.style.background = '#f5f5f5'; btn.style.transform = 'translateY(-2px)'; };
    btn.onmouseout = () => { btn.style.background = 'transparent'; btn.style.transform = 'none'; };

    // createElementNS: the only reliable SVG approach under strict extension CSP
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '52');
    svg.setAttribute('height', '52');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.style.cssText = 'display: block; pointer-events: none;';
    platform.paths.forEach(d => {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('fill', platform.color);
      path.setAttribute('d', d);
      svg.appendChild(path);
    });
    btn.appendChild(svg);

    const label = document.createElement('span');
    label.textContent = platform.name;
    label.style.cssText = 'font-size: 12px; font-weight: 600; color: #555; font-family: system-ui, sans-serif; pointer-events: none;';
    btn.appendChild(label);

    btn.onclick = async () => {
      btn.style.opacity = '0.6';
      const shareText = `${getTranslation('checkThisMeme', lang)} ${text}`;
      statusText.textContent = getTranslation('textCopied', lang);
      await navigator.clipboard.writeText(shareText);
      await new Promise(resolve => setTimeout(resolve, 800));

      statusText.textContent = getTranslation('imageDownloaded', lang);
      await downloadMeme(imageUrl);
      await new Promise(resolve => setTimeout(resolve, 1500));

      window.open(platform.getUrl(), '_blank');
      trackShare(platform.name);
      modal.remove();
    };
    buttonsContainer.appendChild(btn);
  });

  content.appendChild(closeBtn);
  content.appendChild(title);
  content.appendChild(buttonsContainer);
  content.appendChild(statusText);
  modal.appendChild(content);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  return modal;
}

export function createShareButton(imageUrl: string, text: string, lang: string = 'English'): HTMLDivElement {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const container = document.createElement('div');
  const btn = document.createElement('button');
  btn.className = 'chuckle-share-btn';

  // createElementNS: reliable SVG in any context
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.style.cssText = 'display: block; pointer-events: none;';
  [
    { tag: 'circle', attrs: { cx: '18', cy: '5', r: '3', fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: '6', cy: '12', r: '3', fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: '18', cy: '19', r: '3', fill: 'currentColor' } },
    { tag: 'path', attrs: { d: 'M15.5 6.5L8.5 10.5M8.5 13.5L15.5 17.5', stroke: 'currentColor', 'stroke-width': '2', fill: 'none' } },
  ].forEach(({ tag, attrs }) => {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    svg.appendChild(el);
  });
  btn.appendChild(svg);
  btn.setAttribute('aria-label', getTranslation('shareMeme', lang));

  btn.onclick = (e) => {
    e.stopPropagation();
    const modal = createShareModal(imageUrl, text, lang);
    document.body.appendChild(modal);
  };

  container.appendChild(btn);
  return container;
}

