import Button from "@/components/ui/Button";
import { Container } from "@/components/ui/Layout";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-3 text-5xl font-extrabold text-brand">We couldn&apos;t find that page</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-muted">The link may be broken or the page may have moved. Let&apos;s get you back to building.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/" size="lg">Back to the store</Button>
      </div>
    </Container>
  );
}
