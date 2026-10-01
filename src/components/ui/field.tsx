import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const inputClasses =
  "block h-12 w-full border border-line bg-surface px-4 text-[0.9375rem] text-ink placeholder:text-muted/70 transition-[border-color,box-shadow] duration-200 outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60 aria-invalid:border-danger aria-invalid:focus:ring-danger";

export function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | string[];
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const message = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-[0.8125rem] font-medium text-ink">
        <span>{label}</span>
        {optional ? <span className="text-[0.75rem] font-normal text-muted">Optional</span> : null}
      </label>
      {children}
      {hint && !message ? (
        <p id={`${id}-hint`} className="text-[0.8125rem] leading-snug text-muted">
          {hint}
        </p>
      ) : null}
      {message ? (
        <p id={`${id}-error`} className="text-[0.8125rem] leading-snug text-danger" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}

/** aria props connecting an input to its hint and error text. */
export function describedBy(id: string, error?: string | string[], hint?: unknown) {
  const hasError = Array.isArray(error) ? error.length > 0 : Boolean(error);
  return {
    "aria-invalid": hasError || undefined,
    "aria-describedby": hasError ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputClasses, "h-auto min-h-32 resize-y py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(inputClasses, "ex-select appearance-none pr-10", className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({ className, label, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem] text-ink", className)}>
      <input
        type="checkbox"
        className="ex-checkbox"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

export function FormMessage({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "border-l-2 px-4 py-3 text-[0.875rem] leading-relaxed",
        tone === "error" && "border-danger bg-danger-soft text-danger",
        tone === "success" && "border-accent bg-accent-soft text-accent",
        tone === "info" && "border-ink/30 bg-surface text-ink",
      )}
    >
      {children}
    </div>
  );
}
