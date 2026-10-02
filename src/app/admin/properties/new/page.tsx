import type { Metadata } from "next";
import { PropertyForm } from "@/components/admin/property-form";
import { PanelHeading } from "@/components/dashboard/side-nav";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/data";

export const metadata: Metadata = { title: "New property" };

export default async function NewPropertyPage() {
  await requireAdmin("/admin/properties/new");
  const agents = await getStore().listAgents();
  return (
    <>
      <PanelHeading title="New property" description="Everything here is validated again on the server before it is saved." />
      <PropertyForm agents={agents} />
    </>
  );
}
