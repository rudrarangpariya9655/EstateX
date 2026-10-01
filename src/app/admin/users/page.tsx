import type { Metadata } from "next";
import { RoleToggle } from "@/components/admin/role-toggle";
import { PanelHeading } from "@/components/dashboard/side-nav";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { formatDate, initials } from "@/lib/format";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const admin = await requireAdmin("/admin/users");
  const users = await getStore().listUsers();
  return (
    <>
      <PanelHeading title="Users" description="Everyone with an EstateX account. Roles are enforced on the server and in the database." />
      {users.length === 0 ? (
        <p className="border-t border-line py-16 font-serif text-[1.75rem]">No users yet.</p>
      ) : (
        <ul className="border-t border-line">
          {users.map((u) => (
            <li key={u.id} className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-5 gap-y-3 border-b border-line py-5 md:grid-cols-[2.75rem_minmax(0,1fr)_8rem_8rem_9rem]">
              <span aria-hidden className="inline-flex size-11 items-center justify-center rounded-full border border-line text-[0.75rem] font-medium tracking-wider">
                {initials(u.fullName || u.email)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[0.9375rem] font-medium">
                  {u.fullName || "—"} {u.id === admin.id ? <span className="font-normal text-muted">(you)</span> : null}
                </p>
                <p className="truncate text-[0.8125rem] text-muted">{u.email}</p>
              </div>
              <p className="col-start-2 text-[0.8125rem] md:col-start-auto">
                <span className={u.role === "admin" ? "eyebrow text-accent" : "eyebrow text-muted"}>{u.role === "admin" ? "Admin" : "Member"}</span>
              </p>
              <p className="col-start-2 text-[0.8125rem] text-muted md:col-start-auto">Joined {formatDate(u.createdAt, { month: "short", year: "numeric" })}</p>
              <div className="col-start-2 md:col-start-auto md:text-right">
                {u.id === admin.id ? null : <RoleToggle userId={u.id} name={u.fullName || u.email} role={u.role} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
