// Status indicator for API credits and offline mode
export class StatusIndicator {
  private static indicator: HTMLElement | null = null;

  static async show(): Promise<void> {
    const { offlineMode, geminiApiKey, openrouterApiKey, aiProvider } = await chrome.storage.local.get([
      'offlineMode', 'geminiApiKey', 'openrouterApiKey', 'aiProvider'
    ]);

    const provider = aiProvider || 'google';
    const hasApiKey = provider === 'google' ? !!geminiApiKey : !!openrouterApiKey;

    if (offlineMode || !hasApiKey) {
      this.showOfflineIndicator();
    } else {
      this.hideIndicator();
    }
  }

  private static showOfflineIndicator(): void {
    if (this.indicator) return;

    this.indicator = document.createElement('div');
    this.indicator.className = 'chuckle-status-indicator';
    this.indicator.innerHTML = `
      <div style="position:fixed;bottom:20px;right:20px;background:#2196F3;color:#fff;padding:8px 12px;border-radius:20px;z-index:100003;box-shadow:0 2px 8px rgba(0,0,0,0.2);font-size:12px;cursor:pointer;" onclick="this.parentElement.remove()">
        🔄 Chuckle: Offline Mode
      </div>
    `;
    document.body.appendChild(this.indicator);
    
    setTimeout(() => this.hideIndicator(), 5000);
  }

  private static hideIndicator(): void {
    if (this.indicator) {
      this.indicator.remove();
      this.indicator = null;
    }
  }

  static async checkApiStatus(): Promise<{ hasCredits: boolean; provider: string }> {
    const { aiProvider, geminiApiKey, openrouterApiKey } = await chrome.storage.local.get([
      'aiProvider', 'geminiApiKey', 'openrouterApiKey'
    ]);

    const provider = aiProvider || 'google';
    const apiKey = provider === 'google' ? geminiApiKey : openrouterApiKey;

    if (!apiKey) {
      return { hasCredits: false, provider };
    }

    try {
      // Quick test call to check API status
      const testUrl = provider === 'google' 
        ? `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        : 'https://openrouter.ai/api/v1/models';

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: provider === 'openrouter' ? { 'Authorization': `Bearer ${apiKey}` } : {}
      });

      return { hasCredits: response.ok, provider };
    } catch (error) {
      return { hasCredits: false, provider };
    }
  }
}