import { MEME_TEMPLATES } from './constants';
import { selectMemeTemplate, generateMemeImage } from './memeService';
import { getMeme } from './storage';
import type { MemeData } from './types';

const params = new URLSearchParams(globalThis.location.search);
const id = params.get('id');
const dataStr = params.get('data');

let memeData: MemeData | null = null; // Will be loaded async
let isManualEdit = false;

// UI Elements
const img = document.getElementById('memeImage') as HTMLImageElement;
const textEditor = document.getElementById('textEditor') as HTMLDivElement;
const templatesDiv = document.getElementById('templates') as HTMLDivElement;
const loading = document.getElementById('loading') as HTMLDivElement;


async function initViewer() {
  if (id) {
    memeData = await getMeme(id);
  } else if (dataStr) {
    try {
      memeData = JSON.parse(decodeURIComponent(dataStr));
    } catch (e) {
      console.error('Failed to parse meme data from URL', e);
    }
  }

  if (memeData) {
    initializeUI();
  } else {
    document.body.replaceChildren();
    const div = document.createElement('div');
    div.style.cssText = 'color: white; text-align: center; margin-top: 50px;';
    div.textContent = 'Meme not found or expired.';
    document.body.appendChild(div);
  }
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

function initializeUI() {
  if (!memeData) return;
  let currentTemplate = memeData.template;

  img.src = memeData.imageUrl;
  textEditor.textContent = memeData.text;


  chrome.storage.local.get(['darkMode'], (data) => {
    if (data.darkMode) document.body.classList.add('dark');
  });

  MEME_TEMPLATES.forEach(template => {
    const btn = document.createElement('button');
    btn.className = 'template-btn';
    btn.textContent = template.name;
    if (template.id === currentTemplate) btn.classList.add('active');
    btn.onclick = () => regenerate(template.id);
    templatesDiv.appendChild(btn);
  });

  textEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      isManualEdit = true;
      regenerate();
    }
  });

  async function regenerate(templateId?: string) {
    if (!memeData) return;
    loading.classList.add('show');
    try {
      const text = isManualEdit ? textEditor.textContent || '' : memeData.originalInput || memeData.text;
      const template = templateId || currentTemplate || await selectMemeTemplate(text);
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
    try {
      const blob = await getImageBlob(img.src);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meme-${Date.now()}.png`;
      // Must be in DOM for Chrome to honour the download attribute
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  });

  document.getElementById('shareBtn')?.addEventListener('click', async () => {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 999999; display: flex; align-items: center; justify-content: center;';

    const content = document.createElement('div');
    content.style.cssText = 'background: white; border-radius: 20px; padding: 40px 48px 36px; max-width: 480px; width: 90%; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3);';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; background: transparent; border: none; width: 40px; height: 40px; font-size: 36px; cursor: pointer; color: #999;';
    closeBtn.onclick = () => modal.remove();

    const title = document.createElement('div');
    title.textContent = 'Share Meme';
    title.style.cssText = 'font-size: 22px; font-weight: 700; color: #333; margin-bottom: 28px; text-align: center;';

    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = 'display: flex; justify-content: center; gap: 24px;';

    const statusText = document.createElement('div');
    statusText.style.cssText = 'font-size: 14px; font-weight: 600; color: #667eea; text-align: center; margin-top: 20px; min-height: 20px;';

    // SVG icon data: createElementNS is the only reliable approach inside
    // Chrome extension pages with strict CSP (no DOMParser, no img[data:svg]).
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const platforms = [
      {
        name: 'Twitter',
        color: '#000000',
        paths: ['M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'],
        url: 'https://twitter.com/compose/tweet'
      },
      {
        name: 'LinkedIn',
        color: '#0A66C2',
        paths: ['M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'],
        url: 'https://www.linkedin.com/feed/'
      },
      {
        name: 'Email',
        color: '#EA4335',
        paths: ['M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'],
        url: 'mailto:'
      }
    ];

    platforms.forEach(platform => {
      const btn = document.createElement('button');
      btn.style.cssText = 'background: transparent; border: none; cursor: pointer; padding: 16px 20px; border-radius: 16px; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 10px;';
      btn.onmouseover = () => { btn.style.background = '#f5f5f5'; btn.style.transform = 'translateY(-2px)'; };
      btn.onmouseout = () => { btn.style.background = 'transparent'; btn.style.transform = 'none'; };

      // Build SVG via createElementNS — works under strict extension CSP
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
        if (!memeData) return;
        btn.style.opacity = '0.6';
        statusText.textContent = '✓ Text copied!';
        await navigator.clipboard.writeText(`Check this meme: ${memeData.text}`);
        await new Promise(resolve => setTimeout(resolve, 800));

        statusText.textContent = '✓ Image downloaded!';
        const blob = await getImageBlob(img.src);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meme-${Date.now()}.png`;
        // Must be in DOM for Chrome to honour the download attribute
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        await new Promise(resolve => setTimeout(resolve, 1500));

        window.open(platform.url, '_blank');
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

    document.body.appendChild(modal);
  });

  document.getElementById('regenerateBtn')?.addEventListener('click', async () => {
    if (!memeData) return;
    loading.classList.add('show');
    try {
      const currentText = textEditor.textContent?.trim() || '';
      const hasTextChanged = currentText !== memeData.text;

      if (hasTextChanged) {
        const { watermarkedUrl, formattedText } = await generateMemeImage(currentTemplate || 'drake', currentText, true, true);
        img.src = watermarkedUrl;
        textEditor.textContent = formattedText;
        memeData.imageUrl = watermarkedUrl;
        memeData.text = formattedText;
      } else {
        const text = memeData.originalInput || memeData.text;
        const template = await selectMemeTemplate(text);
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
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.close();
});

// Start initialization
(async () => {
  await initViewer();
})();

