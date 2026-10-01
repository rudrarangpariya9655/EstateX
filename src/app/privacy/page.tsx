import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy",
  description: "How EstateX handles the information you share with it.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy notice"
      updated="1 October 2026"
      intro={
        <p>
          EstateX is a portfolio demonstration. This notice describes how the application handles data so that its
          behaviour is transparent — it is not legal advice and should be reviewed before any commercial use.
        </p>
      }
      sections={[
        {
          heading: "What we collect",
          body: (
            <>
              <p>Account details you provide (name, email, optional phone number) and a securely hashed password, managed by the authentication provider.</p>
              <p>Homes you save, visit requests and messages you send, and — when signed in — the residences you have recently viewed.</p>
            </>
          ),
        },
        {
          heading: "How it is used",
          body: <p>Only to provide the features you use: keeping your saved homes, answering your requests and showing your recent activity. Nothing is sold or shared for marketing.</p>,
        },
        {
          heading: "On your device",
          body: <p>If you are not signed in, saved homes and your comparison list are kept in your browser&apos;s local storage. A strictly necessary cookie keeps you signed in.</p>,
        },
        {
          heading: "Your choices",
          body: <p>You can update your profile, remove saved homes or cancel visit requests from your dashboard at any time.</p>,
        },
      ]}
    />
  );
}
