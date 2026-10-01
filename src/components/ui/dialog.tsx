"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "drawer" | "modal" | "fullscreen";

const variantClasses: Record<Variant, string> = {
  drawer:
    "ex-drawer-right m-0 ml-auto h-dvh max-h-none w-full max-w-[34rem] bg-ivory text-ink sm:border-l sm:border-line",
  modal: "ex-modal m-auto w-[calc(100%-2rem)] max-w-lg bg-ivory text-ink",
  fullscreen: "m-0 h-dvh max-h-none w-screen max-w-none bg-ivory text-ink",
};

/**
 * Accessible dialog built on the native <dialog> element: showModal() gives a
 * focus trap, inert background, Escape-to-close and top-layer stacking for free.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  variant = "modal",
  hideTitle,
  children,
  footer,
  className,
  bodyClassName,
  closeLabel = "Close",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  variant?: Variant;
  hideTitle?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  closeLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => {
      onClose();
      returnFocus.current?.focus?.();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn("ex-dialog p-0 backdrop:bg-ink/50", variantClasses[variant], className)}
      onClick={(event) => {
        // Clicks on the ::backdrop target the dialog element itself.
        if (event.target === event.currentTarget) ref.current?.close();
      }}
    >
      <div className={cn("flex h-full max-h-[inherit] flex-col", variant === "modal" && "max-h-[85dvh]")}>
        <header
          className={cn(
            "flex shrink-0 items-start justify-between gap-6 px-6 pt-6 sm:px-8 sm:pt-8",
            hideTitle && "sr-only",
          )}
        >
          <div className="flex flex-col gap-2">
            <h2 id={titleId} className="text-h4">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-[0.9375rem] leading-relaxed text-muted">
                {description}
              </p>
            ) : null}
          </div>
          {!hideTitle ? (
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="-mr-2 -mt-1 inline-flex size-11 shrink-0 items-center justify-center text-ink transition-colors hover:bg-ink/5"
              aria-label={closeLabel}
            >
              <X aria-hidden className="size-5" strokeWidth={1.25} />
            </button>
          ) : null}
        </header>
        <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8", bodyClassName)}>
          {children}
        </div>
        {footer ? <footer className="shrink-0 border-t border-line px-6 py-4 sm:px-8">{footer}</footer> : null}
      </div>
    </dialog>
  );
}
