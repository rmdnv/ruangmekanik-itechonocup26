import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "100.120.192.96" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: "default-src 'self'; frame-ancestors 'none'; img-src 'self' https: http: data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com; connect-src 'self' https: http: https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline';" },
        ],
      },
    ];
  },
};

export default nextConfig;
