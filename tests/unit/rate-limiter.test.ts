import { describe, it, expect } from "vitest";
import { TileRateLimiter } from "@/lib/tile-cache/rate-limiter";

describe("TileRateLimiter", () => {
  it("allows bursts up to maxTokens", () => {
    const limiter = new TileRateLimiter(5, 1);

    for (let i = 0; i < 5; i++) {
      const res = limiter.consume("1.2.3.4");
      expect(res.allowed).toBe(true);
    }

    // 6th request exceeds burst capacity
    const sixth = limiter.consume("1.2.3.4");
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryAfter).toBeGreaterThan(0);
  });

  it("differentiates between distinct client IPs", () => {
    const limiter = new TileRateLimiter(2, 1);

    expect(limiter.consume("1.1.1.1").allowed).toBe(true);
    expect(limiter.consume("1.1.1.1").allowed).toBe(true);
    expect(limiter.consume("1.1.1.1").allowed).toBe(false);

    // Another IP still has full capacity
    expect(limiter.consume("2.2.2.2").allowed).toBe(true);
  });

  it("refills tokens over time", async () => {
    const limiter = new TileRateLimiter(2, 10); // 10 tokens/sec = 1 token every 100ms

    limiter.consume("1.2.3.4", 2);
    expect(limiter.consume("1.2.3.4").allowed).toBe(false);

    // Wait 150ms to accumulate > 1 token
    await new Promise((r) => setTimeout(r, 150));
    expect(limiter.consume("1.2.3.4").allowed).toBe(true);
  });
});
