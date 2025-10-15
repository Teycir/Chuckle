describe('Background Service Worker', () => {
  test('creates context menu on install', () => {
    const mockCreate = jest.fn();
    const mockAddListener = jest.fn((callback) => callback());
    
    global.chrome = {
      runtime: { onInstalled: { addListener: mockAddListener } },
      contextMenus: { 
        create: mockCreate,
        onClicked: { addListener: jest.fn() }
      },
      tabs: { sendMessage: jest.fn() }
    } as any;

    require('../src/background');
    
    expect(mockCreate).toHaveBeenCalledWith({
      id: "remixAsMeme",
      title: "Remix as a Meme",
      contexts: ["selection"]
    });
  });
});
