import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { DEFAULT_UPLOADS_URL, buildRemotePatterns } from "./src/components/imageHosts";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Public URL of uploaded media (same env var as src/app/api/upload/route.ts).
const uploadsUrl = process.env.S3_CDN_URL || DEFAULT_UPLOADS_URL;

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Exposed to the client so SafeImage knows which hosts are optimisable.
  env: {
    NEXT_PUBLIC_UPLOADS_URL: uploadsUrl,
  },
  images: {
    remotePatterns: buildRemotePatterns(uploadsUrl),
  },
  // One canonical host. Google sign-in always returns to wsfa.app, so a sign-in
  // started on www would lose its state/PKCE cookies ("state value could not be parsed").
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.wsfa.app" }],
        destination: "https://wsfa.app/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
