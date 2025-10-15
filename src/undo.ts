interface UndoAction {
  type: 'favorite' | 'tag';
  memeKey: string;
  oldValue: boolean | string[];
  newValue: boolean | string[];
}

import { CONFIG } from './config';

const undoStack: UndoAction[] = [];

export function pushUndo(action: UndoAction): void {
  undoStack.push(action);
  if (undoStack.length > CONFIG.MAX_UNDO_STACK) {
    undoStack.shift();
  }
}

export async function undo(): Promise<boolean> {
  const action = undoStack.pop();
  if (!action) return false;

  const { updateMeme } = await import('./storage');
  
  if (action.type === 'favorite') {
    await updateMeme(action.memeKey, { isFavorite: action.oldValue as boolean });
  } else if (action.type === 'tag') {
    await updateMeme(action.memeKey, { tags: action.oldValue as string[] });
  }
  
  return true;
}

export function clearUndoStack(): void {
  undoStack.length = 0;
}
