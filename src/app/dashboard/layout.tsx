import type { Metadata } from "next";
import { SideNav } from "@/components/dashboard/side-nav";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Dashboard · EstateX" },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/saved", label: "Saved homes" },
  { href: "/dashboard/visits", label: "Visit requests" },
  { href: "/dashboard/recent", label: "Recently viewed" },
  { href: "/dashboard/profile", label: "Profile" },
];

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser("/dashboard");
  return (
    <div className="container-site pb-32 pt-10 md:pb-40 md:pt-14">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-24">
        <aside className="min-w-0 lg:pt-2">
          <div className="lg:sticky lg:top-32">
            <p className="hidden truncate pb-6 text-[0.8125rem] text-muted lg:block">{user.email}</p>
            <SideNav items={NAV} label="Dashboard" root="/dashboard" />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
