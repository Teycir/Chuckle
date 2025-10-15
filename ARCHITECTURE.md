# Chuckle Architecture

## Overview

Chuckle is a Chrome extension built with TypeScript that transforms highlighted text into memes using Google's Gemini 2.5 Flash API.

## Tech Stack

- **TypeScript**: Type-safe development
- **Chrome Extension API**: Browser integration
- **Gemini 2.5 Flash**: AI-powered meme template selection
- **Nano Banana API**: Image generation and text overlay
- **Jest**: Unit testing framework

## Project Structure

```
Chuckle/
├── src/
│   ├── background.ts   # Service worker for context menu
│   ├── content.ts      # Content script for meme generation
│   ├── popup.ts        # Settings UI logic
│   └── types.ts        # TypeScript type definitions
├── tests/
│   ├── background.test.ts
│   ├── content.test.ts
│   └── popup.test.ts
├── manifest.json       # Extension configuration
├── popup.html          # Settings UI
├── build.js            # Build script
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies
```

## Architecture Components

### 1. Background Service Worker (`background.ts`)

**Purpose**: Manages the context menu and message passing.

**Key Functions**:
- Creates "Remix as a Meme" context menu item on installation
- Listens for context menu clicks
- Sends messages to content script with selected text

**Flow**:
```
User right-clicks → Context menu appears → User clicks "Remix as a Meme"
→ Background worker sends message to content script
```

### 2. Content Script (`content.ts`)

**Purpose**: Handles meme generation and API communication.

**Key Functions**:
- `generateMeme(text: string)`: Orchestrates the meme generation process
- `analyzeMemeContext(text: string)`: Calls Gemini API to select meme template
- `generateMemeImage(template: string)`: Generates meme image with text overlay

**Flow**:
```
Receive text → Analyze with Gemini → Get template suggestion
→ Generate meme image → Store in chrome.storage → Open popup
```

**API Integration**:
```typescript
// Gemini API call
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Analyze this text and suggest a meme template: "${text}"`
        }]
      }]
    })
  }
);
```

### 3. Popup UI (`popup.ts` + `popup.html`)

**Purpose**: Settings management and configuration.

**Features**:
- API key storage (encrypted in chrome.storage.local)
- Language selection (English, Spanish, French, German)
- Dark mode toggle
- Input validation with visual feedback

**Storage Schema**:
```typescript
interface StorageData {
  geminiApiKey: string;
  selectedLanguage: 'English' | 'Spanish' | 'French' | 'German';
  darkMode: boolean;
}
```

## Data Flow

```
1. User highlights text on webpage
2. User right-clicks → "Remix as a Meme"
3. Background worker receives click event
4. Background worker sends message to content script
5. Content script retrieves API key from storage
6. Content script calls Gemini API with text
7. Gemini returns meme template suggestion
8. Content script generates meme image
9. Meme stored in chrome.storage.local
10. Popup opens displaying the meme
```

## Security

### API Key Storage
- Keys stored in `chrome.storage.local` (encrypted by Chrome)
- Never exposed in code or logs
- Retrieved only when needed for API calls

### Content Security Policy
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### Permissions
```json
{
  "permissions": ["contextMenus", "activeTab", "storage"],
  "host_permissions": ["https://generativelanguage.googleapis.com/*"]
}
```

## Build Process

### Development
```bash
npm install          # Install dependencies
npm run watch        # Watch mode for development
```

### Production
```bash
npm run build        # Compile TypeScript to JavaScript
```

**Build Script** (`build.js`):
1. TypeScript compiles `src/*.ts` → `dist/*.js`
2. Build script copies compiled files to root directory
3. Extension loads from root directory

### Testing
```bash
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

## API Integration

### Gemini 2.5 Flash

**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`

**Request Format**:
```json
{
  "contents": [{
    "parts": [{
      "text": "Analyze this text and suggest a meme template: [USER_TEXT]"
    }]
  }]
}
```

**Response Format**:
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "drake"
      }]
    }
  }]
}
```

### Nano Banana (Placeholder)

Currently using memegen.link API for image generation. Future integration with Nano Banana for advanced image editing.

## UI Design System

### Color Palette
- Primary: `#667eea` → `#764ba2` (gradient)
- Success: `#34a853`
- Error: `#c5221f`
- Background: Animated gradient with shader effects

### Typography
- Font: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Sizes: 10px (labels), 12px (inputs/buttons), 16px (headings)

### Animations
- Background shaders: 8s infinite ease-in-out
- Button hover: translateY(-1px) + shadow
- Input focus: border-color + box-shadow

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Content script only loads when needed
2. **Caching**: API responses could be cached (future enhancement)
3. **Debouncing**: Input validation debounced to reduce re-renders
4. **Minimal Bundle**: Only essential dependencies included

### Metrics
- Extension size: ~50KB (compiled)
- Popup load time: <100ms
- Meme generation: 2-3 seconds (API dependent)

## Error Handling

### API Errors
```typescript
try {
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  // Process response
} catch (error) {
  console.error('Meme generation failed:', error);
  // Show user-friendly error message
}
```

### Storage Errors
```typescript
chrome.storage.local.get(['geminiApiKey'], (result) => {
  if (chrome.runtime.lastError) {
    console.error('Storage error:', chrome.runtime.lastError);
    return;
  }
  // Use API key
});
```

## Future Enhancements

### Planned Features
1. **Meme History**: Save generated memes locally
2. **Custom Templates**: Allow users to upload their own templates
3. **Batch Generation**: Generate multiple memes from a list
4. **Advanced Editing**: Text positioning, font selection, color customization
5. **Social Media Integration**: Direct posting to platforms
6. **Analytics**: Track meme performance (optional, privacy-first)

### Technical Improvements
1. **Response Caching**: Cache Gemini responses for repeated text
2. **Offline Mode**: Generate memes without internet (pre-loaded templates)
3. **WebAssembly**: Faster image processing
4. **Service Worker Optimization**: Reduce memory footprint

## Testing Strategy

### Unit Tests
- Background worker: Context menu creation and message passing
- Content script: API calls and meme generation logic
- Popup: Settings management and validation

### Integration Tests
- End-to-end meme generation flow
- Storage persistence across sessions
- Multi-language support

### Test Coverage
- Target: >80% code coverage
- Critical paths: 100% coverage

## Deployment

### Chrome Web Store (Future)
1. Create developer account
2. Prepare store listing (screenshots, description)
3. Submit extension for review
4. Publish after approval

### Manual Installation (Current)
1. Clone repository
2. Run `npm install && npm run build`
3. Load unpacked extension in Chrome
4. Configure API key in popup

## Contributing

### Development Setup
```bash
git clone https://github.com/Teycir/Chuckle.git
cd Chuckle
npm install
npm run build
```

### Code Style
- TypeScript strict mode enabled
- ESLint configuration (future)
- Prettier for formatting (future)

### Pull Request Process
1. Fork repository
2. Create feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit PR with description

## License

MIT License - See LICENSE file for details

## Credits

- **Author**: [Teycir Ben Soltane](https://teycirbensoltane.tn/)
- **Inspired by**: Gist Chrome Extension
- **AI Provider**: Google Gemini 2.5 Flash
- **Design**: Custom gradient animations and glassmorphism

---

*Last updated: 2024*
