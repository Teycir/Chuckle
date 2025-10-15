import { undo } from './undo';

let shortcutsEnabled = false;
let shortcutHandlers: Map<string, () => void | Promise<void>> = new Map();

export function enableShortcuts(): void {
  if (shortcutsEnabled) return;
  shortcutsEnabled = true;
  document.addEventListener('keydown', handleShortcut);
}

export function disableShortcuts(): void {
  shortcutsEnabled = false;
  shortcutHandlers.clear();
  document.removeEventListener('keydown', handleShortcut);
}

export function registerShortcut(key: string, handler: () => void | Promise<void>): void {
  shortcutHandlers.set(key.toLowerCase(), handler);
}

async function handleShortcut(e: KeyboardEvent): Promise<void> {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return;
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    const success = await undo();
    if (success) {
      showToast('Action undone');
    }
  } else if (e.key === 'h' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    const { createHistoryPanel } = await import('./history');
    await createHistoryPanel();
  } else {
    const handler = shortcutHandlers.get(e.key.toLowerCase());
    if (handler && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      await handler();
    }
  }
}

function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 2000);
}
