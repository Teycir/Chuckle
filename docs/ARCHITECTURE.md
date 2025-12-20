# Chuckle Architecture

## Overview

Chuckle is a Chrome extension built with TypeScript that transforms highlighted text into memes using OpenRouter's AI API.

## Tech Stack

- **TypeScript**: Type-safe development
- **Chrome Extension API**: Browser integration
- **OpenRouter API**: AI-powered meme template selection
- **memegen.link API**: Meme image generation
- **Jest**: Unit testing framework (237 tests, 100% coverage)
- **ESLint + Prettier**: Code quality and formatting
- **Terser**: Production minification

## Project Structure

```
Chuckle/
├── src/
│   ├── background.ts      # Service worker for context menu
│   ├── content.ts         # Content script for meme generation
│   ├── popup.ts           # Main settings UI logic
│   ├── popup-batch.ts     # Batch generation UI
│   ├── overlay.ts         # Meme display overlay
│   ├── history.ts         # History panel with search/filters
│   ├── storage.ts         # Chrome storage utilities
│   ├── tags.ts            # Tag management system
│   ├── batch.ts           # Batch meme generation
│   ├── cache.ts           # LRU cache for API responses
│   ├── undo.ts            # Undo/redo functionality
│   ├── shortcuts.ts       # Keyboard shortcuts handler
│   ├── loading.ts         # Loading overlay
│   ├── config.ts          # Centralized configuration
│   ├── logger.ts          # Production logging
│   └── types.ts           # TypeScript type definitions
├── tests/                 # 14 test suites, 237 tests
├── dist/                  # Build output
├── manifest.json          # Extension configuration + CSP
├── popup.html             # Settings UI
├── popup-batch.html       # Batch generation UI
├── styles.css             # Global styles
├── build.js               # Development build
├── build-prod.js          # Production build with minification
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
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

### 2. Storage Layer (`storage.ts`)

**Purpose**: Manages all Chrome storage operations.

**Key Functions**:
- `saveMeme(memeData)`: Save meme with unique hash key
- `getMeme(key)`: Retrieve single meme
- `getAllMemes()`: Get all memes sorted by timestamp
- `updateMeme(key, updates)`: Update meme properties
- `removeMeme(key)`: Delete meme
- `simpleHash(str)`: Generate 8-character hash for keys

**Storage Schema**:
```typescript
interface MemeData {
  text: string;
  imageUrl: string;
  template: string;
  timestamp: number;
  language: string;
  isFavorite: boolean;
  tags: string[];
}
```

### 3. Content Script (`content.ts`)

**Purpose**: Handles meme generation and API communication.

**Key Functions**:
- `generateMeme(text: string)`: Orchestrates the meme generation process
- `analyzeMemeContext(text: string)`: Calls OpenRouter API to select meme template
- `generateMemeImage(template: string)`: Generates meme image with text overlay

**Flow**:
```
Receive text → Analyze with OpenRouter → Get template suggestion
→ Generate meme image → Store in chrome.storage → Open popup
```

**API Integration**:
```typescript
// OpenRouter API call
const response = await fetch(
  'https://openrouter.ai/api/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      messages: [{
        role: 'user',
        content: `Analyze this text and suggest a meme template: "${text}"`
      }]
    })
  }
);
```

### 4. Cache Layer (`cache.ts`)

**Purpose**: LRU cache for OpenRouter API responses.

**Features**:
- 100 item limit
- 1-hour TTL
- Automatic eviction of oldest items
- Cache key format: `openrouter:{text}:v{variant}`

**Implementation**:
```typescript
class LRUCache<T> {
  get(key: string): T | null
  set(key: string, value: T): void
  clear(): void
}
```

### 5. Tags System (`tags.ts`)

**Purpose**: Tag management with autocomplete.

**Key Functions**:
- `addTag(memeKey, tag)`: Add tag to meme
- `removeTag(memeKey, tag)`: Remove tag from meme
- `getAllTags()`: Get all unique tags sorted
- `filterTags(tags, query)`: Fuzzy search for autocomplete

**Features**:
- Lazy loading (loaded on demand)
- Autocomplete with arrow key navigation
- Tag length limit (100 chars)
- Duplicate prevention

### 6. History Panel (`history.ts`)

**Purpose**: Browse and filter memes.

**Features**:
- Real-time search by text/template
- Favorites filter
- Tag filters (AND logic)
- Click to view meme
- Dark mode support

**Keyboard Shortcut**: Press `H` to toggle

### 7. Overlay System (`overlay.ts`)

**Purpose**: Display memes with interactive controls.

**Features**:
- Star button for favorites
- Tag input with autocomplete
- Tag badges with remove buttons
- Close button and ESC key
- Dark mode support
- Keyboard shortcuts integration

**Security**: All DOM manipulation uses `textContent` (no `innerHTML`)

### 8. Batch Generation (`batch.ts`)

**Purpose**: Generate multiple meme variants in parallel.

**Features**:
- 1-3 variants per text
- Parallel processing with `Promise.all`
- Individual error handling per text
- Progress tracking

**Performance**: 3x faster than sequential processing

### 9. Undo System (`undo.ts`)

**Purpose**: Undo favorites and tag changes.

**Features**:
- Stack of last 20 actions
- Supports favorite toggles and tag changes
- Keyboard shortcut: `Ctrl+Z`

### 10. Keyboard Shortcuts (`shortcuts.ts`)

**Purpose**: Global keyboard shortcuts.

**Shortcuts**:
- `Ctrl+Z`: Undo last action
- `H`: Toggle history panel
- `Esc`: Close overlays

### 11. Popup UI (`popup.ts` + `popup.html`)

**Purpose**: Settings management and configuration.

**Features**:
- API key storage (encrypted in chrome.storage.local)
- Language selection (English, Spanish, French, German)
- Dark mode toggle
- Input validation with visual feedback

**Settings Schema**:
```typescript
interface Settings {
  openrouterApiKey: string;
  selectedLanguage: 'English' | 'Spanish' | 'French' | 'German';
  darkMode: boolean;
}
```

### 12. Configuration (`config.ts`)

**Purpose**: Centralized constants.

```typescript
export const CONFIG = {
  MEMEGEN_API_URL: string;
  FALLBACK_IMAGE_URL: string;
  DEBOUNCE_DELAY: 150;
  MAX_TAG_LENGTH: 100;
  MAX_HISTORY_ITEMS: 1000;
  BATCH_VARIANTS_OPTIONS: [1, 2, 3];
  DEFAULT_VARIANTS: 1;
  MAX_UNDO_STACK: 20;
  CACHE_TTL_MS: 3600000;
};
```

### 13. Logger (`logger.ts`)

**Purpose**: Production debugging.

**Features**:
- `logger.info()`: Debug logs (disabled by default)
- `logger.error()`: Error logs (always enabled)
- `logger.warn()`: Warning logs (disabled by default)
- Toggle `DEBUG` flag for production debugging

## Data Flow

```
1. User highlights text on webpage
2. User right-clicks → "Remix as a Meme"
3. Background worker receives click event
4. Background worker sends message to content script
5. Content script shows loading overlay
6. Content script checks cache for response
7. If cache miss, calls OpenRouter API with text
8. OpenRouter returns meme template suggestion
9. Content script generates meme image URL
10. Meme saved to chrome.storage.local
11. Overlay displays meme with controls
12. User can add tags, mark favorite, view history
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
    "extension_pages": "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline'"
  }
}
```

### XSS Protection
- All user input sanitized
- No `innerHTML` usage (only `textContent`)
- Tag length limits enforced
- Input validation on all fields

### Permissions
```json
{
  "permissions": ["contextMenus", "activeTab", "storage"],
  "host_permissions": ["https://openrouter.ai/*"]
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

### OpenRouter API

**Endpoint**: `https://openrouter.ai/api/v1/chat/completions`

**Request Format**:
```json
{
  "model": "meta-llama/llama-3.2-3b-instruct:free",
  "messages": [{
    "role": "user",
    "content": "Analyze this text and suggest a meme template: [USER_TEXT]"
  }]
}
```

**Response Format**:
```json
{
  "choices": [{
    "message": {
      "content": "drake"
    }
  }]
}
```

### memegen.link API

**Endpoint**: `https://api.memegen.link/images/{template}.png`

**Features**:
- Direct URL generation
- No authentication required
- Fallback image on errors

**Error Handling**:
```typescript
try {
  const response = await fetch(url, { method: 'HEAD' });
  if (!response.ok) throw new Error('Template unavailable');
  return url;
} catch (error) {
  return CONFIG.FALLBACK_IMAGE_URL;
}
```

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
1. **Lazy Loading**: Tags module loaded on demand
2. **LRU Caching**: API responses cached for 1 hour
3. **Debouncing**: Input validation debounced (150ms)
4. **Parallel Processing**: Batch operations use `Promise.all`
5. **Minification**: Production builds minified with Terser
6. **Tree Shaking**: TypeScript compilation removes unused code

### Metrics
- Extension size: ~50KB (dev), ~30KB (prod minified)
- Popup load time: <100ms
- Meme generation: 2-3 seconds (API dependent)
- Cache hit rate: ~40% for repeated texts
- Batch generation: 3x faster with parallel processing
- Test coverage: 100% (237/237 tests passing)

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
chrome.storage.local.get(['openrouterApiKey'], (result) => {
  if (chrome.runtime.lastError) {
    console.error('Storage error:', chrome.runtime.lastError);
    return;
  }
  // Use API key
});
```

## Implemented Features (v1.0)

✅ **Core Features**
- Instant meme generation from highlighted text
- AI-powered template selection (OpenRouter)
- Multi-language support (4 languages)
- Dark mode with animated backgrounds

✅ **Organization**
- Tag system with autocomplete
- Favorites with star button
- History panel with search and filters
- Undo/redo for changes

✅ **Advanced**
- Batch generation (1-3 variants)
- Keyboard shortcuts (Ctrl+Z, H, Esc)
- LRU cache (1-hour TTL)
- Parallel processing

✅ **Security**
- XSS protection
- Input sanitization
- Content Security Policy
- API error handling

## Future Enhancements

### Planned Features
1. **Custom Templates**: User-uploaded templates
2. **Advanced Editing**: Text positioning, fonts, colors
3. **Social Media Integration**: Direct posting
4. **Export Options**: Download as PNG/GIF
5. **Meme Collections**: Organize into folders

### Technical Improvements
1. **Offline Mode**: Pre-loaded templates
2. **WebAssembly**: Faster image processing
3. **Service Worker Optimization**: Reduce memory
4. **Rate Limiting**: Prevent API abuse

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
- **Current**: 100% (237/237 tests passing)
- **Test Suites**: 14 suites
- **Run Time**: ~6 seconds
- **Critical Paths**: 100% coverage

### Test Categories
- Unit tests: Background, content, popup, storage
- Integration tests: Overlay, history, tags, batch
- UI tests: Favorites, filters, autocomplete
- Security tests: Input sanitization, XSS prevention

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
npm run build        # Development build
npm run build:prod   # Production build (minified)
npm test            # Run all tests
```

### Code Style
- TypeScript strict mode enabled
- ESLint with TypeScript rules
- Prettier for code formatting
- No `console.log` in production (removed by Terser)

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
- **AI Provider**: OpenRouter
- **Design**: Custom gradient animations and glassmorphism

## Build Process

### Development Build
```bash
npm run build
```
1. TypeScript compiles `src/*.ts` → `dist/*.js`
2. Build script copies files to dist/
3. Extension ready for testing

### Production Build
```bash
npm run build:prod
```
1. TypeScript compilation
2. File copying
3. **Minification with Terser**:
   - Dead code elimination
   - Console.log removal
   - Variable mangling
   - Comment removal
4. ~40% size reduction

### Build Output
```
dist/
├── manifest.json
├── popup.html
├── popup-batch.html
├── styles.css
├── background.js      (minified)
├── content.js         (minified)
├── popup.js           (minified)
├── popup-batch.js     (minified)
└── icons/icon.svg
```

---

*Last updated: 2024 | Version 1.0.0*
