# Refactoring Plan

## Overview
This document outlines critical improvements to address code duplication, inconsistent validation, and maintainability issues in the Chuckle codebase.

## Issues Identified

### 1. Code Duplication (HIGH PRIORITY)
**Problem**: `analyzeMemeContext` logic is duplicated across:
- `src/api.ts`
- `src/content.ts` 
- `src/batch.ts` (as `analyzeContext`)

**Impact**: 
- Maintenance burden (changes require updating 3 files)
- Risk of inconsistent behavior
- Increased bug surface area

**Solution**: Create shared `src/geminiService.ts` utility

---

### 2. Inconsistent API Key Validation (MEDIUM PRIORITY)
**Problem**: Only `src/content.ts` validates API key format with regex

**Impact**:
- Invalid API keys may reach Gemini API in some flows
- Inconsistent error messages
- Wasted API calls

**Solution**: Centralize validation in shared service

---

### 3. Hardcoded Prompt Strings (MEDIUM PRIORITY)
**Problem**: Gemini prompt text duplicated across multiple files

**Impact**:
- Difficult to update prompts
- Inconsistent prompt behavior
- No single source of truth

**Solution**: Move to `src/constants.ts`

---

### 4. Generic Error Messages (LOW PRIORITY)
**Problem**: Errors like "Invalid API response" lack context

**Impact**:
- Harder debugging
- Poor user experience

**Solution**: Include `text` or `template` in error messages

---

### 5. UI State Safety (MEDIUM PRIORITY)
**Problem**: In `overlay.ts`, tag mutations may leave UI inconsistent if storage fails

**Impact**:
- UI shows tags that aren't saved
- User confusion

**Solution**: Wrap mutations in try/catch, revert on failure

---

## Implementation Plan

### Phase 1: Shared Service (Eliminates Duplication)
**File**: `src/geminiService.ts`

**Exports**:
- `validateApiKey(key: string): boolean`
- `analyzeMemeContext(text: string, variant?: number): Promise<string>`
- `generateMemeImage(text: string, template: string): Promise<string>`

**Benefits**:
- Single source of truth for API logic
- Consistent validation everywhere
- Easier testing and maintenance

---

### Phase 2: Constants Centralization
**File**: `src/constants.ts`

**Exports**:
- `GEMINI_PROMPT_TEMPLATE`
- `API_KEY_REGEX`
- `ERROR_MESSAGES`

**Benefits**:
- Easy prompt updates
- Consistent error messages
- Better i18n support

---

### Phase 3: Error Context Enhancement
**Changes**: Update error throws to include context

**Example**:
```typescript
throw new Error(`Invalid API response for text: "${text.slice(0, 50)}..."`);
```

---

### Phase 4: UI State Safety
**File**: `src/overlay.ts`

**Changes**: Wrap tag operations in try/catch

**Example**:
```typescript
try {
  await tags.addTag(memeData, tag);
  memeData.tags.push(tag);
} catch (error) {
  // Revert UI change
  tagElement.remove();
  showError('Failed to save tag');
}
```

---

## Migration Strategy

### Step 1: Create New Files (Non-Breaking)
- Create `src/geminiService.ts`
- Create `src/constants.ts`
- No existing code changes yet

### Step 2: Update Imports (File by File)
- Update `src/api.ts` to use shared service
- Update `src/batch.ts` to use shared service
- Update `src/content.ts` to use shared service
- Test after each file

### Step 3: Remove Duplicated Code
- Delete old implementations
- Verify all tests pass

### Step 4: Enhance Error Handling
- Add context to error messages
- Add UI state safety

---

## Testing Checklist

- [x] All existing tests pass (237/237)
- [x] API key validation works in all flows
- [x] Cache behavior unchanged
- [x] Error messages include context
- [x] Tag operations revert on failure
- [x] Batch generation still works
- [x] Context menu still works
- [x] History panel still works

---

## Files to Create

1. ✅ **src/geminiService.ts** - Shared Gemini API logic
2. ✅ **src/constants.ts** - Centralized constants

---

## Files to Modify

1. ✅ **src/api.ts** - Use shared service
2. ✅ **src/batch.ts** - Use shared service
3. ✅ **src/content.ts** - Use shared service
4. ✅ **src/overlay.ts** - Add error handling
5. **src/config.ts** - No changes needed (constants kept separate)

---

## Expected Outcomes

### Code Quality
- **-150 lines** of duplicated code removed
- **+1** single source of truth for API logic
- **100%** consistent API key validation

### Maintainability
- Prompt changes: 1 file instead of 3
- API logic changes: 1 file instead of 3
- Easier onboarding for contributors

### Reliability
- Consistent error handling
- UI state safety
- Better debugging

---

## Rollback Plan

If issues arise:
1. Revert to previous commit
2. All changes are additive initially
3. Old code remains until migration complete

---

## Timeline

- **Phase 1**: 30 minutes (create shared service)
- **Phase 2**: 15 minutes (create constants)
- **Phase 3**: 20 minutes (migrate files)
- **Phase 4**: 15 minutes (error handling)
- **Testing**: 20 minutes

**Total**: ~2 hours

---

## Next Steps

1. Review this plan
2. Create `src/geminiService.ts`
3. Create `src/constants.ts`
4. Migrate one file at a time
5. Test thoroughly
6. Deploy

---

## Implementation Summary

### ✅ Completed Changes

**New Files Created:**
- `src/geminiService.ts` - 56 lines of shared API logic
- `src/constants.ts` - Centralized prompts, regex, and error messages

**Files Refactored:**
- `src/api.ts` - Reduced from 48 lines to 1 line (re-export)
- `src/batch.ts` - Removed 35 lines of duplicated code
- `src/content.ts` - Removed 48 lines of duplicated code
- `src/overlay.ts` - Added try/catch blocks for tag operations

**Total Lines Removed:** ~131 lines of duplicated code

**Benefits Achieved:**
- ✅ Single source of truth for Gemini API calls
- ✅ Consistent API key validation across all flows
- ✅ Enhanced error messages with context
- ✅ UI state safety in tag operations
- ✅ Easier maintenance (1 file to update instead of 3)

---

*Last Updated: 2024*
