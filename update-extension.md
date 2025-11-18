# How to Update Your Chuckle Extension

## Quick Fix for Console Errors

The console errors you're seeing are mostly from:
1. **Third-party extensions** (MySignature, Hexofy, etc.) - not from Chuckle
2. **Gmail's own scripts** - normal behavior
3. **Ad blockers** blocking tracking scripts - expected behavior

## Update Chuckle Extension

1. **Open Chrome Extensions**:
   - Go to `chrome://extensions/`
   - Make sure "Developer mode" is ON (top right)

2. **Remove Old Version**:
   - Find "Chuckle" extension
   - Click "Remove" button

3. **Install Updated Version**:
   - Click "Load unpacked"
   - Select the `dist` folder inside your Chuckle directory
   - The path should be: `/home/teycir/Repos/Chuckle/dist`

## What's Fixed

✅ **Message Port Errors**: Better error handling for communication between extension parts
✅ **Initialization Errors**: Safer startup that avoids system pages
✅ **DOM Access Errors**: Protected DOM operations with try-catch blocks
✅ **Deprecated API Warnings**: Removed usage of deprecated Chrome APIs

## Console Errors That Are NOT from Chuckle

These errors are normal and from other sources:

- `api.mysignature.io` - MySignature extension
- `api.hexofy.com` - Hexofy extension  
- `connect.facebook.net` - Facebook tracking (blocked by ad blocker)
- `px.ads.linkedin.com` - LinkedIn ads (blocked by ad blocker)
- `signaler-pa.clients6.google.com` - Gmail's real-time features

## Test the Extension

1. Go to any website (like news sites)
2. Highlight 6-30 words of text
3. Right-click → "Remix as a Meme"
4. Or press `Alt+M` with text selected

The extension should work without generating console errors now.

## If You Still See Chuckle Errors

Look for errors that start with `[Chuckle]` - those are from our extension. Other errors are from different sources and are normal.