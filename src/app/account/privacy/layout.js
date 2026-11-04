import { PrivacyTabs } from "@/components/account/privacy/shared";

export const metadata = { title: "Privacy" };

export default function PrivacyLayout({ children }) {
  return (
    <>
      <PrivacyTabs />
      {children}
    </>
  );
}
