# Offline Mode Feature

## Overview
Offline Mode allows users to generate memes without making API calls to AI services. This is useful for:
- Users who want to save API quota
- Quick meme generation without waiting for AI responses
- Privacy-conscious users who prefer minimal external requests

## How It Works

### When Offline Mode is Enabled:
1. **Template Selection**: Uses 'drake' as the default template (no AI call)
2. **Text Formatting**: Splits the selected text in half at the word boundary
   - First half → Top text
   - Second half → Bottom text
3. **No Translation**: Text is used as-is without AI processing
4. **All Other Features Work**: Users can still:
   - Manually select different templates
   - Edit text directly
   - Regenerate with different templates
   - Download and share memes

### Text Size Validation
- Still enforces 6-30 word requirement
- Maintains all text formatting and sanitization
- Preserves special characters and accents

## User Interface

### Settings Panel
- New checkbox: "📴 Offline Mode"
- Located below Dark Mode setting
- Not selected by default
- Persists across browser sessions

### Meme Overlay
- Shows 📴 icon in top-right corner when offline mode is enabled
- Visual indicator helps users know they're in offline mode
- Icon appears on all generated memes while offline mode is active

### Translations
Available in all supported languages:
- 🇺🇸 English: "📴 Offline Mode"
- 🇪🇸 Spanish: "📴 Modo Sin Conexión"
- 🇫🇷 French: "📴 Mode Hors Ligne"
- 🇩🇪 German: "📴 Offline-Modus"

## Technical Implementation

### Files Modified
1. **popup.html**: Added offline mode checkbox
2. **popup.ts**: 
   - Added translations for offline mode
   - Load/save offline mode preference
   - Update UI labels
3. **geminiService.ts**: 
   - Check offline mode in `analyzeMemeContext()`
   - Return default template when offline
4. **templateFormatter.ts**:
   - Check offline mode in `formatTextForTemplate()`
   - Split text in half when offline

### Storage
- Key: `offlineMode`
- Type: `boolean`
- Default: `false`

## Example Usage

### With Offline Mode Disabled (Default):
```
Selected text: "When you finally understand recursion after the tenth explanation"
→ AI selects template: "success"
→ AI formats: "Finally understand recursion / After tenth explanation"
```

### With Offline Mode Enabled:
```
Selected text: "When you finally understand recursion after the tenth explanation"
→ Default template: "drake"
→ Simple split: "When you finally understand / recursion after the tenth explanation"
```

## Benefits
- ⚡ Faster generation (no API latency)
- 💰 Saves API quota
- 🔒 More private (fewer external requests)
- 🌐 Works without internet (after initial page load)
- 🎨 Full control over template selection

## Limitations
- No AI-powered template selection
- No AI-powered text optimization
- Text split may not be semantically optimal
- Always starts with 'drake' template

## Future Enhancements
- Allow users to select default template for offline mode
- Smart text splitting based on punctuation
- Local template recommendation based on keywords
