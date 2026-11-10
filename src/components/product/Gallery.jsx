"use client";

import { useState } from "react";
import ProductImage from "@/components/product/ProductImage";
import { DemoImageLabel } from "@/components/product/ProductBits";

/**
 * Large image with a thumbnail strip. On a mouse the image zooms toward the pointer (hover); on touch it stays still.
 * Thumbnails sit under the image on phones and in a column beside it on desktop.
 */
export default function Gallery({ images, title, demoImage = false }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(null); // { x, y } in percent while the pointer is over the image
  const current = images[index] ?? images[0];

  function onMove(e) {
    if (e.pointerType === "touch" || current.fit === "contain") return;
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 lg:flex-row-reverse lg:items-start lg:gap-4">
      <div
        className="relative aspect-[4/3] min-w-0 flex-1 overflow-hidden rounded-card border border-line bg-subtle lg:cursor-zoom-in"
        onPointerMove={onMove}
        onPointerLeave={() => setZoom(null)}
      >
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out motion-reduce:transition-none"
          style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        >
          <ProductImage key={current.src} image={current} priority sizes="(min-width: 1024px) 50vw, 100vw" />
        </div>
        {demoImage && <DemoImageLabel className="absolute top-3 left-3" />}
      </div>
      {images.length > 1 && (
        <ul className="flex gap-3 lg:flex-col" aria-label={`${title} images`}>
          {images.map((img, i) => (
            <li key={img.src + i}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-pressed={i === index}
                className={`relative block aspect-[4/3] w-20 overflow-hidden rounded-md border-2 bg-subtle transition-colors lg:w-24 ${
                  i === index ? "border-brand" : "border-line hover:border-slate-400"
                }`}
              >
                <ProductImage image={{ ...img, alt: "" }} sizes="96px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
