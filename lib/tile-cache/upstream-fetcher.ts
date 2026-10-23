import { TileProxyConfig } from "./config";

export interface UpstreamFetchResult {
  status: number;
  buffer?: Buffer;
  etag?: string;
  is304?: boolean;
  is404?: boolean;
  error?: string;
}

// 1x1 transparent PNG fallback
export const TRANSPARENT_1X1_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

class AsyncSemaphore {
  private current = 0;
  private queue: (() => void)[] = [];

  constructor(private max: number) {}

  updateMax(max: number) {
    this.max = Math.max(1, max);
  }

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.current++;
        resolve();
      });
    });
  }

  release(): void {
    this.current--;
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }
}

export class UpstreamFetcher {
  private semaphore: AsyncSemaphore;
  private inFlight = new Map<string, Promise<UpstreamFetchResult>>();
  private backoffUntil = 0;

  constructor(private config: TileProxyConfig) {
    this.semaphore = new AsyncSemaphore(config.upstreamConcurrency);
  }

  get inFlightCount(): number {
    return this.inFlight.size;
  }

  buildUpstreamUrl(z: number, x: number, y: number): string {
    return this.config.upstreamUrl
      .replace("{z}", String(z))
      .replace("{x}", String(x))
      .replace("{y}", String(y));
  }

  async fetchTile(
    z: number,
    x: number,
    y: number,
    ifNoneMatch?: string
  ): Promise<UpstreamFetchResult> {
    const key = `${z}/${x}/${y}`;

    // Request coalescing: share in-flight upstream fetch for identical tiles
    const existing = this.inFlight.get(key);
    if (existing) {
      return await existing;
    }

    const fetchPromise = this.executeFetchWithRetry(z, x, y, ifNoneMatch);
    this.inFlight.set(key, fetchPromise);

    try {
      return await fetchPromise;
    } finally {
      this.inFlight.delete(key);
    }
  }

  private async executeFetchWithRetry(
    z: number,
    x: number,
    y: number,
    ifNoneMatch?: string
  ): Promise<UpstreamFetchResult> {
    // Check if backing off due to upstream 429
    const now = Date.now();
    if (now < this.backoffUntil) {
      return {
        status: 429,
        error: "Upstream rate limited, backing off",
      };
    }

    let attempt = 0;
    const maxAttempts = 2; // 1 initial + 1 retry

    while (attempt < maxAttempts) {
      attempt++;
      await this.semaphore.acquire();

      try {
        const url = this.buildUpstreamUrl(z, x, y);
        const headers: Record<string, string> = {
          "User-Agent": this.config.userAgent,
          Accept: "image/png,image/*;q=0.9,*/*;q=0.8",
        };

        if (ifNoneMatch) {
          headers["If-None-Match"] = ifNoneMatch;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

        try {
          const res = await fetch(url, {
            headers,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (res.status === 304) {
            return { status: 304, is304: true };
          }

          if (res.status === 404) {
            return { status: 404, is404: true };
          }

          if (res.status === 429) {
            // Backoff for 5 seconds on 429
            this.backoffUntil = Date.now() + 5000;
            return { status: 429, error: "Upstream 429 Too Many Requests" };
          }

          // 4xx client errors (excluding 404 and 429) - do not retry
          if (res.status >= 400 && res.status < 500) {
            return { status: res.status, error: `Upstream error ${res.status}` };
          }

          // 5xx server errors - eligible for retry if first attempt
          if (res.status >= 500) {
            if (attempt < maxAttempts) {
              const jitterMs = 200 + Math.floor(Math.random() * 300);
              await new Promise((r) => setTimeout(r, jitterMs));
              continue;
            }
            return { status: res.status, error: `Upstream 5xx error ${res.status}` };
          }

          // 200 OK
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const etag = res.headers.get("etag") || undefined;

          return {
            status: 200,
            buffer,
            etag,
          };
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          // Network errors (DNS, timeout, connection abort)
          if (attempt < maxAttempts) {
            const jitterMs = 200 + Math.floor(Math.random() * 300);
            await new Promise((r) => setTimeout(r, jitterMs));
            continue;
          }
          return {
            status: 504,
            error: fetchErr?.message || "Upstream fetch failed",
          };
        }
      } finally {
        this.semaphore.release();
      }
    }

    return {
      status: 502,
      error: "Upstream fetch exhausted retries",
    };
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __tileUpstreamFetcher: UpstreamFetcher | undefined;
}

export function getUpstreamFetcher(config: TileProxyConfig): UpstreamFetcher {
  if (!global.__tileUpstreamFetcher) {
    global.__tileUpstreamFetcher = new UpstreamFetcher(config);
  }
  return global.__tileUpstreamFetcher;
}
