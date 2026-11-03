import Image from "next/image";

const tiles = [
  { src: "/placeholders/kit.svg", alt: "", className: "left-[4%] top-[8%] w-[52%] -rotate-3 [animation:float-slow_7s_ease-in-out_infinite]" },
  { src: "/placeholders/robot.svg", alt: "", className: "right-[4%] top-[22%] w-[44%] rotate-2 [animation:float-slow_8s_ease-in-out_-2s_infinite]" },
  { src: "/placeholders/board.svg", alt: "", className: "left-[22%] bottom-[6%] w-[48%] rotate-1 [animation:float-slow_9s_ease-in-out_-4s_infinite]" },
];

/** Hero composition built from placeholder illustrations; swap tiles for real product photography when available. */
export default function HeroArt() {
  return (
    <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[2rem] bg-night" role="img" aria-label="A composition of an electronics kit, a robot kit and a development board">
      <svg className="absolute inset-0 size-full opacity-60" viewBox="0 0 500 400" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="#2c5a47" strokeWidth="2">
          <path d="M0 80h120l30 30h90M0 160h80l40 40h140l30-30h160M0 300h160l30-30h110l40 40h160M330 0v70l30 30h140M200 400v-60l30-30" />
        </g>
        <g fill="#E9A23B" opacity=".9">
          <circle cx="120" cy="80" r="4" />
          <circle cx="330" cy="170" r="4" />
          <circle cx="190" cy="270" r="4" />
          <circle cx="360" cy="100" r="4" />
        </g>
      </svg>
      {tiles.map((t) => (
        <div
          key={t.src}
          className={`absolute aspect-[4/3] overflow-hidden rounded-2xl border-4 border-canvas/90 bg-tint shadow-lift ${t.className}`}
        >
          <Image src={t.src} alt={t.alt} fill sizes="(min-width: 1024px) 30vw, 60vw" unoptimized className="object-cover" priority />
        </div>
      ))}
      <div className="absolute right-5 bottom-5 rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-ink shadow-card">Learn by building</div>
    </div>
  );
}
