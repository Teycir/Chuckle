let loadingOverlay: HTMLElement | null = null;

export function showLoading(message: string = 'Generating meme...'): void {
  if (loadingOverlay) return;

  loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  
  const text = document.createElement('div');
  text.className = 'loading-text';
  text.textContent = message;
  
  loadingOverlay.appendChild(spinner);
  loadingOverlay.appendChild(text);
  document.body.appendChild(loadingOverlay);
}

export function hideLoading(): void {
  if (loadingOverlay) {
    loadingOverlay.remove();
    loadingOverlay = null;
  }
}
