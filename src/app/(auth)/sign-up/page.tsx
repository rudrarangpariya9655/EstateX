import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthHeading, SignUpForm } from "@/components/auth/auth-forms";
import { getCurrentUser, safeNextPath } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Create an account",
  description: "Create an EstateX account to save homes and track visit requests.",
  path: "/sign-up",
  noIndex: true,
});

export default async function SignUpPage(props: PageProps<"/sign-up">) {
  const params = await props.searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  if (await getCurrentUser()) redirect(next);

  return (
    <>
      <AuthHeading
        eyebrow="Create an account"
        title="Keep your search in one place"
        body="Save homes across devices and follow every visit request. No newsletters unless you ask."
      />
      <SignUpForm next={next} />
    </>
  );
}
