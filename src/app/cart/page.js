import CartView from "@/components/cart/CartView";
import { Breadcrumbs, Container } from "@/components/ui/Layout";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("Shopping Cart");

export default function CartPage() {
  return (
    <Container className="pt-8 pb-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
      <h1 className="mt-6 mb-8 text-3xl font-bold tracking-tight">Your cart</h1>
      <CartView />
    </Container>
  );
}
