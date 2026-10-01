"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface Toast {
  id: number;
  message: string;
  tone: "neutral" | "error";
  action?: { label: string; href: string };
}

interface ToastApi {
  notify: (message: string, options?: { tone?: Toast["tone"]; action?: Toast["action"] }) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const notify = useCallback<ToastApi["notify"]>(
    (message, options) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, message, tone: options?.tone ?? "neutral", action: options?.action }]);
      window.setTimeout(() => dismiss(id), options?.action ? 7000 : 4500);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-4 sm:items-start sm:pb-6 sm:pl-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-fade-up items-center gap-4 py-3 pl-5 pr-2 text-[0.875rem] shadow-[0_18px_40px_-24px_rgb(21_21_21/0.6)]",
              toast.tone === "error" ? "bg-danger text-white" : "bg-ink text-ivory",
            )}
          >
            <p className="flex-1 leading-snug">{toast.message}</p>
            {toast.action ? (
              <Link
                href={toast.action.href}
                onClick={() => dismiss(toast.id)}
                className="shrink-0 border-b border-current pb-0.5 label-caps text-[0.68rem]"
              >
                {toast.action.label}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="inline-flex size-9 shrink-0 items-center justify-center opacity-70 transition-opacity hover:opacity-100"
            >
              <X aria-hidden className="size-4" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
