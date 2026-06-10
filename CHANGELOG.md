# Changelog

All notable changes to Chuckle documented here.

## [1.4.0] - 2026-06-10

### Fixed
- **Context menu duplicates**: Prevent duplicate entries on extension reload
- **Download/share bugs**: Add `host_permissions` for `api.memegen.link`, fix download/share functionality

### Changed
- Remove Gemini integration, refactor overlay
- Remove OpenRouter AI; replace with internal smart meme template selection
- Remove model validation, streamline logging
- Pass meme data via ID to viewer instead of full data
- Extract meme generation logic to helper functions
- Update tsconfig lib to ES2021
- Streamline text parsing, URL construction by inlining helpers

### Added
- ETH donation section with QR code

### Chore
- Add `esbuild.config.js` to gitignore exclusion list

---

## [1.3.0] - 2025-12-20

### Changed
- **Primary AI provider**: Switch from Google AI to OpenRouter
- Remove Google Generative Language API

---

## [1.2.0] - 2025-12-13

### Added
- **Dark mode**: Full dark mode support in overlay and viewer
- **Modal sharing**: Platform buttons (Twitter, LinkedIn, Email, Facebook, Reddit)
- **Offline indicator**: Toggle indicator in viewer
- Admin icon (`chuckleAdmin.png`)

### Changed
- Viewer regenerate button: Async logic, improved styling
- Package updated for Chrome Web Store

---

## [1.1.0] - 2025-11-18

### Added
- **Permission justifications**: Chrome extension permissions documentation

### Fixed
- Error handling improvements
- Model validation extraction to shared module

### Changed
- Manifest and ZIP uploaded to Chrome Web Store

---

## [1.0.0] - 2025-10-18

### Initial Release

#### Core Features
- **AI-powered meme generation** using Gemini API
- **Multi-provider support**: Gemini + OpenRouter
- **Template library**: 15+ meme templates with smart selection
- **Text editor**: Manual edit with skip formatting option
- **Regeneration**: Generate variants with alternative templates
- **Offline fallback**: Local generation when API unavailable
- **Language support**: i18n for multiple languages

#### Meme Generation
- Text optimization (6-30 word validation)
- Topic extraction and matching
- Template-specific formatting
- Word count validation
- Watermark support
- URL encoding and normalization
- Accented character preservation

#### UI/UX
- **Keyboard shortcuts**: Customizable hotkeys
- **Overlay tooltips**: Contextual help
- **Regenerate button**: Quick variant generation
- **Recent/untagged filters**: History with state persistence
- **Popup animations**: Enhanced visual feedback
- **Dark mode default**: Auto-enabled when undefined

#### Social Sharing
- Twitter, LinkedIn, Email, Facebook, Reddit
- Download functionality
- Share modal

#### Developer Features
- **Error handling**: Centralized utility, multilingual support
- **Rate limit detection**: "API exhausted" messages
- **Caching**: Text formatter caching
- **Storage optimization**: Automatic cleanup of old memes
- **CI/CD pipeline**: Security audits, TypeScript checks, coverage
- **Code organization**: Utilities in `lib/` directory
- **Build system**: esbuild for fast bundling

#### Templates
- Drake, Distracted Boyfriend, Two Buttons, Is This A Pigeon
- Ancient Aliens, Waiting Skeleton, Success Kid, Change My Mind
- Fry, First World Problems, Y U No, Woman Yelling at Cat
- Grumpy Cat, Daily Struggle, Bad Luck Brian

#### Testing & Quality
- Type safety improvements
- Removed unused imports
- Refactored code for reusability
- Enhanced logging
- Improved error messages

#### Privacy
- 100% local processing (offline mode)
- No tracking, no data collection
- Chrome Web Store compliant

### Removed (During 1.0 development)
- Collections feature
- Trending insights
- Favorites and tags
- Batch generation
- Sentiment analysis
- Multiple unused templates

### Fixed (During 1.0 development)
- CSS conflicts (prefixed with `chuckle-`)
- Error message handling for rate limits
- Text formatting failures
- Download icon styling
- URL normalization for accents
