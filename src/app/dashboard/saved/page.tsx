import type { Metadata } from "next";
import { PanelHeading } from "@/components/dashboard/side-nav";
import { SavedCollection } from "@/components/saved/saved-collection";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Saved homes" };

export default async function DashboardSavedPage() {
  await requireUser("/dashboard/saved");
  return (
    <>
      <PanelHeading title="Saved homes" description="Saved to your account and available on every device you sign in to." />
      <SavedCollection headingLevel="h2" />
    </>
  );
}
