import Link from "next/link";
import { BackToTop } from "./back-to-top";
import { DEMO_NOTICE } from "@/lib/constants";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/properties", label: "Properties" },
      { href: "/neighborhoods", label: "Neighborhoods" },
      { href: "/collections", label: "Collections" },
      { href: "/compare", label: "Compare" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/list-property", label: "List a property" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/saved", label: "Saved" },
      { href: "/sign-in", label: "Sign in" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="on-dark overflow-hidden bg-ink text-ivory" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Site footer
      </h2>
      <div className="container-site pt-24 md:pt-32">
        <div className="grid gap-16 md:grid-cols-12 md:gap-10">
          <p className="font-serif text-[2.25rem] leading-[1.02] md:col-span-5 md:text-[3rem]">
            Exceptional homes.
            <br />
            <em className="text-ivory/60">Thoughtfully discovered.</em>
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 md:col-span-6 md:col-start-7">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="eyebrow text-ivory/50">{col.title}</h3>
                <ul className="mt-5 flex flex-col">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex min-h-10 items-center text-[0.9375rem] text-ivory/85 transition-colors hover:text-ivory"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p
          aria-hidden
          className="mt-24 select-none whitespace-nowrap text-center font-sans text-[16.5vw] font-medium leading-[0.8] tracking-[0.04em] text-ivory/[0.92] md:mt-32 3xl:text-[19rem]"
        >
          ESTATEX
        </p>

        <div className="mt-12 flex flex-col gap-6 border-t border-ivory/15 py-8 text-[0.8125rem] text-ivory/60 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>© 2026 EstateX</span>
            <Link href="/privacy" className="hover:text-ivory">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ivory">
              Terms
            </Link>
          </div>
          <p className="max-w-xl text-[0.75rem] leading-relaxed text-ivory/45 md:text-center">{DEMO_NOTICE}</p>
          <BackToTop />
        </div>
      </div>
    </footer>
  );
}
