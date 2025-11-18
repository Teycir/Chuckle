# Chuckle Extension Troubleshooting Guide

## Current Issues and Solutions

### 1. Extension Conflicts
**Problem**: `chrome-extension://invalid/` errors and connection failures
**Solution**: 
- Disable other extensions temporarily
- Use a clean Chrome profile for testing
- The extension now includes conflict detection

### 2. API Credits Exhausted
**Problem**: "API credits ended" or 429 errors
**Solutions**:
- **Automatic**: Extension now enables offline mode when credits are exhausted
- **Manual**: Get a new API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Alternative**: Switch to OpenRouter in extension settings

### 3. Admin Panel Not Loading
**Problem**: Extension popup/admin not opening
**Solutions**:
1. **Rebuild Extension**:
   ```bash
   cd /path/to/Chuckle
   npm run build
   ```
2. **Reload Extension**:
   - Go to `chrome://extensions/`
   - Find Chuckle extension
   - Click reload button
3. **Clean Install**:
   - Remove extension
   - Load the `dist` folder (not root folder)

### 4. Connection Errors
**Problem**: "Could not establish connection" errors
**Solutions**:
- Extension now includes health checks
- Restart Chrome browser
- Check if extension is properly loaded

## Quick Fixes Applied

✅ **Auto-fallback to offline mode** when API credits exhausted
✅ **Conflict detection** warns about extension interference  
✅ **Status indicator** shows offline mode and API status
✅ **Proper build** ensures source matches compiled files
✅ **Error handling** for common API issues

## Installation Steps (Fixed)

1. **Build the extension**:
   ```bash
   npm run build
   ```

2. **Load in Chrome**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - **Select the `dist` folder** (not the root Chuckle folder)

3. **Configure API**:
   - Click Chuckle icon
   - Add your API key
   - Test with selected text

## Testing the Fixes

1. **Test offline mode**: Disable internet, try generating meme
2. **Test conflict detection**: Extension will warn if conflicts detected
3. **Test API fallback**: When credits exhausted, automatically switches to offline
4. **Test admin panel**: Should open properly after rebuild

## If Issues Persist

1. Check browser console for specific errors
2. Try in incognito mode (no other extensions)
3. Verify you're loading the `dist` folder, not root folder
4. Ensure all files are built properly with `npm run build`

The extension is now more robust and handles common issues automatically!