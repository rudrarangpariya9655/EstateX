import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyForm } from "@/components/admin/property-form";
import { PanelHeading } from "@/components/dashboard/side-nav";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { uuidSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Edit property" };

export default async function EditPropertyPage(props: PageProps<"/admin/properties/[id]/edit">) {
  const { id } = await props.params;
  await requireAdmin(`/admin/properties/${id}/edit`);
  if (!uuidSchema.safeParse(id).success) notFound();
  const store = getStore();
  const [property, agents] = await Promise.all([store.getPropertyById(id), store.listAgents()]);
  if (!property) notFound();
  return (
    <>
      <PanelHeading
        title={property.name}
        description="Edit details, photographs and publishing. Saving updates the live page immediately."
        actions={
          <Link href={`/properties/${property.slug}`} className="inline-flex min-h-11 items-center text-[0.875rem] underline underline-offset-4">
            View live page ↗
          </Link>
        }
      />
      <PropertyForm property={property} agents={agents} />
    </>
  );
}
