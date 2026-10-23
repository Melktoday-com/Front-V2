import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface DiskTileMetadata {
  etag: string;
  fetchedAt: number;
  contentType: string;
}

export interface DiskTileResult {
  buffer: Buffer;
  etag: string;
  fetchedAt: number;
}

export function getTilePath(cacheDir: string, z: number, x: number, y: number): string {
  return path.join(cacheDir, String(z), String(x), `${y}.png`);
}

export function getMetadataPath(tilePath: string): string {
  return tilePath.replace(/\.png$/, ".json");
}

export function computeBufferEtag(buffer: Buffer): string {
  const hash = crypto.createHash("md5").update(buffer).digest("hex").slice(0, 16);
  return `"${hash}"`;
}

export async function readDiskTile(
  cacheDir: string,
  z: number,
  x: number,
  y: number
): Promise<DiskTileResult | null> {
  const tilePath = getTilePath(cacheDir, z, x, y);
  const metaPath = getMetadataPath(tilePath);

  try {
    const buffer = await fs.readFile(tilePath);

    // Try reading sidecar metadata
    try {
      const metaContent = await fs.readFile(metaPath, "utf8");
      const meta = JSON.parse(metaContent) as DiskTileMetadata;
      return {
        buffer,
        etag: meta.etag || computeBufferEtag(buffer),
        fetchedAt: meta.fetchedAt || Date.now(),
      };
    } catch {
      // If metadata is missing or corrupt, use file stat
      const stat = await fs.stat(tilePath);
      const etag = computeBufferEtag(buffer);
      return {
        buffer,
        etag,
        fetchedAt: stat.mtimeMs,
      };
    }
  } catch {
    return null;
  }
}

export async function writeDiskTile(
  cacheDir: string,
  z: number,
  x: number,
  y: number,
  buffer: Buffer,
  etag?: string,
  fetchedAt: number = Date.now()
): Promise<void> {
  const tilePath = getTilePath(cacheDir, z, x, y);
  const metaPath = getMetadataPath(tilePath);
  const dir = path.dirname(tilePath);

  await fs.mkdir(dir, { recursive: true });

  const finalEtag = etag || computeBufferEtag(buffer);
  const metadata: DiskTileMetadata = {
    etag: finalEtag,
    fetchedAt,
    contentType: "image/png",
  };

  // Atomic write: write to temp file then rename
  const tempTilePath = `${tilePath}.${crypto.randomUUID()}.tmp`;
  const tempMetaPath = `${metaPath}.${crypto.randomUUID()}.tmp`;

  try {
    await fs.writeFile(tempTilePath, buffer);
    await fs.writeFile(tempMetaPath, JSON.stringify(metadata), "utf8");

    await fs.rename(tempTilePath, tilePath);
    await fs.rename(tempMetaPath, metaPath);
  } catch (err) {
    // Cleanup temporary files on failure
    await fs.unlink(tempTilePath).catch(() => {});
    await fs.unlink(tempMetaPath).catch(() => {});
    throw err;
  }
}

export async function touchDiskTileMetadata(
  cacheDir: string,
  z: number,
  x: number,
  y: number,
  newFetchedAt: number = Date.now()
): Promise<void> {
  const tilePath = getTilePath(cacheDir, z, x, y);
  const metaPath = getMetadataPath(tilePath);

  try {
    const metaContent = await fs.readFile(metaPath, "utf8");
    const meta = JSON.parse(metaContent) as DiskTileMetadata;
    meta.fetchedAt = newFetchedAt;
    await fs.writeFile(metaPath, JSON.stringify(meta), "utf8");
    // Also update mtime on the tile file
    const now = new Date(newFetchedAt);
    await fs.utimes(tilePath, now, now).catch(() => {});
  } catch {
    // If sidecar doesn't exist, try updating utimes directly
    const now = new Date(newFetchedAt);
    await fs.utimes(tilePath, now, now).catch(() => {});
  }
}

// Lazy eviction state
let lastEvictionRun = 0;
let isEvicting = false;

interface FileStatInfo {
  tilePath: string;
  metaPath: string;
  size: number;
  mtime: number;
}

export async function maybeRunDiskEviction(
  cacheDir: string,
  maxGb: number,
  intervalMs: number = 10 * 60 * 1000
): Promise<void> {
  const now = Date.now();
  if (isEvicting || now - lastEvictionRun < intervalMs) {
    return;
  }

  isEvicting = true;
  lastEvictionRun = now;

  // Run in background without throwing unhandled exceptions
  runDiskEviction(cacheDir, maxGb)
    .catch((err) => {
      console.error("[TileProxy] Eviction error:", err);
    })
    .finally(() => {
      isEvicting = false;
    });
}

export async function runDiskEviction(cacheDir: string, maxGb: number): Promise<{
  deletedFiles: number;
  freedBytes: number;
  totalBytesRemaining: number;
}> {
  const maxBytes = maxGb * 1024 * 1024 * 1024;
  const targetBytes = maxBytes * 0.8; // Evict down to 80% of max limit

  const files: FileStatInfo[] = [];
  let totalBytes = 0;

  async function scanDir(dir: string): Promise<void> {
    let entries: import("fs").Dirent[] = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".png") && !entry.name.includes(".tmp")) {
        try {
          const stat = await fs.stat(fullPath);
          const metaPath = getMetadataPath(fullPath);
          let mtime = stat.mtimeMs;

          // Attempt to get fetchedAt from sidecar if available
          try {
            const metaContent = await fs.readFile(metaPath, "utf8");
            const meta = JSON.parse(metaContent);
            if (meta.fetchedAt) mtime = meta.fetchedAt;
          } catch {}

          files.push({
            tilePath: fullPath,
            metaPath,
            size: stat.size,
            mtime,
          });
          totalBytes += stat.size;
        } catch {}
      }
    }
  }

  await scanDir(cacheDir);

  if (totalBytes <= maxBytes) {
    return { deletedFiles: 0, freedBytes: 0, totalBytesRemaining: totalBytes };
  }

  // Sort files ascending by mtime (oldest first)
  files.sort((a, b) => a.mtime - b.mtime);

  let freedBytes = 0;
  let deletedFiles = 0;

  for (const file of files) {
    if (totalBytes - freedBytes <= targetBytes) {
      break;
    }

    try {
      await fs.unlink(file.tilePath);
      await fs.unlink(file.metaPath).catch(() => {});
      freedBytes += file.size;
      deletedFiles++;
    } catch {}
  }

  return {
    deletedFiles,
    freedBytes,
    totalBytesRemaining: totalBytes - freedBytes,
  };
}
