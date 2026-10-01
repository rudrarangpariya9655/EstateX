"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useFavorites } from "@/components/providers/session-provider";
import { cn } from "@/lib/cn";

export function FavoriteButton({
  propertyId,
  name,
  className,
  variant = "overlay",
}: {
  propertyId: string;
  name: string;
  className?: string;
  variant?: "overlay" | "inline";
}) {
  const favorites = useFavorites();
  const saved = favorites.has(propertyId);
  const [pulse, setPulse] = useState(false);

  const onClick = () => {
    if (!saved) {
      setPulse(true);
      window.setTimeout(() => setPulse(false), 450);
    }
    void favorites.toggle({ id: propertyId, name });
  };

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={cn(
          "inline-flex h-12 items-center gap-2.5 border px-5 label-caps transition-colors duration-300",
          saved ? "border-ink bg-ink text-ivory" : "border-ink/25 hover:border-ink",
          className,
        )}
      >
        <Heart
          aria-hidden
          className={cn("size-4 transition-transform duration-300", pulse && "scale-125", saved && "fill-current")}
          strokeWidth={1.5}
        />
        {saved ? "Saved" : "Save"}
        <span className="sr-only"> {name}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from saved homes` : `Save ${name}`}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full bg-ivory/90 text-ink backdrop-blur-sm transition-[background-color,transform] duration-300 ease-out-expo hover:scale-105 hover:bg-ivory",
        className,
      )}
    >
      <Heart
        aria-hidden
        className={cn(
          "size-[1.1rem] transition-[transform,color,fill] duration-300 ease-out-expo",
          pulse && "scale-125",
          saved && "fill-accent text-accent",
        )}
        strokeWidth={1.5}
      />
    </button>
  );
}
