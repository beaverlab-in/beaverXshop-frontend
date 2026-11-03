"use client";

import { useState } from "react";
import ProductImage from "@/components/product/ProductImage";

export default function Gallery({ images, title }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-line bg-tint">
        <ProductImage key={current.src} image={current} priority sizes="(min-width: 1024px) 55vw, 100vw" />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-3" aria-label={`${title} images`}>
          {images.map((img, i) => (
            <li key={img.src + i}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-pressed={i === index}
                className={`relative block aspect-[4/3] w-24 overflow-hidden rounded-md border-2 bg-tint transition-colors ${
                  i === index ? "border-brand" : "border-transparent hover:border-brand/40"
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
