import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Calm, typographic empty/error state used across the product. */
export function EmptyState({
  eyebrow,
  title,
  body,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start border-t border-line py-20 md:py-28", className)}>
      {eyebrow ? <p className="eyebrow text-muted">{eyebrow}</p> : null}
      <h2 className="mt-5 max-w-2xl text-h2">{title}</h2>
      {body ? <div className="mt-6 max-w-md text-[1rem] leading-relaxed text-muted">{body}</div> : null}
      {action ? <div className="mt-10">{action}</div> : null}
    </div>
  );
}
