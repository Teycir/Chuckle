// Extension conflict detection and resolution
export class ConflictDetector {
  private static readonly KNOWN_CONFLICTS = [
    'chrome-extension://invalid/',
    'Could not establish connection',
    'Receiving end does not exist'
  ];

  static detectConflicts(): boolean {
    // Check for common conflict indicators in console
    const hasConflicts = this.KNOWN_CONFLICTS.some(pattern => {
      return document.documentElement.innerHTML.includes(pattern);
    });

    if (hasConflicts) {
      console.warn('[Chuckle] Extension conflicts detected');
      this.showConflictWarning();
    }

    return hasConflicts;
  }

  private static showConflictWarning(): void {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'chuckle-conflict-warning';
    const content = document.createElement('div');
    content.style.cssText = 'position:fixed;top:10px;right:10px;background:#ff9800;color:#fff;padding:12px 16px;border-radius:6px;z-index:100002;box-shadow:0 2px 8px rgba(0,0,0,0.2);font-size:13px;max-width:300px;';

    const strong = document.createElement('strong');
    strong.textContent = '⚠️ Chuckle Extension Conflict';

    const br = document.createElement('br');

    const textNode = document.createTextNode(' Other extensions may be interfering. Try disabling other extensions temporarily. ');

    const button = document.createElement('button');
    button.style.cssText = 'float:right;background:none;border:none;color:#fff;cursor:pointer;font-size:16px;margin-left:8px;';
    button.textContent = '×';
    button.onclick = () => warningDiv.remove();

    content.appendChild(strong);
    content.appendChild(br);
    content.appendChild(textNode);
    content.appendChild(button);
    warningDiv.appendChild(content);
    document.body.appendChild(warningDiv);
    setTimeout(() => warningDiv.remove(), 10000);
  }

  static async checkExtensionHealth(): Promise<boolean> {
    try {
      // Test basic extension functionality
      await chrome.storage.local.get(['test']);
      return true;
    } catch (error) {
      console.error('[Chuckle] Extension health check failed:', error);
      return false;
    }
  }
}