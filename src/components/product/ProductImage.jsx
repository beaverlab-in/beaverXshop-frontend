import Image from "next/image";
import { PLACEHOLDER_IMAGE } from "@/lib/product";

/**
 * Product / category image. Local files and SVGs are served as-is; R2/CDN photos go through
 * next/image optimisation (host allow-listed via NEXT_PUBLIC_MEDIA_HOST in next.config.mjs).
 * A missing image (a product with no photos yet) falls back to the placeholder instead of crashing the page.
 * The parent decides the box and aspect ratio; this fills it.
 *
 * Fit: photographs fill the box (`cover`). An image can ask for `fit: "contain"` (very wide or very tall hardware shots)
 * so nothing is cropped; it then sits on the box's own background with a little padding.
 */
export default function ProductImage({ image, sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw", priority = false, className = "", fit }) {
  const src = image?.src || PLACEHOLDER_IMAGE.src;
  const alt = image?.src ? (image.alt ?? "") : (image?.alt ?? "");
  const contain = (fit ?? image?.fit) === "contain" || !image?.src; // the `fit` prop overrides the image's own (the homepage showcase always fills its panel)
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={src.endsWith(".svg")}
      className={`${contain ? "object-contain p-3" : "object-cover"} ${className}`}
    />
  );
}
