export interface MemoryTileItem {
  buffer: Buffer;
  etag: string;
  fetchedAt: number;
}

export class MemoryTileCache {
  private cache = new Map<string, MemoryTileItem>();
  private negativeCache = new Map<string, number>();
  private currentBytes = 0;
  private readonly maxBytes: number;
  private readonly negativeCacheTtlMs: number;

  constructor(maxMb: number = 64, negativeCacheTtlMs: number = 5 * 60 * 1000) {
    this.maxBytes = Math.max(1, maxMb) * 1024 * 1024;
    this.negativeCacheTtlMs = negativeCacheTtlMs;
  }

  get(key: string): MemoryTileItem | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    // Refresh LRU position by re-inserting
    this.cache.delete(key);
    this.cache.set(key, item);
    return item;
  }

  set(key: string, item: MemoryTileItem): void {
    const itemBytes = item.buffer.length + 64; // buffer size + metadata overhead

    if (itemBytes > this.maxBytes) {
      // Single item exceeds total cache limit; don't store in memory
      return;
    }

    // If key already exists, remove old bytes first
    const existing = this.cache.get(key);
    if (existing) {
      this.currentBytes -= existing.buffer.length + 64;
      this.cache.delete(key);
    }

    // Evict oldest entries until space is available
    while (this.currentBytes + itemBytes > this.maxBytes && this.cache.size > 0) {
      const oldestKey = this.cache.keys().next().value;
      if (!oldestKey) break;
      const oldest = this.cache.get(oldestKey);
      if (oldest) {
        this.currentBytes -= oldest.buffer.length + 64;
      }
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, item);
    this.currentBytes += itemBytes;

    // Remove from negative cache if it was there
    this.negativeCache.delete(key);
  }

  isNegativeCached(key: string): boolean {
    const timestamp = this.negativeCache.get(key);
    if (!timestamp) return false;
    if (Date.now() - timestamp > this.negativeCacheTtlMs) {
      this.negativeCache.delete(key);
      return false;
    }
    return true;
  }

  setNegativeCache(key: string): void {
    this.negativeCache.set(key, Date.now());
  }

  get stats() {
    return {
      entries: this.cache.size,
      bytes: this.currentBytes,
      maxBytes: this.maxBytes,
      negativeEntries: this.negativeCache.size,
    };
  }

  clear(): void {
    this.cache.clear();
    this.negativeCache.clear();
    this.currentBytes = 0;
  }
}

// Global singleton for the process
declare global {
  // eslint-disable-next-line no-var
  var __tileMemoryCache: MemoryTileCache | undefined;
}

export function getMemoryTileCache(maxMb?: number): MemoryTileCache {
  if (!global.__tileMemoryCache) {
    global.__tileMemoryCache = new MemoryTileCache(maxMb);
  }
  return global.__tileMemoryCache;
}
