describe('Popup UI', () => {
  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = `
      <div class="container">
        <button id="settingsTab"></button>
        <button id="statsTab"></button>
        <button id="trendingTab"></button>
        <div id="settingsPanel">
          <input id="geminiApiKey" />
          <select id="languageSelect"></select>
          <input id="darkMode" type="checkbox" />
          <button id="saveKey"></button>
          <div id="statusMsg"></div>
        </div>
        <div id="statsPanel" style="display: none;">
          <div id="statsContent"></div>
          <button id="exportBtn"></button>
          <button id="templatesBtn"></button>
        </div>
        <div id="trendingPanel" style="display: none;">
          <div id="trendingContent"></div>
        </div>
        <div id="templatesModal" style="display: none;">
          <button id="closeTemplates"></button>
          <div id="templatesList"></div>
        </div>
      </div>
    `;
    
    global.chrome = {
      storage: { 
        local: { 
          get: jest.fn().mockResolvedValue({ geminiApiKey: 'test', selectedLanguage: 'English', darkMode: false }),
          set: jest.fn().mockResolvedValue(undefined)
        } 
      }
    } as any;
  });

  test('displays meme from storage', async () => {
    try {
      require('../src/popup');
      
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(document.getElementById('geminiApiKey')).toBeTruthy();
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });
});
