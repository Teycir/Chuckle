import { createOverlay } from '../src/overlay';
import type { MemeData } from '../src/types';

describe('Overlay - Bridge Tests', () => {
  beforeEach(() => {
    globalThis.chrome = {
      runtime: {
        getURL: jest.fn((path) => `chrome-extension://id/${path}`),
        sendMessage: jest.fn()
      }
    } as any;
  });

  test('should call sendMessage with data URL when no id provided', async () => {
    const memeData: MemeData = {
      text: 'test',
      imageUrl: 'url',
      template: 'drake',
      timestamp: 12345,
      language: 'English'
    };

    await createOverlay(memeData);

    const expectedData = encodeURIComponent(JSON.stringify(memeData));
    const expectedUrl = `chrome-extension://id/viewer.html?data=${expectedData}`;

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: 'openTab',
      url: expectedUrl
    });
  });

  test('should call sendMessage with id URL when id provided', async () => {
    const memeData: MemeData = {
      text: 'test',
      imageUrl: 'url',
      template: 'drake',
      timestamp: 12345,
      language: 'English'
    };

    await createOverlay(memeData, 'meme_123');

    const expectedUrl = `chrome-extension://id/viewer.html?id=meme_123`;

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: 'openTab',
      url: expectedUrl
    });
  });
});
