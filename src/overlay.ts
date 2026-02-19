import type { MemeData } from './types';

export async function createOverlay(memeData: MemeData, memeId?: string): Promise<void> {
  let url;
  if (memeId) {
    url = chrome.runtime.getURL(`viewer.html?id=${memeId}`);
  } else {
    const data = encodeURIComponent(JSON.stringify(memeData));
    url = chrome.runtime.getURL(`viewer.html?data=${data}`);
  }
  chrome.runtime.sendMessage({ action: 'openTab', url });
}

export function closeOverlay(): void {
  // Legacy function kept for backward compatibility
}

export function isOverlayOpen(): boolean {
  return false;
}
