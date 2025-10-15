describe('Popup UI', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <img id="memeImage" />
      <p id="memeText"></p>
      <button id="copyBtn"></button>
      <button id="shareBtn"></button>
    `;
    
    global.chrome = {
      storage: { local: { get: jest.fn() } }
    } as any;
  });

  test('displays meme from storage', () => {
    const mockMeme = { imageUrl: 'test.png', text: 'test' };
    (chrome.storage.local.get as jest.Mock).mockImplementation((keys, cb) => {
      cb({ currentMeme: mockMeme });
    });

    require('../src/popup');
    
    expect(document.getElementById('memeImage')).toBeTruthy();
  });
});
