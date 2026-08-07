import type { NextConfig } from "next";

// Ambil hostname dari env var agar tidak hardcoded
// Fallback ke parse URL jika NEXT_PUBLIC_SUPABASE_URL sudah diset
function getSupabaseHostname(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is required");
  }
  try {
    return new URL(url).hostname;
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${url}`);
  }
}

const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // 24 jam
    remotePatterns: [
      {
        protocol: "https",
        hostname: getSupabaseHostname(),
      },
    ],
  },
  // Kurangi ukuran bundle
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
