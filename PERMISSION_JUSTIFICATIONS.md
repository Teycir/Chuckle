# Chrome Extension Permission Justifications

## Required Permissions

### 1. `contextMenus`
**Why needed:** Creates the right-click menu option "Remix as a Meme" when users highlight text on any webpage.
**User benefit:** Allows users to generate memes directly from selected text without opening the extension popup.

### 2. `activeTab`
**Why needed:** Reads the text that users highlight on the current webpage to send to the AI for meme generation.
**User benefit:** Enables the core functionality of converting selected text into memes.
**Privacy:** Only accesses the active tab when user explicitly triggers meme generation (right-click or Alt+M).

### 3. `storage`
**Why needed:** Stores user preferences (API key, language, dark mode) and meme statistics locally in the browser.
**User benefit:** Remembers settings between sessions and tracks meme creation analytics.
**Privacy:** All data stays local on the user's computer—no external servers.

### 4. `alarms`
**Why needed:** Manages the 1-hour cache expiration for AI API responses.
**User benefit:** Improves performance by caching responses while ensuring fresh results.

## Host Permissions

### 1. `https://generativelanguage.googleapis.com/*`
**Why needed:** Connects to Google AI Studio (Gemini API) to generate meme text and select templates.
**User benefit:** Provides free AI-powered meme generation (1,500 free requests/day).
**Privacy:** User's own API key is used—direct connection, no intermediary servers.

### 2. `https://openrouter.ai/*`
**Why needed:** Alternative AI provider option for users who prefer OpenRouter.
**User benefit:** Gives users choice of AI provider and access to multiple models.
**Privacy:** User's own API key is used—direct connection, no intermediary servers.

## Content Scripts

### `<all_urls>`
**Why needed:** Injects the meme overlay UI and keyboard shortcut handler on all webpages.
**User benefit:** Allows meme generation from any website and displays results in-page.
**Privacy:** Only activates when user triggers meme generation. No data collection or tracking.

## Summary
All permissions are essential for core functionality. Chuckle:
- ✅ Uses minimal permissions required
- ✅ Stores all data locally (no external servers)
- ✅ Only accesses pages when user explicitly triggers actions
- ✅ Open source—code is publicly verifiable
- ✅ No tracking, no ads, no data collection
