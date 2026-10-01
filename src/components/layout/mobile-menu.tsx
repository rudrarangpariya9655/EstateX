"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { X } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { useCompare } from "@/components/providers/compare-provider";
import { useSession } from "@/components/providers/session-provider";
import { Dialog } from "@/components/ui/dialog";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";
import { NAV_LINKS, isActivePath } from "./nav";

export function MobileMenu({ open, onClose, savedCount }: { open: boolean; onClose: () => void; savedCount: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, refresh } = useSession();
  const compare = useCompare();
  const [pending, startTransition] = useTransition();

  // Close when navigation completes.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const links = [...NAV_LINKS, { href: "/contact", label: "Contact" }];

  return (
    <Dialog open={open} onClose={onClose} title="Menu" variant="fullscreen" hideTitle bodyClassName="p-0 sm:p-0">
      <div className="flex min-h-full flex-col">
        <div className="container-site flex h-16 shrink-0 items-center justify-between">
          <Logo onClick={onClose} />
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 inline-flex size-11 items-center justify-center"
            aria-label="Close menu"
          >
            <X aria-hidden className="size-6" strokeWidth={1.25} />
          </button>
        </div>

        <nav aria-label="Mobile" className="container-site flex flex-1 flex-col justify-between gap-12 pb-10 pt-10">
          <ul className="flex flex-col gap-1">
            {links.map((link, i) => (
              <li key={link.href} className="animate-fade-up" style={{ animationDelay: `${80 + i * 60}ms` }}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  aria-current={isActivePath(pathname, link.href) ? "page" : undefined}
                  className={cn(
                    "block py-1.5 font-serif text-[2.6rem] leading-[1.05] transition-opacity",
                    isActivePath(pathname, link.href) ? "opacity-100" : "opacity-90 hover:opacity-60",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-8 animate-fade-in" style={{ animationDelay: "320ms" }}>
            <ul className="grid grid-cols-2 gap-x-6 border-t border-line pt-6 text-[0.9375rem]">
              <li>
                <Link href="/saved" onClick={onClose} className="flex min-h-11 items-center">
                  Saved{savedCount ? ` (${savedCount})` : ""}
                </Link>
              </li>
              <li>
                <Link
                  href={compare.items.length ? `/compare?ids=${compare.items.map((i) => i.id).join(",")}` : "/compare"}
                  onClick={onClose}
                  className="flex min-h-11 items-center"
                >
                  Compare{compare.items.length ? ` (${compare.items.length})` : ""}
                </Link>
              </li>
              {user ? (
                <>
                  <li>
                    <Link href="/dashboard" onClick={onClose} className="flex min-h-11 items-center">
                      Dashboard
                    </Link>
                  </li>
                  {user.role === "admin" ? (
                    <li>
                      <Link href="/admin" onClick={onClose} className="flex min-h-11 items-center">
                        Administration
                      </Link>
                    </li>
                  ) : null}
                  <li>
                    <button
                      type="button"
                      disabled={pending}
                      className="flex min-h-11 items-center text-muted"
                      onClick={() =>
                        startTransition(async () => {
                          await signOutAction();
                          await refresh();
                          onClose();
                          router.push("/");
                          router.refresh();
                        })
                      }
                    >
                      {pending ? "Signing out…" : "Sign out"}
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link href="/sign-in" onClick={onClose} className="flex min-h-11 items-center">
                    Sign in
                  </Link>
                </li>
              )}
            </ul>
            <Link href="/list-property" onClick={onClose} className={buttonClasses({ variant: "primary", className: "w-full" })}>
              List your property
            </Link>
          </div>
        </nav>
      </div>
    </Dialog>
  );
}
