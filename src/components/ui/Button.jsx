import Link from "next/link";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap select-none " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[var(--ease-brand)] " +
  "disabled:pointer-events-none disabled:opacity-50 active:translate-y-px motion-reduce:active:translate-y-0";

const variants = {
  primary: "bg-brand text-white shadow-card hover:bg-brand-dark",
  secondary: "border border-line bg-surface text-ink shadow-card hover:border-slate-300 hover:bg-subtle",
  ghost: "text-ink hover:bg-subtle",
  danger: "bg-danger text-white hover:bg-danger/90",
  inverse: "bg-white text-ink hover:bg-subtle", // on dark surfaces
};

const sizes = {
  sm: "min-h-10 px-4 text-sm",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-7 text-base",
};

export function buttonClasses({ variant = "primary", size = "md", className = "", block = false } = {}) {
  return [base, variants[variant], sizes[size], block ? "w-full" : "", className].filter(Boolean).join(" ");
}

/** Renders a <Link> when `href` is given, otherwise a <button>. */
export default function Button({
  href,
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  className = "",
  children,
  type = "button",
  ...props
}) {
  const classes = buttonClasses({ variant, size, className, block });
  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} disabled={loading || props.disabled} aria-busy={loading || undefined} {...props}>
      {loading && (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
