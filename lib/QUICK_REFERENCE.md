# Quick Reference - Reusable Utilities

## One-Line Imports

```typescript
// Hash
import { simpleHash } from './lib/hash';

// Text Utils
import { decodeHtmlEntities, removeEmojis, sanitizeText, cleanText } from './lib/text-utils';

// Logger
import { Logger } from './lib/logger';

// LRU Cache
import { LRUCache } from './lib/lru-cache';

// Storage
import { StorageAdapter, ChromeStorageAdapter } from './lib/storage-adapter';
import { GenericStorage } from './lib/generic-storage';

// I18n
import { I18n } from './lib/i18n';
```

## Quick Examples

```typescript
// Hash: Generate ID from string
const id = simpleHash('my-data'); // "abc12345"

// Text: Clean user input
const clean = cleanText('Hello 👋 @World'); // "Hello World"

// Logger: Debug logging
const log = new Logger('App', true);
log.info('Started');

// Cache: Store API responses
const cache = new LRUCache<string>(100, 3600000);
cache.set('key', 'value');

// Storage: Save data
const storage = new ChromeStorageAdapter();
await storage.set('user', { name: 'John' });

// I18n: Translate text
const i18n = new I18n({ en: { hi: 'Hello' }, es: { hi: 'Hola' } }, 'en');
i18n.t('hi', 'es'); // "Hola"
```

## Features

- ✅ Zero dependencies
- ✅ TypeScript support
- ✅ Framework agnostic
- ✅ Production tested
- ✅ Well documented

See `lib/README.md` for full documentation.
