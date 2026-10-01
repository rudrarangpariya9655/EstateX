"use client";

import { useCallback, useState, useTransition, type ReactNode } from "react";
import { Button } from "./button";
import { Dialog } from "./dialog";

/**
 * Confirmation for consequential actions. Render-prop trigger keeps the
 * calling markup simple: `{(open) => <button onClick={open}>Delete</button>}`.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  tone = "danger",
  onConfirm,
  children,
}: {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "primary";
  onConfirm: () => Promise<void> | void;
  children: (open: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      {children(() => setOpen(true))}
      <Dialog
        open={open}
        onClose={close}
        title={title}
        description={description}
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={close} disabled={pending}>
              Keep it
            </Button>
            <Button
              type="button"
              variant={tone === "danger" ? "danger" : "primary"}
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  await onConfirm();
                  setOpen(false);
                })
              }
            >
              {confirmLabel}
            </Button>
          </div>
        }
      >
        <span className="sr-only">Confirm or cancel below.</span>
      </Dialog>
    </>
  );
}
