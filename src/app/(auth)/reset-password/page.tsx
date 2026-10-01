import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading, ResetPasswordForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseEnabled } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Choose a new password",
  description: "Choose a new password for your EstateX account.",
  path: "/reset-password",
  noIndex: true,
});

export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const params = await props.searchParams;
  const token = typeof params.token === "string" ? params.token.slice(0, 200) : undefined;
  // Supabase signs the visitor in with a recovery session via /auth/callback; demo mode uses a token.
  const valid = isSupabaseEnabled ? Boolean(await getCurrentUser()) : Boolean(token);

  return (
    <>
      <AuthHeading eyebrow="Password" title="Choose a new password" />
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="flex flex-col gap-6">
          <p className="text-[0.9375rem] leading-relaxed text-muted">
            This reset link is invalid or has expired. Reset links can be used once and last 30 minutes.
          </p>
          <Link href="/forgot-password" className="text-[0.875rem] underline underline-offset-4">
            Request a new link
          </Link>
        </div>
      )}
    </>
  );
}
