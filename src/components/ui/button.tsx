import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "outline" | "light" | "outline-light" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-3 whitespace-nowrap label-caps select-none transition-[background-color,color,border-color,opacity] duration-300 ease-out-expo disabled:pointer-events-none disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-ivory hover:bg-accent",
  accent: "bg-accent text-ivory hover:bg-accent-hover",
  outline: "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-ivory",
  light: "bg-ivory text-ink hover:bg-white",
  "outline-light": "border border-white/55 text-white hover:border-white hover:bg-white hover:text-ink",
  ghost: "text-ink hover:bg-ink/[0.05]",
  danger: "bg-danger text-white hover:bg-[#7f2a1e]",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-5 text-[0.7rem]",
  md: "h-12 px-7",
  lg: "h-14 px-9",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  loading?: boolean;
}

export function Button({ variant, size, arrow, loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, size, className: cn(arrow && "arrow-nudge", className) })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
      {arrow && !loading ? <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} /> : null}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
}

export function ButtonLink({ variant, size, arrow, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, className: cn(arrow && "arrow-nudge", className) })} {...props}>
      {children}
      {arrow ? <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} /> : null}
    </Link>
  );
}

/** Understated text link with an arrow — the default call to action in editorial sections. */
export function ArrowLink({
  className,
  children,
  tone = "ink",
  ...props
}: ComponentProps<typeof Link> & { tone?: "ink" | "light"; children: ReactNode }) {
  return (
    <Link
      className={cn(
        "arrow-nudge group/link inline-flex items-center gap-2.5 border-b pb-1.5 label-caps transition-colors duration-300",
        tone === "ink" ? "border-ink/30 text-ink hover:border-ink" : "border-white/50 text-white hover:border-white",
        className,
      )}
      {...props}
    >
      {children}
      <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-4 animate-spin rounded-full border-[1.5px] border-current border-r-transparent", className)}
    />
  );
}
