# Extension Testing Checklist

## 1. Reload Extension
1. Go to `chrome://extensions/`
2. Find "Chuckle" extension
3. Click the **reload** button (circular arrow icon)
4. Check for any errors in red text

## 2. Check Background Script
1. On `chrome://extensions/`, click "service worker" link under Chuckle
2. This opens DevTools for the background script
3. You should see: `[Chuckle] Extension installed, creating context menu`
4. If you don't see this, the background script isn't loading

## 3. Test on a Webpage
1. Go to any website (e.g., https://example.com)
2. Open DevTools (F12)
3. Go to Console tab
4. Highlight some text on the page
5. Right-click → "Remix as a Meme"
6. Check console for logs:
   - `[Chuckle] Context menu clicked, text: ...`
   - `[Chuckle] Message received: generateMeme`
   - `[Chuckle] Starting meme generation for text: ...`

## 4. Check for Errors
Look for these common issues:

### No console logs at all?
- Content script not injected
- Try refreshing the webpage (F5)
- Check if content.js is in dist/ folder

### "chrome.action.openPopup is not a function"?
- This is expected in Manifest V3
- The popup should open automatically

### No context menu appears?
- Background script not running
- Check service worker in chrome://extensions/

### API key error?
- Click Chuckle icon in toolbar
- Enter your Gemini API key
- Click "Save Settings"

## 5. Quick Test Commands
Run these in the DevTools console on any webpage:

```javascript
// Test if content script loaded
console.log('Testing Chuckle...');

// Manually trigger meme generation
chrome.runtime.sendMessage({action: 'generateMeme', text: 'test meme'});
```

## 6. Check Files Exist
Verify these files are in dist/:
- ✓ manifest.json
- ✓ background.js
- ✓ content.js
- ✓ popup.html
- ✓ popup.js
- ✓ styles.css
- ✓ icons/icon.svg
