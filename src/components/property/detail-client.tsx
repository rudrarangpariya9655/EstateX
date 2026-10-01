"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { FavoriteButton } from "./favorite-button";

/** Records the view for signed-in users ("Recently viewed" in the dashboard). */
export function RecordView({ propertyId }: { propertyId: string }) {
  const { status, user } = useSession();
  useEffect(() => {
    if (status !== "ready" || !user) return;
    void fetch("/api/recently-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId }),
      keepalive: true,
    }).catch(() => undefined);
  }, [status, user, propertyId]);
  return null;
}

export function ShareButton({ title, className }: { title: string; className?: string }) {
  const { notify } = useToast();
  return (
    <button
      type="button"
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) {
            await navigator.share({ title, url });
            return;
          }
          await navigator.clipboard.writeText(url);
          notify("Link copied to your clipboard.");
        } catch (error) {
          if ((error as Error).name !== "AbortError") notify("Couldn't share this page — copy the address bar instead.", { tone: "error" });
        }
      }}
      className={cn(
        "inline-flex h-12 items-center gap-2.5 border border-ink/25 px-5 label-caps transition-colors duration-300 hover:border-ink",
        className,
      )}
    >
      <Share2 aria-hidden className="size-4" strokeWidth={1.5} />
      Share
    </button>
  );
}

/** Phone-only action bar that appears once the header has scrolled away and hides near the visit form. */
export function MobileActionBar({
  propertyId,
  name,
  price,
  disabled,
}: {
  propertyId: string;
  name: string;
  price: number;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("visit");
    let pastHeader = false;
    let nearForm = false;
    const sync = () => setVisible(pastHeader && !nearForm);
    const onScroll = () => {
      pastHeader = window.scrollY > 640;
      sync();
    };
    const io = target
      ? new IntersectionObserver(([entry]) => {
          nearForm = Boolean(entry?.isIntersecting);
          sync();
        })
      : null;
    if (target) io?.observe(target);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 backdrop-blur-md transition-transform duration-500 ease-out-expo lg:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
      aria-hidden={!visible}
      inert={!visible}
    >
      <div className="container-site flex h-[4.5rem] items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-[1.15rem] leading-tight">{name}</p>
          <p className="text-[0.8125rem] font-medium tabular-nums">{formatPrice(price)}</p>
        </div>
        <FavoriteButton propertyId={propertyId} name={name} className="border border-line" />
        {disabled ? null : (
          <a href="#visit" className="inline-flex h-11 items-center bg-ink px-5 label-caps text-[0.68rem] text-ivory">
            Request visit
          </a>
        )}
      </div>
    </div>
  );
}
