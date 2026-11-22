import Image, { type ImageProps } from "next/image";
import { isOptimizableImage } from "./imageHosts";

/**
 * next/image for images whose URL comes from data (uploads, avatars, logos).
 * Known hosts are optimised; any other host is passed through `unoptimized`
 * instead of throwing "hostname is not configured".
 */
export default function SafeImage({ src, unoptimized, alt, ...rest }: ImageProps) {
  const optimizable = typeof src === "string" ? isOptimizableImage(src) : true;
  return <Image src={src} alt={alt} unoptimized={unoptimized || !optimizable} {...rest} />;
}
