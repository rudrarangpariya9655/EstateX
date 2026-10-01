import type { Metadata } from "next";
import { SideNav } from "@/components/dashboard/side-nav";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/data";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Admin · EstateX" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin("/admin");
  const stats = await getStore().getAdminStats();
  const nav = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/properties", label: "Properties", count: stats.properties },
    { href: "/admin/visits", label: "Visit requests", count: stats.pendingVisits },
    { href: "/admin/inquiries", label: "Inquiries", count: stats.inquiries },
    { href: "/admin/users", label: "Users", count: stats.users },
  ];
  return (
    <div className="container-site pb-32 pt-10 md:pb-40 md:pt-14">
      <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-20">
        <aside className="lg:pt-2">
          <div className="lg:sticky lg:top-32">
            <p className="eyebrow hidden pb-6 text-accent lg:block">Administration</p>
            <SideNav items={nav} label="Administration" root="/admin" />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
