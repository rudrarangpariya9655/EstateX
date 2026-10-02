import type { Metadata } from "next";
import { PanelHeading } from "@/components/dashboard/side-nav";
import { ChangePasswordForm, ProfileForm } from "@/components/dashboard/profile-forms";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile" };

export default async function DashboardProfilePage() {
  const user = await requireUser("/dashboard/profile");
  return (
    <>
      <PanelHeading title="Profile" description="How your advisor will address and reach you." />
      <section aria-labelledby="details-heading">
        <h2 id="details-heading" className="mb-8 text-[1.0625rem] font-medium">
          Your details
        </h2>
        <ProfileForm fullName={user.fullName} phone={user.phone} email={user.email} />
      </section>
      <section aria-labelledby="password-heading" className="mt-20 border-t border-line pt-14 md:mt-24">
        <h2 id="password-heading" className="mb-8 text-[1.0625rem] font-medium">
          Password
        </h2>
        <ChangePasswordForm />
      </section>
    </>
  );
}
