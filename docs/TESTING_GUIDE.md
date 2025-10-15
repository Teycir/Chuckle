# Chuckle Extension - Testing Guide

## Quick Start

### 1. Build the Extension
```bash
npm run build
```

This creates the `dist/` folder with all deployable files.

### 2. Load in Chrome

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `dist/` folder
5. Extension loaded! ✅

### 3. Setup API Key

1. Visit: https://aistudio.google.com/app/apikey
2. Create API key
3. Click Chuckle icon in Chrome
4. Paste key → Save Settings

---

## Test Checklist

### ✅ Basic Functionality

**Test 1: Generate Meme**
- [ ] Go to any website
- [ ] Highlight text: "When you finally understand recursion"
- [ ] Right-click → "Remix as a Meme"
- [ ] Meme appears in 2-3 seconds
- [ ] Image loads correctly
- [ ] Text displays correctly

**Test 2: Close Overlay**
- [ ] Click X button → overlay closes
- [ ] Click outside content → overlay closes
- [ ] Press Escape key → overlay closes

---

### ✅ History System

**Test 3: View History**
- [ ] Generate 2-3 memes
- [ ] Press `H` key
- [ ] History panel opens
- [ ] All memes appear
- [ ] Newest meme is first

**Test 4: Search History**
- [ ] Open history panel
- [ ] Type in search box
- [ ] Results filter correctly
- [ ] Clear search shows all memes

**Test 5: Click Meme in History**
- [ ] Click a meme thumbnail
- [ ] Overlay opens with full meme
- [ ] All details correct

---

### ✅ Favorites System

**Test 6: Toggle Favorite**
- [ ] Open a meme
- [ ] Click star icon (☆)
- [ ] Star fills (⭐)
- [ ] Click again → star empties

**Test 7: Filter Favorites**
- [ ] Favorite 2-3 memes
- [ ] Open history
- [ ] Click star filter button
- [ ] Only favorited memes show
- [ ] Click again → all memes show

---

### ✅ Tags System

**Test 8: Add Tags**
- [ ] Open a meme
- [ ] Type tag name in input
- [ ] Press Enter
- [ ] Tag badge appears
- [ ] Tag persists after closing

**Test 9: Tag Autocomplete**
- [ ] Add tag "funny" to one meme
- [ ] Open another meme
- [ ] Type "fun" in tag input
- [ ] Dropdown shows "funny"
- [ ] Click to select
- [ ] Tag added

**Test 10: Remove Tags**
- [ ] Click X on tag badge
- [ ] Tag removed
- [ ] Change persists

**Test 11: Filter by Tags**
- [ ] Tag memes with "work" and "funny"
- [ ] Open history
- [ ] Click "work" tag badge
- [ ] Only memes with "work" show
- [ ] Click "funny" too
- [ ] Only memes with BOTH tags show

---

### ✅ Batch Generation

**Test 12: Batch Mode**
- [ ] Click extension icon
- [ ] Find batch mode option
- [ ] Enter 3 texts (one per line)
- [ ] Select 1 variant
- [ ] Click Generate
- [ ] 3 memes created

**Test 13: Multiple Variants**
- [ ] Enter 1 text
- [ ] Select 2 variants
- [ ] Generate
- [ ] 2 different memes created
- [ ] Both saved to history

**Test 14: 3 Variants**
- [ ] Enter 1 text
- [ ] Select 3 variants
- [ ] Generate
- [ ] 3 different memes created

---

### ✅ Keyboard Shortcuts

**Test 15: History Shortcut**
- [ ] Press `H` key
- [ ] History panel opens
- [ ] Press `H` again (or close)
- [ ] Panel closes/toggles

**Test 16: Undo Shortcut**
- [ ] Favorite a meme
- [ ] Press `Ctrl+Z` (or `Cmd+Z` on Mac)
- [ ] Favorite undone
- [ ] Toast notification shows

**Test 17: Escape Key**
- [ ] Open any overlay
- [ ] Press Escape
- [ ] Overlay closes

---

### ✅ Dark Mode

**Test 18: Toggle Dark Mode**
- [ ] Click extension icon
- [ ] Enable dark mode
- [ ] Save settings
- [ ] Generate meme
- [ ] Overlay uses dark theme
- [ ] History panel uses dark theme

---

### ✅ Loading States

**Test 19: Loading Indicator**
- [ ] Generate a meme
- [ ] Loading spinner appears
- [ ] "Generating meme..." message shows
- [ ] Spinner disappears when done

---

### ✅ Error Handling

**Test 20: No API Key**
- [ ] Remove API key from settings
- [ ] Try to generate meme
- [ ] Error message appears
- [ ] Instructions shown

**Test 21: Invalid Text**
- [ ] Highlight empty text
- [ ] Try to generate
- [ ] Handles gracefully

**Test 22: Network Error**
- [ ] Disconnect internet
- [ ] Try to generate meme
- [ ] Error message appears
- [ ] Reconnect works

---

### ✅ Edge Cases

**Test 23: Very Long Text**
- [ ] Highlight 500+ character text
- [ ] Generate meme
- [ ] Handles correctly

**Test 24: Special Characters**
- [ ] Highlight text with emojis: "Test 🎭😂"
- [ ] Generate meme
- [ ] Displays correctly

**Test 25: Multiple Languages**
- [ ] Change language in settings
- [ ] Generate meme
- [ ] Works correctly

**Test 26: Rapid Actions**
- [ ] Generate multiple memes quickly
- [ ] Toggle favorites rapidly
- [ ] Add/remove tags quickly
- [ ] No crashes or errors

---

## Performance Tests

**Test 27: Speed**
- [ ] Meme generation < 5 seconds
- [ ] History opens instantly
- [ ] Search filters instantly
- [ ] Tag autocomplete < 200ms

**Test 28: Memory**
- [ ] Generate 50+ memes
- [ ] Check Chrome task manager
- [ ] Memory usage reasonable
- [ ] No memory leaks

---

## Browser Compatibility

**Test 29: Chrome**
- [ ] All features work
- [ ] No console errors
- [ ] Smooth performance

**Test 30: Edge (Chromium)**
- [ ] Extension loads
- [ ] Basic features work

---

## Final Checks

**Before Release:**
- [ ] All 30 tests pass
- [ ] No console errors
- [ ] No visual glitches
- [ ] API key setup works
- [ ] Documentation accurate
- [ ] Version number correct

---

## Bug Reporting Template

If you find issues:

```
**Bug**: [Brief description]
**Steps**: 
1. [Step 1]
2. [Step 2]
**Expected**: [What should happen]
**Actual**: [What actually happened]
**Browser**: Chrome [version]
**Console Errors**: [Any errors]
```

---

## Success Criteria

✅ All 30 tests pass
✅ No critical bugs
✅ Performance acceptable
✅ User experience smooth
✅ Ready for Chrome Web Store

---

## Next Steps After Testing

1. Fix any bugs found
2. Update version if needed
3. Create ZIP for Chrome Web Store
4. Submit for review
5. Monitor user feedback

---

**Happy Testing! 🚀**
