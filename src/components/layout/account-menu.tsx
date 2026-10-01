"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useTransition } from "react";
import { signOutAction } from "@/app/actions/auth";
import { useSession, type ClientUser } from "@/components/providers/session-provider";
import { initials } from "@/lib/format";

const LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/saved", label: "Saved homes" },
  { href: "/dashboard/visits", label: "Visit requests" },
  { href: "/dashboard/recent", label: "Recently viewed" },
  { href: "/dashboard/profile", label: "Profile" },
];

/** Account dropdown using the native Popover API (light-dismiss and Escape built in). */
export function AccountMenu({ user }: { user: ClientUser }) {
  const id = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { refresh } = useSession();
  const [pending, startTransition] = useTransition();

  const close = () => popoverRef.current?.hidePopover?.();

  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        className="inline-flex h-11 items-center gap-2.5 pl-2"
        aria-label={`Account menu for ${user.fullName || user.email}`}
      >
        <span className="inline-flex size-8 items-center justify-center rounded-full border border-current text-[0.7rem] font-medium tracking-wider">
          {initials(user.fullName || user.email)}
        </span>
      </button>
      <div
        id={id}
        ref={popoverRef}
        popover="auto"
        className="fixed inset-auto right-[clamp(1.25rem,0.6rem+3.2vw,4.5rem)] top-[4.75rem] m-0 w-64 border border-line bg-surface p-0 text-ink shadow-[0_24px_48px_-28px_rgb(21_21_21/0.45)]"
      >
        <div className="border-b border-line px-5 py-4">
          <p className="truncate text-[0.9375rem] font-medium">{user.fullName || "Your account"}</p>
          <p className="truncate text-[0.8125rem] text-muted">{user.email}</p>
        </div>
        <ul className="py-2">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={close}
                className="flex min-h-11 items-center px-5 text-[0.875rem] transition-colors hover:bg-ink/[0.04]"
              >
                {link.label}
              </Link>
            </li>
          ))}
          {user.role === "admin" ? (
            <li className="mt-1 border-t border-line pt-1">
              <Link
                href="/admin"
                onClick={close}
                className="flex min-h-11 items-center justify-between px-5 text-[0.875rem] transition-colors hover:bg-ink/[0.04]"
              >
                Administration
                <span className="eyebrow text-accent">Admin</span>
              </Link>
            </li>
          ) : null}
        </ul>
        <div className="border-t border-line p-2">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await signOutAction();
                close();
                await refresh();
                router.push("/");
                router.refresh();
              })
            }
            className="flex min-h-11 w-full items-center px-3 text-left text-[0.875rem] text-muted transition-colors hover:bg-ink/[0.04] hover:text-ink"
          >
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </>
  );
}
