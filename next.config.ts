import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip body parsing for API routes to handle large files
  skipMiddlewareUrlNormalize: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '4gb',
      allowedOrigins: ['*']
    },
  },
};

export default nextConfig;