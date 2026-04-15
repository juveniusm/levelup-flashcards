import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      }
    ],
  },
  experimental: {
    // Tree-shakes icon imports so `import { X, Play, ... } from "lucide-react"`
    // only pulls the icons actually used rather than the full barrel file.
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
