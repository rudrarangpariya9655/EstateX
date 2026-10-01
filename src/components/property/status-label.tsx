import { STATUS_LABELS } from "@/lib/constants";
import type { PropertyStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

export function StatusLabel({ status, className }: { status: PropertyStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 eyebrow", status === "available" ? "text-accent" : "text-muted", className)}>
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          status === "available" && "bg-accent",
          status === "reserved" && "bg-[#9a7b4f]",
          status === "sold" && "bg-muted",
        )}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
