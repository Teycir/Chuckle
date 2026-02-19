export class StatusIndicator {
  private static indicator: HTMLElement | null = null;

  static async show(): Promise<void> {
    if (navigator.onLine) {
      this.hideIndicator();
    } else {
      this.showOfflineIndicator();
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
    // API checks are no longer relevant in manual mode
    return { hasCredits: true, provider: 'manual' };
  }
}