// Image hosts that next/image may optimise. Shared by next.config.ts
// (images.remotePatterns) and SafeImage (decides `unoptimized` per src), so the
// two lists can't drift apart. No imports: next.config.ts loads this file.

/** Public base URL of uploaded media (see src/app/api/upload/route.ts). */
export const DEFAULT_UPLOADS_URL = "https://storage-wsfa-media.cranl.net";

type RemotePattern = {
  protocol?: "http" | "https";
  hostname: string;
  port?: string;
  pathname?: string;
};

function parseUrl(value: string | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

/** Remote patterns for next.config.ts. `uploadsUrl` is S3_CDN_URL at build time. */
export function buildRemotePatterns(uploadsUrl?: string): RemotePattern[] {
  const origins = [parseUrl(uploadsUrl), parseUrl(DEFAULT_UPLOADS_URL)].filter(
    (u): u is URL => u !== null
  );
  const seen = new Set<string>();
  const patterns: RemotePattern[] = [];
  for (const u of origins) {
    if (seen.has(u.host)) continue;
    seen.add(u.host);
    patterns.push({
      protocol: u.protocol === "http:" ? "http" : "https",
      hostname: u.hostname,
      port: u.port,
      pathname: "/**",
    });
  }
  // Google profile photos (lh3, lh4, ...).
  patterns.push({ protocol: "https", hostname: "*.googleusercontent.com", pathname: "/**" });
  return patterns;
}

/**
 * True when next/image can optimise `src`: local /public paths, the uploads
 * host(s) and Google avatars. Anything else (user-pasted URLs, blob:/data:
 * previews) must be rendered with `unoptimized`, because next/image throws
 * for hosts that aren't in remotePatterns.
 */
export function isOptimizableImage(src: string): boolean {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  const url = parseUrl(src);
  if (!url) return false;
  if (url.protocol === "https:" && url.hostname.endsWith(".googleusercontent.com")) return true;
  const uploads = [parseUrl(process.env.NEXT_PUBLIC_UPLOADS_URL), parseUrl(DEFAULT_UPLOADS_URL)];
  return uploads.some((u) => u !== null && u.host === url.host && u.protocol === url.protocol);
}
