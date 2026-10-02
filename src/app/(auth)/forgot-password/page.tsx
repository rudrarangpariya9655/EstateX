import type { Metadata } from "next";
import { AuthHeading, ForgotPasswordForm } from "@/components/auth/auth-forms";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Reset your password",
  description: "Request a link to reset your EstateX password.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading
        eyebrow="Password"
        title="Forgotten it?"
        body="Enter the email you signed up with and we'll send a link to choose a new password."
      />
      <ForgotPasswordForm />
    </>
  );
}
