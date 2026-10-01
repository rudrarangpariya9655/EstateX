import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-site grid min-h-[70dvh] content-center gap-12 py-24 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-8">
        <p className="eyebrow text-muted">404 · Page not found</p>
        <h1 className="mt-6 text-display">
          This address
          <br />
          <em>doesn&apos;t exist.</em>
        </h1>
      </div>
      <div className="flex flex-col items-start gap-8 lg:col-span-4 lg:pb-4">
        <p className="max-w-sm text-[1rem] leading-relaxed text-muted">
          The page may have moved, or the link may be mistyped. The homes are still where we left them.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/properties" arrow>
            Explore properties
          </ButtonLink>
          <ButtonLink href="/" variant="outline">
            Home
          </ButtonLink>
        </div>
        <Link href="/contact" className="hit-area text-[0.875rem] text-muted underline underline-offset-4 hover:text-ink">
          Or tell us what you were looking for
        </Link>
      </div>
    </div>
  );
}
