describe('Background Service Worker', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('creates context menu on install', () => {
    const mockCreate = jest.fn();
    const mockAddListener = jest.fn((callback) => callback());
    
    global.chrome = {
      runtime: { 
        onInstalled: { addListener: mockAddListener },
        onMessage: { addListener: jest.fn() },
        getURL: jest.fn((path) => `chrome-extension://test/${path}`)
      },
      contextMenus: { 
        create: mockCreate,
        onClicked: { addListener: jest.fn() }
      },
      tabs: { 
        sendMessage: jest.fn(), 
        query: jest.fn(),
        create: jest.fn()
      },
      commands: { onCommand: { addListener: jest.fn() } },
      action: { onClicked: { addListener: jest.fn() } },
      alarms: {
        create: jest.fn(),
        onAlarm: { addListener: jest.fn() }
      }
    } as any;

    require('../src/background');
    
    expect(mockCreate).toHaveBeenCalledWith({
      id: "remixAsMeme",
      title: "Remix as a Meme",
      contexts: ["selection"]
    });
  });
});
