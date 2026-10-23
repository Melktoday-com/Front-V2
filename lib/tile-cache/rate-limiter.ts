interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

export class TileRateLimiter {
  private buckets = new Map<string, TokenBucket>();
  private readonly maxTokens: number;
  private readonly refillRatePerSec: number;
  private lastCleanup = Date.now();

  constructor(maxTokens: number = 150, refillRatePerSec: number = 30) {
    this.maxTokens = maxTokens;
    this.refillRatePerSec = refillRatePerSec;
  }

  consume(ip: string, cost: number = 1): { allowed: boolean; retryAfter: number } {
    this.cleanupStaleBuckets();

    const now = Date.now();
    let bucket = this.buckets.get(ip);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(ip, bucket);
    } else {
      // Refill tokens based on elapsed time
      const elapsedSec = (now - bucket.lastRefill) / 1000;
      const refilledTokens = elapsedSec * this.refillRatePerSec;
      bucket.tokens = Math.min(this.maxTokens, bucket.tokens + refilledTokens);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return { allowed: true, retryAfter: 0 };
    }

    const missingTokens = cost - bucket.tokens;
    const retryAfter = Math.ceil(missingTokens / this.refillRatePerSec);
    return { allowed: false, retryAfter };
  }

  private cleanupStaleBuckets(): void {
    const now = Date.now();
    // Run cleanup at most once every 5 minutes
    if (now - this.lastCleanup < 5 * 60 * 1000) return;
    this.lastCleanup = now;

    const staleThresholdMs = 15 * 60 * 1000;
    for (const [ip, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > staleThresholdMs) {
        this.buckets.delete(ip);
      }
    }
  }

  reset(): void {
    this.buckets.clear();
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __tileRateLimiter: TileRateLimiter | undefined;
}

export function getTileRateLimiter(burst: number = 150, refill: number = 30): TileRateLimiter {
  if (!global.__tileRateLimiter) {
    global.__tileRateLimiter = new TileRateLimiter(burst, refill);
  }
  return global.__tileRateLimiter;
}
