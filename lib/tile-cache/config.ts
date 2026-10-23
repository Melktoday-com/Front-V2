import path from "path";

export interface TileProxyConfig {
  upstreamUrl: string;
  userAgent: string;
  cacheDir: string;
  ttlDays: number;
  cacheMaxGb: number;
  maxZoom: number;
  upstreamConcurrency: number;
  memCacheMaxMb: number;
  rateLimitBurst: number;
  rateLimitRefill: number;
  trustedIpHeader: string;
}

export function getTileConfig(): TileProxyConfig {
  const upstreamUrl =
    process.env.TILE_UPSTREAM_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

  const userAgent =
    process.env.TILE_USER_AGENT ||
    "MelktodayTileProxy/2.0 (+https://melktoday.com; contact@melktoday.com)";

  const trustedIpHeader = (process.env.TILE_TRUSTED_IP_HEADER || "x-real-ip").toLowerCase();

  // Default cache dir: resolve from env, or fallback to '.tile-cache' under process.cwd()
  const rawCacheDir =
    process.env.TILE_CACHE_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), ".tile-cache");
  const cacheDir = path.isAbsolute(rawCacheDir)
    ? rawCacheDir
    : path.join(/*turbopackIgnore: true*/ process.cwd(), rawCacheDir);

  const ttlDays = Math.max(1, parseInt(process.env.TILE_TTL_DAYS || "30", 10));
  const cacheMaxGb = Math.max(0.001, parseFloat(process.env.TILE_CACHE_MAX_GB || "5"));
  const maxZoom = Math.min(19, Math.max(1, parseInt(process.env.TILE_MAX_ZOOM || "17", 10)));
  const upstreamConcurrency = Math.max(
    1,
    parseInt(process.env.TILE_UPSTREAM_CONCURRENCY || "6", 10)
  );
  const memCacheMaxMb = Math.max(
    8,
    parseInt(process.env.TILE_MEM_CACHE_MAX_MB || "64", 10)
  );
  // Generous token-bucket defaults for NAT environments (many users sharing single public IP)
  const rateLimitBurst = Math.max(
    50,
    parseInt(process.env.TILE_RATE_LIMIT_BURST || "1200", 10)
  );
  const rateLimitRefill = Math.max(
    10,
    parseInt(process.env.TILE_RATE_LIMIT_REFILL || "150", 10)
  );

  return {
    upstreamUrl,
    userAgent,
    cacheDir,
    ttlDays,
    cacheMaxGb,
    maxZoom,
    upstreamConcurrency,
    memCacheMaxMb,
    rateLimitBurst,
    rateLimitRefill,
    trustedIpHeader,
  };
}
