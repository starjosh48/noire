import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Turbopack's build cache records server env values (e.g. GOOGLE_CLIENT_SECRET) as inputs and
    // writes them into .next/cache, inside the deploy folder. Keep secrets out of build output.
    turbopackFileSystemCacheForBuild: false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // No framing by other sites (clickjacking). A full CSP is left out on purpose: Google
          // sign-in and Paystack need third-party scripts and windows that a strict policy would block.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
