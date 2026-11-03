import Image from "next/image";
import { PLACEHOLDER_IMAGE } from "@/lib/product";

/**
 * Product / category image. Local SVG placeholders are served as-is; R2/CDN photos go through
 * next/image optimisation (host allow-listed via NEXT_PUBLIC_MEDIA_HOST in next.config.mjs).
 * A missing image (a product with no photos yet) falls back to the placeholder instead of crashing the page.
 * The parent decides the aspect ratio; this fills it.
 */
export default function ProductImage({ image, sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw", priority = false, className = "" }) {
  const src = image?.src || PLACEHOLDER_IMAGE.src;
  const alt = image?.src ? (image.alt ?? "") : (image?.alt ?? "");
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={src.endsWith(".svg")}
      className={`object-cover ${className}`}
    />
  );
}
