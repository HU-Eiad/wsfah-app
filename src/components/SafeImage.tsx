"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { isOptimizableImage } from "./imageHosts";

type SafeImageProps = ImageProps & {
  /** Shown when `src` fails to load. Without it a failed image is hidden, so the container's background shows instead of a broken-image icon. */
  fallbackSrc?: string;
};

/**
 * next/image for images whose URL comes from data (uploads, avatars, logos).
 * Known hosts are optimised; any other host is passed through `unoptimized`
 * instead of throwing "hostname is not configured". Missing or unreachable
 * files never show the browser's broken-image icon.
 */
export default function SafeImage({ src, unoptimized, alt, fallbackSrc, onError, ...rest }: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null);
  const failed = failedSrc !== null && failedSrc === src;

  if (failed && !fallbackSrc) return null;
  const current = failed && fallbackSrc ? fallbackSrc : src;
  const optimizable = typeof current === "string" ? isOptimizableImage(current) : true;

  return (
    <Image
      key={typeof current === "string" ? current : undefined}
      src={current}
      alt={alt}
      unoptimized={unoptimized || !optimizable}
      // An image that failed before hydration fired its error event too early for
      // React; detect it on mount instead.
      ref={(img) => {
        if (img && img.complete && img.naturalWidth === 0 && !failed && !/\.svg(\?|$)/i.test(img.currentSrc || img.src)) setFailedSrc(src);
      }}
      onError={(e) => {
        if (!failed) setFailedSrc(src);
        onError?.(e);
      }}
      {...rest}
    />
  );
}
