import { Suspense } from "react";
import AuthGate from "@/components/account/AuthGate";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";
import { Breadcrumbs, Container } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/States";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("Checkout");

export default function CheckoutPage() {
  return (
    <Container className="pt-8 pb-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
      <h1 className="mt-6 mb-8 text-3xl font-bold tracking-tight">Checkout</h1>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <AuthGate>
          <CheckoutFlow />
        </AuthGate>
      </Suspense>
    </Container>
  );
}
