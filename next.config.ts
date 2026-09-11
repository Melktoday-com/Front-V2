import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.figma.com",
        port: "",
        pathname: "/api/mcp/asset/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/api/media/**",
      },
      {
        protocol: "http",
        hostname: "109.122.254.238",
        port: "",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "109.122.254.238",
        port: "",
        pathname: "/backend/media/**",
      },
      {
        protocol: "http",
        hostname: "109.122.254.238",
        port: "3001",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
