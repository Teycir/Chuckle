import { MEME_TEMPLATES } from '../src/constants';
import * as memeService from '../src/memeService';

// Mock the viewer page DOM
const setupDOM = () => {
    document.body.innerHTML = `
    <img id="memeImage" />
    <div id="textEditor" contenteditable="true"></div>
    <div id="templates"></div>
    <div id="loading"></div>
    <button id="downloadBtn"></button>
    <button id="shareBtn"></button>
    <button id="regenerateBtn"></button>
    <button id="closeBtn"></button>
  `;
};

jest.mock('../src/memeService');

describe('Viewer UI', () => {
    let mockMemeData: any;

    beforeEach(() => {
        setupDOM();
        mockMemeData = {
            text: 'Test meme',
            imageUrl: 'https://example.com/meme.png',
            template: 'drake',
            timestamp: Date.now(),
            language: 'English'
        };

        // Mock location.search
        delete (globalThis as any).location;
        (globalThis as any).location = {
            search: '?data=' + encodeURIComponent(JSON.stringify(mockMemeData))
        };

        globalThis.chrome = {
            storage: {
                local: {
                    get: jest.fn((keys, cb) => cb({ darkMode: false })),
                    set: jest.fn()
                }
            },
            runtime: {
                sendMessage: jest.fn()
            }
        } as any;
    });

    it('should initialize with meme data from URL', async () => {
        // We need to re-require or use a dynamic import because viewer.ts runs on load
        jest.isolateModules(() => {
            require('../src/viewer');
        });

        // Wait for async init
        await new Promise(resolve => setTimeout(resolve, 0));

        const img = document.getElementById('memeImage') as HTMLImageElement;
        const textEditor = document.getElementById('textEditor') as HTMLDivElement;

        expect(img.src).toBe(mockMemeData.imageUrl);
        expect(textEditor.textContent).toBe(mockMemeData.text);
    });

    it('should render template buttons', async () => {
        jest.isolateModules(() => {
            require('../src/viewer');
        });

        await new Promise(resolve => setTimeout(resolve, 0));

        const buttons = document.querySelectorAll('.template-btn');
        expect(buttons.length).toBe(MEME_TEMPLATES.length);
    });

    it('should call generateMemeImage when a template is clicked', async () => {
        (memeService.generateMemeImage as jest.Mock).mockResolvedValue({
            watermarkedUrl: 'https://example.com/new.png',
            formattedText: 'New text'
        });

        jest.isolateModules(() => {
            require('../src/viewer');
        });

        await new Promise(resolve => setTimeout(resolve, 0));

        const drakeBtn = Array.from(document.querySelectorAll('.template-btn'))
            .find(btn => btn.textContent === 'Drake') as HTMLButtonElement;

        if (drakeBtn) {
            drakeBtn.click();
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(memeService.generateMemeImage).toHaveBeenCalled();
        }
    });
});
