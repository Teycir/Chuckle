import { addWatermark } from '../src/watermark';

describe('Watermark', () => {
  beforeEach(() => {
    global.Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';
      width = 500;
      height = 500;
      crossOrigin = '';
      
      constructor() {
        setTimeout(() => this.onload?.(), 0);
      }
    } as any;

    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
      drawImage: jest.fn(),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      measureText: jest.fn().mockReturnValue({ width: 100 }),
      font: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0
    });

    HTMLCanvasElement.prototype.toDataURL = jest.fn().mockReturnValue('data:image/png;base64,test');
  });

  it('adds watermark to image', async () => {
    const result = await addWatermark('https://example.com/meme.jpg');
    expect(result).toBe('data:image/png;base64,test');
  });

  it('handles image load errors', async () => {
    global.Image = class {
      onerror: (() => void) | null = null;
      src = '';
      crossOrigin = '';
      
      constructor() {
        setTimeout(() => this.onerror?.(), 0);
      }
    } as any;

    await expect(addWatermark('invalid')).rejects.toThrow('Failed to load image');
  });

  it('handles canvas not supported', async () => {
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(null);

    await expect(addWatermark('https://example.com/meme.jpg')).rejects.toThrow('Canvas not supported');
  });
});
