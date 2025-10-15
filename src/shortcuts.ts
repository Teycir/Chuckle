import { undo } from './undo';

let shortcutsEnabled = false;

export function enableShortcuts(): void {
  if (shortcutsEnabled) return;
  shortcutsEnabled = true;
  document.addEventListener('keydown', handleShortcut);
}

export function disableShortcuts(): void {
  shortcutsEnabled = false;
  document.removeEventListener('keydown', handleShortcut);
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
  }
}

function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 2000);
}
