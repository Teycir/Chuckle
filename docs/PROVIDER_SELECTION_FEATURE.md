# Provider Selection Feature

## Overview
Added multi-provider AI support to Chuckle, allowing users to choose between Google AI (Gemini) and OpenRouter for meme generation. Implementation follows Gist's exact pattern.

## Changes Made

### 1. Model Selector Library (`lib/model-selector.js`)
- `selectBestGeminiModels()` - Automatically selects best Flash models from Google AI
- `selectBestOpenAIModels()` - Automatically selects best free models from OpenRouter
- Filters for free models, prioritizes Meta Llama models
- Returns primary model + fallback models

### 2. Manifest Updates (`manifest.json`)
- Added OpenRouter API permissions: `https://openrouter.ai/*`
- Added web_accessible_resources for model-selector.js
- Maintains existing Google AI permissions

### 3. Popup UI (`popup.html`)
- Added provider selector dropdown (Google AI / OpenRouter)
- Separate API key inputs for each provider
- Model tooltips showing currently selected model
- Help text switches based on provider
- Dark mode support for all new elements

### 4. Popup Logic (`src/popup.ts`)
- `loadModels()` - Loads and caches Google AI Flash models
- `loadOpenRouterModels()` - Loads free OpenRouter models
- `constantTimeCompare()` - Secure API key comparison
- `getElements()` - Centralized element access
- Provider switching logic
- Model selection on save
- Displays selected model in tooltip

### 5. Service Layer (`src/geminiService.ts`)
- Updated `analyzeMemeContext()` to support both providers
- OpenRouter uses chat completions API format
- Google AI uses existing Gemini format
- Automatic provider detection from storage
- Maintains same caching behavior

## User Flow

1. **Select Provider**: Choose Google AI or OpenRouter from dropdown
2. **Enter API Key**: Input corresponding API key
3. **Auto-Load Models**: On save, automatically fetches and selects best free model
4. **View Model**: Hover over API key input to see selected model
5. **Generate Memes**: Works transparently with selected provider

## API Key Requirements

### Google AI
- Format: `AIza[35 characters]`
- Get from: https://aistudio.google.com/api-keys
- Free tier: 1,500 requests/day

### OpenRouter
- Format: `sk-or-v1-[characters]`
- Get from: https://openrouter.ai/keys
- Free models available (Meta Llama)

## Model Selection Logic

### Google AI (Gemini)
1. Filter for Flash models (exclude Lite)
2. Sort by version (latest first)
3. Prefer stable over preview
4. Select primary + 2 fallbacks

### OpenRouter
1. Filter for free models (exclude Scout)
2. Prioritize Meta Llama models
3. Sort by version and size
4. Prefer instruct variants
5. Select primary + 2 fallbacks

## Storage Keys

- `aiProvider` - 'google' or 'openrouter'
- `geminiApiKey` - Google AI API key
- `openrouterApiKey` - OpenRouter API key
- `primaryModel` - Selected Gemini model
- `fallbackModels` - Gemini fallback models
- `openrouterPrimaryModel` - Selected OpenRouter model
- `openrouterFallbackModels` - OpenRouter fallback models

## Technical Details

- Model caching prevents redundant API calls
- Constant-time comparison for API key security
- 10-second timeout for model loading
- Graceful error handling with user feedback
- Status messages during model loading
- Maintains backward compatibility

## Testing

Build and test:
```bash
npm run build
# Load extension in Chrome
# Test both providers
# Verify model selection
# Test meme generation
```

## Future Enhancements

- Fallback model rotation on errors
- Model performance metrics
- Custom model selection
- Additional provider support
