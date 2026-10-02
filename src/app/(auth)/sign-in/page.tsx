import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthHeading, DemoAccounts, SignInForm } from "@/components/auth/auth-forms";
import { getCurrentUser, safeNextPath } from "@/lib/auth";
import { DEMO_ACCOUNTS, demoAccountsEnabled } from "@/lib/auth/demo-accounts";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in to EstateX to keep your saved homes and visit requests in one place.",
  path: "/sign-in",
  noIndex: true,
});

const NOTICES: Record<string, { tone: "success" | "error" | "info"; text: string }> = {
  reset: { tone: "success", text: "Your password has been updated. Sign in with your new password." },
  link: { tone: "error", text: "That link is invalid or has expired. Please try again." },
};

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const params = await props.searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  if (await getCurrentUser()) redirect(next);

  const notice = params.reset ? NOTICES.reset : params.error === "link" ? NOTICES.link : undefined;

  return (
    <>
      <AuthHeading eyebrow="Welcome back" title="Sign in" body="Your saved homes, comparisons and visit requests, wherever you left them." />
      <SignInForm next={next} notice={notice} />
      {demoAccountsEnabled() ? (
        <DemoAccounts accounts={DEMO_ACCOUNTS.map(({ email, password, label }) => ({ email, password, label }))} next={next} />
      ) : null}
    </>
  );
}
