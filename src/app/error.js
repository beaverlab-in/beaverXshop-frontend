"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";
import { Container } from "@/components/ui/Layout";

// Customers never see stack traces or internal messages; details go to the console/log pipeline only.
export default function GlobalRouteError({ error, unstable_retry }) {
  useEffect(() => {
    console.error("[route error]", error?.digest ?? "", error?.message);
  }, [error]);

  return (
    <Container className="py-24 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 text-4xl font-extrabold text-brand">We hit a problem loading this page</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-muted">This is on our side. Please try again, and if it keeps happening, let us know.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => unstable_retry?.()} size="lg">Try again</Button>
        <Button href="/contact" variant="secondary" size="lg">Contact support</Button>
      </div>
    </Container>
  );
}
