import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ndwzafvikiosrdhbhxbk.supabase.co",
      },
    ],
  },
};

export default nextConfig;