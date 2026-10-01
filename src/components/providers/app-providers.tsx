"use client";

import type { ReactNode } from "react";
import { CompareProvider } from "./compare-provider";
import { SessionProvider } from "./session-provider";
import { ToastProvider } from "./toast-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SessionProvider>
        <CompareProvider>{children}</CompareProvider>
      </SessionProvider>
    </ToastProvider>
  );
}
