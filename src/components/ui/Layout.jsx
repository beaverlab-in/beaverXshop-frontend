import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/Icons";

export function Container({ className = "", as: Tag = "div", children, ...props }) {
  return (
    <Tag className={`container-page ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export function Section({ className = "", id, children, tone = "canvas", ...props }) {
  const bg = tone === "surface" ? "bg-surface" : tone === "tint" ? "bg-tint/50" : tone === "night" ? "bg-night text-white" : "";
  return (
    <section id={id} className={`py-16 md:py-24 ${bg} ${className}`} {...props}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, description, align = "left", as: Tag = "h2", className = "" }) {
  return (
    <div className={`${align === "center" ? "mx-auto text-center" : ""} max-w-2xl ${className}`}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <Tag className="text-3xl leading-tight font-bold md:text-4xl">{title}</Tag>
      {description && <p className="mt-4 text-lg leading-relaxed text-muted">{description}</p>}
    </div>
  );
}

export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.href ?? item.label} className="flex items-center gap-1.5">
              {last || !item.href ? (
                <span aria-current={last ? "page" : undefined} className={last ? "font-medium text-ink" : ""}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="rounded underline-offset-4 hover:text-brand hover:underline">
                  {item.label}
                </Link>
              )}
              {!last && <ChevronRightIcon className="size-3.5 text-muted/60" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Badge({ tone = "neutral", children, className = "" }) {
  const tones = {
    neutral: "bg-tint text-brand",
    success: "bg-success/12 text-[#14573a]",
    warning: "bg-accent/25 text-[#7a4d05]",
    danger: "bg-danger/10 text-danger",
    info: "bg-brand/10 text-brand",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Card({ className = "", children, as: Tag = "div", ...props }) {
  return (
    <Tag className={`rounded-card border border-line bg-surface shadow-card ${className}`} {...props}>
      {children}
    </Tag>
  );
}
