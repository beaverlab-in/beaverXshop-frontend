import Image from "next/image";

/**
 * Product / category image. Local SVG placeholders are served as-is; R2/CDN photos go through
 * next/image optimisation (host allow-listed via NEXT_PUBLIC_MEDIA_HOST in next.config.mjs).
 * The parent decides the aspect ratio; this fills it.
 */
export default function ProductImage({ image, sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw", priority = false, className = "" }) {
  const isSvg = image.src.endsWith(".svg");
  return (
    <Image
      src={image.src}
      alt={image.alt ?? ""}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={isSvg}
      className={`object-cover ${className}`}
    />
  );
}
