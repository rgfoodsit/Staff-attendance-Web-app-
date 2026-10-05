import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    // Avoid Windows pack-cache file locking rename ENOENT errors
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
