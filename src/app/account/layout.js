import { Suspense } from "react";
import AccountNav from "@/components/account/AccountNav";
import AuthGate from "@/components/account/AuthGate";
import { Container } from "@/components/ui/Layout";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("My Account");

export default function AccountLayout({ children }) {
  return (
    <Container className="grid gap-8 pt-8 pb-8 lg:grid-cols-[14rem_1fr] lg:gap-12">
      <Suspense fallback={<div className="h-12" />}>
        <AccountNav />
      </Suspense>
      <div className="min-w-0">
        <Suspense fallback={null}>
          <AuthGate>{children}</AuthGate>
        </Suspense>
      </div>
    </Container>
  );
}
