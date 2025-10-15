# Gist Features to Implement in Chuckle

## Key Features from Gist

### 1. History Management
- **Storage**: Uses `chrome.storage.local` with keys like `summary_${hash}`
- **Data Structure**:
  ```typescript
  {
    markdown: string,
    urls: string[],
    timestamp: number,
    query: string,
    format: 'brief' | 'detailed',
    language: string,
    engine: string,
    model: string,
    isFavorite: boolean,
    tags: string[]
  }
  ```
- **Display**: Inline history panel with search, filter by favorites, filter by tags
- **Sorting**: Favorites first, then by timestamp (newest first)

### 2. Favorites System
- **Toggle**: Star button (☆/⭐) in summary header
- **Storage**: `isFavorite: boolean` field in storage
- **Filter**: Button to show only favorites in history

### 3. Tags System
- **Input**: Tag input field with autocomplete dropdown
- **Storage**: `tags: string[]` array in each summary
- **Autocomplete**: Shows existing tags from all summaries
- **Display**: Tag badges with remove button (×)
- **Filter**: Clickable tag badges in history to filter by multiple tags
- **Visual**: Gradient badges with hover effects

### 4. Local Saving
- **Download**: Button to download as `.md` file
- **Filename**: `gist_${engine}_${query}_${date}.md`
- **Format**: Plain markdown with decoded HTML entities

### 5. UI Components
- **History Panel**: Inline panel with search, scroll buttons, clear button
- **Tag Badges**: Gradient colored badges with remove functionality
- **Filter Badges**: Toggle-able badges for tag filtering
- **Metadata Badges**: Show format, language, engine, model
- **Scroll Controls**: Top/Up/Down/Bottom buttons for history navigation

### 6. Storage Management
- **Cache**: In-memory Map for recent summaries
- **Persistence**: chrome.storage.local for long-term storage
- **Cleanup**: Automatic cleanup when storage quota exceeded
- **Hash Keys**: Use simple hash function for storage keys

## Implementation Plan for Chuckle

1. **Create meme display overlay** (similar to Gist's summary overlay)
2. **Add history storage** for generated memes
3. **Implement favorites** with star toggle
4. **Add tagging system** with autocomplete
5. **Enable local download** of meme images
6. **Create history panel** with search and filters
7. **Add metadata tracking** (template, language, timestamp)
8. **Implement storage cleanup** to manage quota
