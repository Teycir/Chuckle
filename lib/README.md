# Reusable Utilities Library

This folder contains generic, framework-agnostic utilities extracted from Chuckle that can be reused in any project.

## Available Utilities

### 1. Hash Utility (`hash.ts`)
Simple string hashing function.

```typescript
import { simpleHash } from './lib/hash';

const hash = simpleHash('my-string'); // Returns: "abc12345"
const customLength = simpleHash('my-string', 12); // Returns: "abc123456789"
```

### 2. Text Utilities (`text-utils.ts`)
Text sanitization, HTML decoding, and emoji removal.

```typescript
import { 
  decodeHtmlEntities, 
  removeEmojis, 
  sanitizeText, 
  cleanText 
} from './lib/text-utils';

const decoded = decodeHtmlEntities('&quot;Hello&quot;'); // "Hello"
const noEmojis = removeEmojis('Hello 👋 World'); // "Hello  World"
const sanitized = sanitizeText('Hello   @#World'); // "Hello World"
const clean = cleanText('Hello 👋 @#World'); // "Hello World"
```

### 3. Logger (`logger.ts`)
Configurable logger with prefix and debug mode.

```typescript
import { Logger } from './lib/logger';

const logger = new Logger('MyApp', true); // debug mode on
logger.info('Starting app...'); // [MyApp] Starting app...
logger.error('Failed to load', error); // [MyApp Error] Failed to load
logger.warn('Deprecated API'); // [MyApp Warning] Deprecated API
```

### 4. LRU Cache (`lru-cache.ts`)
Least Recently Used cache with TTL support.

```typescript
import { LRUCache } from './lib/lru-cache';

const cache = new LRUCache<string>(100, 3600000); // 100 items, 1 hour TTL
cache.set('key', 'value');
const value = cache.get('key'); // "value"
cache.clear();
```

### 5. Storage Adapter (`storage-adapter.ts`)
Generic storage interface with Chrome implementation.

```typescript
import { StorageAdapter, ChromeStorageAdapter } from './lib/storage-adapter';

const storage: StorageAdapter = new ChromeStorageAdapter();
await storage.set('key', { data: 'value' });
const data = await storage.get('key');
const all = await storage.getAll();
await storage.remove('key');
```

### 6. Generic Storage (`generic-storage.ts`)
High-level storage manager with prefix-based namespacing.

```typescript
import { GenericStorage } from './lib/generic-storage';
import { ChromeStorageAdapter } from './lib/storage-adapter';

interface User { id: string; name: string; }

const storage = new GenericStorage<User>(
  new ChromeStorageAdapter(),
  'user'
);

const key = await storage.save(
  { id: '1', name: 'John' },
  (user) => user.id
);
const user = await storage.get(key);
const allUsers = await storage.getAll();
await storage.update(key, { name: 'Jane' });
await storage.remove(key);
```

### 7. I18n (`i18n.ts`)
Internationalization with fallback support.

```typescript
import { I18n } from './lib/i18n';

const translations = {
  en: { hello: 'Hello', goodbye: 'Goodbye' },
  es: { hello: 'Hola', goodbye: 'Adiós' },
  fr: { hello: 'Bonjour', goodbye: 'Au revoir' }
};

const i18n = new I18n(translations, 'en');
i18n.t('hello', 'es'); // "Hola"
i18n.t('hello'); // "Hello" (default language)
i18n.getAll('fr'); // { hello: 'Bonjour', goodbye: 'Au revoir' }
i18n.hasLanguage('es'); // true
```

## Features

✅ **Zero Dependencies** - All utilities are self-contained  
✅ **TypeScript** - Full type safety with generics  
✅ **Framework Agnostic** - Works with any JavaScript project  
✅ **Well Tested** - Validated by Chuckle's 157 passing tests  
✅ **Production Ready** - Extracted from production code  

## Usage in Other Projects

1. Copy the `lib/` folder to your project
2. Import the utilities you need
3. Adapt as needed for your use case

## License

Same as Chuckle project - open source and free to use.
