import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    // Allows larger body size for file uploads if needed
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
