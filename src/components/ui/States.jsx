import Button from "@/components/ui/Button";
import { AlertIcon } from "@/components/ui/Icons";

export function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-card border border-dashed border-line bg-surface px-6 py-14 text-center">
      {icon && <div className="mb-4 grid size-14 place-items-center rounded-full bg-subtle text-brand">{icon}</div>}
      <h2 className="text-xl font-bold">{title}</h2>
      {description && <p className="mt-2 text-muted">{description}</p>}
      {action && (
        <Button href={action.href} onClick={action.onClick} className="mt-6">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center rounded-card border border-danger/25 bg-surface px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-full bg-danger/10 text-danger-ink">
        <AlertIcon className="size-7" />
      </div>
      <h2 className="text-xl font-bold">{title}</h2>
      {description && <p className="mt-2 text-muted">{description}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-6">
          Try again
        </Button>
      )}
    </div>
  );
}
