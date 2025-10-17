# Performance Monitoring Guide

## Overview

This guide explains how to monitor and optimize Chuckle's performance, particularly for meme generation times and user experience metrics.

## Key Performance Metrics

### 1. Meme Generation Time
- **Target**: < 3 seconds from text selection to meme display
- **Components**:
  - AI template selection: ~500-800ms
  - Text formatting: ~400-600ms
  - Image generation: ~800-1200ms
  - Overlay rendering: < 100ms

### 2. Cache Performance
- **LRU Cache Hit Rate**: Monitor cache effectiveness
- **Cache TTL**: 1 hour (3600 seconds)
- **Expected Hit Rate**: 30-40% for repeated meme patterns

### 3. User Interaction Metrics
- **Overlay Open Time**: < 100ms
- **Overlay Close Time**: < 50ms
- **Regeneration Time**: 2-3 seconds
- **Text Edit Response**: Immediate (< 50ms)

## Monitoring in Development

### Console Logging

Chuckle includes performance logging throughout the codebase:

```typescript
// Example from overlay.ts
const start = performance.now();
await createOverlay(memeData);
const end = performance.now();
console.log(`[Chuckle] Overlay created in ${end - start}ms`);
```

### Performance Tests

Run performance tests to ensure targets are met:

```bash
npm test -- --testNamePattern="Performance"
```

Current performance tests verify:
- Overlay creation < 100ms
- Overlay closing < 50ms
- Cache retrieval speed
- API response handling

## Monitoring in Production

### Browser DevTools

1. **Network Tab**:
   - Monitor API calls to Gemini/OpenRouter
   - Check for rate limiting (429 errors)
   - Verify image loading times

2. **Performance Tab**:
   - Record user interactions
   - Identify bottlenecks in rendering
   - Check for memory leaks

3. **Console**:
   - Enable verbose logging: `localStorage.setItem('chuckle_debug', 'true')`
   - Monitor cache hits/misses
   - Track API errors

### Key Metrics to Track

```javascript
// Add to background.js for production monitoring
const metrics = {
  totalGenerations: 0,
  avgGenerationTime: 0,
  cacheHitRate: 0,
  errorRate: 0,
  apiCallCount: 0
};

// Track in chrome.storage.local
chrome.storage.local.set({ performanceMetrics: metrics });
```

## Optimization Strategies

### 1. Cache Optimization

**Current Implementation**:
- LRU cache with 1-hour TTL
- Separate caches for templates and formatted text
- Cache key format: `fmt:${template}:${text.slice(0, 50)}`

**Improvements**:
- Monitor cache size and eviction patterns
- Adjust TTL based on usage patterns
- Consider IndexedDB for larger cache storage

### 2. API Call Optimization

**Current Implementation**:
- Parallel API calls where possible
- Retry logic with exponential backoff
- Rate limit handling (429 errors)

**Improvements**:
- Batch similar requests
- Implement request queuing
- Add request deduplication

### 3. Image Loading Optimization

**Current Implementation**:
- Direct image URLs from imgflip API
- Lazy loading for history panel
- Image preloading for common templates

**Improvements**:
- Add image compression
- Implement progressive loading
- Cache generated images locally

### 4. UI Rendering Optimization

**Current Implementation**:
- Debounced input handlers
- Event delegation for buttons
- Minimal DOM manipulation

**Improvements**:
- Virtual scrolling for large history
- RequestAnimationFrame for animations
- Web Workers for heavy computations

## Performance Benchmarks

### Baseline Performance (v1.0.0)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Meme Generation | < 3s | 2.5s avg | ✅ |
| Overlay Open | < 100ms | 45ms avg | ✅ |
| Overlay Close | < 50ms | 20ms avg | ✅ |
| Cache Hit Rate | > 30% | 35% avg | ✅ |
| Memory Usage | < 50MB | 28MB avg | ✅ |

### Performance Testing

```bash
# Run all performance tests
npm test -- tests/performance.test.ts

# Run with coverage
npm run test:coverage -- tests/performance.test.ts

# Run specific performance test
npm test -- --testNamePattern="should create overlay quickly"
```

## Troubleshooting Performance Issues

### Slow Meme Generation

**Symptoms**: Generation takes > 5 seconds

**Possible Causes**:
1. Network latency to AI provider
2. API rate limiting
3. Large text input (> 100 chars)
4. Cache misses

**Solutions**:
- Check network connection
- Verify API key and quota
- Truncate text to 100 chars
- Clear and rebuild cache

### High Memory Usage

**Symptoms**: Extension uses > 100MB RAM

**Possible Causes**:
1. Large history storage
2. Cache size too large
3. Memory leaks in event listeners
4. Unclosed overlays

**Solutions**:
- Clear old history entries
- Reduce cache TTL
- Audit event listener cleanup
- Ensure proper overlay disposal

### Slow UI Interactions

**Symptoms**: Buttons/inputs feel sluggish

**Possible Causes**:
1. Too many DOM elements
2. Expensive event handlers
3. Synchronous operations blocking UI
4. CSS animations causing reflows

**Solutions**:
- Implement virtual scrolling
- Debounce/throttle event handlers
- Move operations to async
- Optimize CSS with will-change

## Future Enhancements

### Planned Performance Improvements

1. **Service Worker Optimization**
   - Move heavy computations to service worker
   - Implement background sync for offline support
   - Add request caching at service worker level

2. **Advanced Caching**
   - IndexedDB for persistent cache
   - Predictive prefetching of popular templates
   - Smart cache warming on extension load

3. **Analytics Integration**
   - Add performance monitoring SDK
   - Track real user metrics (RUM)
   - A/B test performance optimizations

4. **Progressive Enhancement**
   - Implement skeleton screens
   - Add optimistic UI updates
   - Stream responses for faster perceived performance

## Resources

- [Chrome Extension Performance Best Practices](https://developer.chrome.com/docs/extensions/mv3/performance/)
- [Web Performance Optimization](https://web.dev/performance/)
- [JavaScript Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)

## Contributing

When adding new features, ensure:
1. Performance tests are included
2. Metrics are logged appropriately
3. Cache strategies are considered
4. UI remains responsive (< 100ms interactions)

---

**Last Updated**: 2024
**Version**: 1.0.0
