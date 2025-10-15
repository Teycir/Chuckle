describe('Keyboard Shortcut', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('background registers command listener', () => {
    const mockAddListener = jest.fn();
    
    global.chrome = {
      runtime: { onInstalled: { addListener: jest.fn() } },
      contextMenus: { 
        create: jest.fn(),
        onClicked: { addListener: jest.fn() }
      },
      tabs: { sendMessage: jest.fn(), query: jest.fn() },
      commands: { onCommand: { addListener: mockAddListener } }
    } as any;

    require('../src/background');
    
    expect(mockAddListener).toHaveBeenCalled();
  });

  test('content handles generateMemeFromSelection', () => {
    const mockGetSelection = jest.fn().mockReturnValue({
      toString: () => 'Selected text'
    });
    global.getSelection = mockGetSelection;
    
    const mockListener = jest.fn();
    global.chrome = {
      runtime: { onMessage: { addListener: mockListener } },
      storage: { local: { set: jest.fn() } },
      action: { openPopup: jest.fn() }
    } as any;

    require('../src/content');
    
    expect(mockListener).toHaveBeenCalled();
  });
});
