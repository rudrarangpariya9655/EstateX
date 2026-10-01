"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { useFavorites, useSession } from "@/components/providers/session-provider";
import { AccountMenu } from "./account-menu";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { NAV_LINKS, hasOverlayHero, isActivePath } from "./nav";
import { SearchOverlay } from "./search-overlay";

export function SiteHeader() {
  const pathname = usePathname();
  const overlay = hasOverlayHero(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { status, user } = useSession();
  const favorites = useFavorites();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 24);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  // "/" opens search from anywhere (except while typing).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable=true]");
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const transparent = overlay && !scrolled && !menuOpen;
  const savedCount = favorites.ready ? favorites.ids.length : 0;

  return (
    <>
      <a
        href="#main"
        className="fixed left-4 top-3 z-[70] -translate-y-24 bg-ink px-4 py-3 text-sm text-ivory transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,color,backdrop-filter] duration-500 ease-out-expo",
          transparent
            ? "border-b border-transparent bg-transparent text-white"
            : "border-b border-line/80 bg-ivory/[0.88] text-ink backdrop-blur-md",
          !overlay && !scrolled && "border-transparent",
        )}
        data-on-dark={transparent || undefined}
      >
        <div
          className={cn(
            "container-site flex items-center justify-between gap-6 transition-[height] duration-500 ease-out-expo",
            scrolled ? "h-16" : "h-16 lg:h-[5.5rem]",
          )}
        >
          <Logo />

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-9 xl:gap-11">
              {NAV_LINKS.map((link) => {
                const active = isActivePath(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className="link-underline py-2 text-[0.75rem] font-medium uppercase tracking-[0.16em]"
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1 lg:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex size-11 items-center justify-center transition-opacity hover:opacity-70"
              aria-label="Search properties"
              aria-keyshortcuts="/"
            >
              <Search aria-hidden className="size-[1.15rem]" strokeWidth={1.4} />
            </button>
            <Link
              href="/saved"
              className="relative hidden size-11 items-center justify-center transition-opacity hover:opacity-70 lg:inline-flex"
              aria-label={savedCount ? `Saved homes (${savedCount})` : "Saved homes"}
            >
              <Heart aria-hidden className="size-[1.15rem]" strokeWidth={1.4} />
              {savedCount ? (
                <span className="absolute right-1 top-1.5 min-w-4 rounded-full bg-accent px-1 text-center text-[0.625rem] font-medium leading-4 text-ivory">
                  {savedCount}
                </span>
              ) : null}
            </Link>
            <div className="hidden min-w-[5.5rem] justify-end lg:flex">
              {status === "loading" ? (
                <span aria-hidden className="h-11 w-[5.5rem]" />
              ) : user ? (
                <AccountMenu user={user} />
              ) : (
                <Link
                  href={`/sign-in${pathname !== "/" && !pathname.startsWith("/sign") ? `?next=${encodeURIComponent(pathname)}` : ""}`}
                  className="link-underline px-2 py-2 text-[0.75rem] font-medium uppercase tracking-[0.16em]"
                >
                  Sign in
                </Link>
              )}
            </div>
            <Link
              href="/list-property"
              className={cn(
                "ml-3 hidden h-10 items-center border px-5 text-[0.7rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300 xl:inline-flex",
                transparent
                  ? "border-white/60 hover:bg-white hover:text-ink"
                  : "border-ink/30 hover:border-ink hover:bg-ink hover:text-ivory",
              )}
            >
              List property
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="-mr-2 inline-flex size-11 items-center justify-center lg:hidden"
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
            >
              <Menu aria-hidden className="size-6" strokeWidth={1.25} />
            </button>
          </div>
        </div>
      </header>
      {/* Offsets content below the fixed header on pages without a full-bleed hero. */}
      {!overlay ? <div aria-hidden className="h-16 lg:h-[5.5rem]" /> : null}

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} savedCount={savedCount} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
