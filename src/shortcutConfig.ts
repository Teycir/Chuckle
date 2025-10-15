export interface ShortcutConfig {
  regenerate: string;
  favorite: string;
  copy: string;
  tag: string;
  history: string;
}

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  regenerate: 'r',
  favorite: 'f',
  copy: 'c',
  tag: 't',
  history: 'h'
};

const RESERVED_KEYS = ['escape', 'enter', 'tab', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

export async function getShortcuts(): Promise<ShortcutConfig> {
  const { shortcuts } = await chrome.storage.local.get('shortcuts');
  return shortcuts || DEFAULT_SHORTCUTS;
}

export async function saveShortcuts(shortcuts: ShortcutConfig): Promise<void> {
  await chrome.storage.local.set({ shortcuts });
}

export function validateShortcut(key: string): boolean {
  return key.length === 1 && !RESERVED_KEYS.includes(key.toLowerCase());
}

export function hasConflict(shortcuts: ShortcutConfig, key: string, exclude?: keyof ShortcutConfig): boolean {
  return Object.entries(shortcuts).some(([action, shortcut]) => 
    action !== exclude && shortcut.toLowerCase() === key.toLowerCase()
  );
}
