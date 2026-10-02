import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="EstateX — home"
      className={cn("inline-flex min-h-11 items-center font-sans text-[0.95rem] font-medium tracking-[0.34em]", className)}
    >
      ESTATE<span className="tracking-normal">X</span>
    </Link>
  );
}
