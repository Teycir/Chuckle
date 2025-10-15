import { undo } from './undo';
import { getShortcuts } from './shortcutConfig';

let shortcutsEnabled = false;
let shortcutHandlers: Map<string, () => void | Promise<void>> = new Map();
let actionMap: Map<string, string> = new Map();

export function enableShortcuts(): void {
  if (shortcutsEnabled) return;
  shortcutsEnabled = true;
  document.addEventListener('keydown', handleShortcut);
}

export function disableShortcuts(): void {
  shortcutsEnabled = false;
  shortcutHandlers.clear();
  actionMap.clear();
  document.removeEventListener('keydown', handleShortcut);
}

export function registerShortcut(action: string, handler: () => void | Promise<void>): void {
  actionMap.set(action, action);
  shortcutHandlers.set(action, handler);
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
    return;
  }

  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const shortcuts = await getShortcuts();
  const key = e.key.toLowerCase();

  if (key === shortcuts.history) {
    e.preventDefault();
    const { createHistoryPanel } = await import('./history');
    await createHistoryPanel();
    return;
  }

  for (const [action, handler] of shortcutHandlers) {
    const actionKey = shortcuts[action as keyof typeof shortcuts];
    if (actionKey && key === actionKey.toLowerCase()) {
      e.preventDefault();
      await handler();
      break;
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
