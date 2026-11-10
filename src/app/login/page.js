import { Suspense } from "react";
import LoginFlow from "@/components/account/LoginFlow";
import { Container } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/States";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("Log in or sign up");

export default function LoginPage() {
  return (
    <Container className="py-12 md:py-20">
      <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-md" />}>
        <LoginFlow />
      </Suspense>
    </Container>
  );
}
