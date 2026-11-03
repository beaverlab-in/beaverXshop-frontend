import Link from "next/link";
import Button from "@/components/ui/Button";
import { Section, SectionHeading } from "@/components/ui/Layout";
import { ArrowRightIcon, BookIcon, ChipIcon, GlobeIcon, SparkIcon, WrenchIcon } from "@/components/ui/Icons";
import HeroArt from "@/components/site/HeroArt";
import ProductCard from "@/components/product/ProductCard";
import ProductImage from "@/components/product/ProductImage";
import { getCategories, getProducts } from "@/lib/data/catalog";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ path: "/" });

const reasons = [
  { icon: WrenchIcon, title: "Practical learning", text: "Every product comes with projects you actually finish and use." },
  { icon: ChipIcon, title: "Beginner-friendly electronics", text: "Clear guides that start from zero. No prior experience needed." },
  { icon: SparkIcon, title: "Hands-on experiments", text: "Build, test, break and fix. Understanding comes from doing." },
  { icon: GlobeIcon, title: "Real-world IoT", text: "Connect your builds to the internet and see how modern devices work." },
  { icon: BookIcon, title: "Learning through building", text: "Concepts are introduced exactly when a project needs them." },
];

const steps = [
  { n: "01", title: "Build", text: "Assemble circuits and mechanisms with guided, step-by-step instructions." },
  { n: "02", title: "Program", text: "Bring it to life with code, starting with visual blocks and moving to real programming." },
  { n: "03", title: "Understand", text: "See why it works. Each project ends with what you learned and where to go next." },
];

export default async function HomePage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const featured = [...products].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0)).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24">
        <div className="container-page grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="eyebrow mb-4">Educational electronics, robotics &amp; IoT</p>
            <h1 className="text-5xl leading-[1.05] font-extrabold text-brand md:text-6xl lg:text-[4.25rem]">
              Build. Explore. Learn. Create.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted md:text-xl">
              Making electronics, robotics, and IoT learning simple through hands-on innovation.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="/products" size="lg">
                Explore Products <ArrowRightIcon className="size-4" />
              </Button>
              <Button href="/#learning" variant="secondary" size="lg">
                Start Learning
              </Button>
            </div>
          </div>
          <HeroArt />
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <Section tone="surface" aria-labelledby="categories-heading">
          <SectionHeading
            eyebrow="The ecosystem"
            title={<span id="categories-heading">Everything you need to learn by making</span>}
            description="A small, focused range. Each product is designed to work on its own and with the others."
          />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/products#${c.slug}`}
                  className="card-hover group block h-full rounded-card border border-line bg-canvas p-3 shadow-card"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[0.9rem] bg-tint">
                    <div className="media-zoom absolute inset-0">
                      <ProductImage image={{ src: c.image, alt: "" }} sizes="(min-width: 1024px) 25vw, 50vw" />
                    </div>
                  </div>
                  <div className="px-2 pt-4 pb-2">
                    <h3 className="text-lg font-bold">{c.name}</h3>
                    <p className="mt-1 text-sm text-muted">{c.tagline}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Featured products */}
      <Section aria-labelledby="featured-heading">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Featured" title={<span id="featured-heading">Start with these</span>} />
          <Link href="/products" className="inline-flex items-center gap-1.5 font-semibold text-brand underline-offset-4 hover:underline">
            View all products <ArrowRightIcon className="size-4" />
          </Link>
        </div>
        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <li key={p.slug}>
              <ProductCard product={p} priority={i === 0} />
            </li>
          ))}
        </ul>
      </Section>

      {/* Why choose us */}
      <Section tone="tint" aria-labelledby="why-heading">
        <SectionHeading eyebrow="Why choose us" title={<span id="why-heading">Learning that sticks, because you built it</span>} />
        <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
          {reasons.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="grid size-12 place-items-center rounded-2xl bg-brand text-white">
                <Icon className="size-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Learning experience */}
      <Section id="learning" aria-labelledby="learning-heading" className="scroll-mt-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <SectionHeading
            eyebrow="The learning experience"
            title={<span id="learning-heading">From first circuit to connected project</span>}
            description="Our products follow one simple loop. Students build something real, make it work with code, then understand the idea behind it."
          />
          <ol className="grid gap-4">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-5 rounded-card border border-line bg-surface p-6 shadow-card">
                <span className="font-display text-3xl font-extrabold text-[#8a5a00] tabular-nums">{s.n}</span>
                <div>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="mt-1 text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Final CTA */}
      <section className="pb-8">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-[2rem] bg-brand px-6 py-16 text-center text-white md:py-20">
            <div aria-hidden="true" className="absolute -top-16 -right-16 size-64 rounded-full bg-accent/90" />
            <div aria-hidden="true" className="absolute -bottom-24 -left-10 size-72 rounded-full bg-night/50" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold md:text-5xl">Ready to build something?</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
                Pick a kit, follow the guide, and see your first project come to life.
              </p>
              <Button href="/products" variant="accent" size="lg" className="mt-8">
                Explore the product ecosystem <ArrowRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
