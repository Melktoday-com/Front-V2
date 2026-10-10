import type { NextConfig } from "next";

function getEnvHostnames(): Array<{ protocol: "http" | "https"; hostname: string; pathname: string }> {
  const envVars = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_S3_URL,
    process.env.NEXT_PUBLIC_STORAGE_URL,
    process.env.NEXT_PUBLIC_MEDIA_URL,
    ...(process.env.NEXT_PUBLIC_ALLOWED_IMAGE_DOMAINS?.split(",") || []),
  ];
  const list: Array<{ protocol: "http" | "https"; hostname: string; pathname: string }> = [];

  for (const raw of envVars) {
    if (!raw?.trim()) continue;
    const clean = raw.trim();
    try {
      const parsed = new URL(clean.startsWith("http://") || clean.startsWith("https://") ? clean : `https://${clean}`);
      if (parsed.hostname && !list.some((item) => item.hostname === parsed.hostname)) {
        list.push({
          protocol: parsed.protocol === "http:" ? "http" : "https",
          hostname: parsed.hostname,
          pathname: "/**",
        });
      }
    } catch {}
  }

  return list;
}

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
    remotePatterns: getEnvHostnames(),
  },
};

export default nextConfig;
