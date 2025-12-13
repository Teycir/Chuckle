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

document.getElementById('shareBtn')?.addEventListener('click', () => {
  navigator.clipboard.writeText(memeData.text);
  alert('Text copied! Download the image and share on social media.');
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
