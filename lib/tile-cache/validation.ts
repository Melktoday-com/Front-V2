export interface ValidatedTileCoords {
  z: number;
  x: number;
  y: number;
  key: string; // e.g. "12/2632/1638"
}

const INTEGER_REGEX = /^\d+$/;

export function validateTileParams(
  rawZ: string | undefined,
  rawX: string | undefined,
  rawY: string | undefined,
  maxZoom: number = 17
): ValidatedTileCoords | null {
  if (!rawZ || !rawX || !rawY) return null;

  // Prevent path traversal strings (.., /, \, etc.)
  if (
    rawZ.includes("..") ||
    rawZ.includes("/") ||
    rawZ.includes("\\") ||
    rawX.includes("..") ||
    rawX.includes("/") ||
    rawX.includes("\\") ||
    rawY.includes("..") ||
    rawY.includes("/") ||
    rawY.includes("\\")
  ) {
    return null;
  }

  // Strip optional .png from rawY
  const cleanY = rawY.endsWith(".png") ? rawY.slice(0, -4) : rawY;

  if (!INTEGER_REGEX.test(rawZ) || !INTEGER_REGEX.test(rawX) || !INTEGER_REGEX.test(cleanY)) {
    return null;
  }

  const z = Number(rawZ);
  const x = Number(rawX);
  const y = Number(cleanY);

  if (!Number.isSafeInteger(z) || !Number.isSafeInteger(x) || !Number.isSafeInteger(y)) {
    return null;
  }

  if (z < 0 || z > maxZoom) {
    return null;
  }

  const maxCoord = Math.pow(2, z);
  if (x < 0 || x >= maxCoord || y < 0 || y >= maxCoord) {
    return null;
  }

  return {
    z,
    x,
    y,
    key: `${z}/${x}/${y}`,
  };
}
