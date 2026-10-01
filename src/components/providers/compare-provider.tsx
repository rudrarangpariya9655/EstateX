"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MAX_COMPARE } from "@/lib/constants";
import { useToast } from "./toast-provider";

export interface CompareItem {
  id: string;
  slug: string;
  name: string;
  coverUrl: string | null;
}

interface CompareContextValue {
  ready: boolean;
  items: CompareItem[];
  has: (id: string) => boolean;
  toggle: (item: CompareItem) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);
const KEY = "estatex:compare:v1";

function read(): CompareItem[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is CompareItem => typeof x?.id === "string" && typeof x?.name === "string" && typeof x?.slug === "string")
      .slice(0, MAX_COMPARE);
  } catch {
    return [];
  }
}

function write(items: CompareItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable; comparison still works for this page view.
  }
}

/** Comparison list (up to three residences), persisted on this device. */
export function CompareProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast();
  const [items, setItems] = useState<CompareItem[]>([]);
  const [ready, setReady] = useState(false);
  const itemsRef = useRef<CompareItem[]>([]);

  const commit = useCallback((next: CompareItem[]) => {
    itemsRef.current = next;
    setItems(next);
    write(next);
  }, []);

  useEffect(() => {
    const load = () => {
      const stored = read();
      itemsRef.current = stored;
      setItems(stored);
      setReady(true);
    };
    load();
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY) load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback(
    (item: CompareItem) => {
      const current = itemsRef.current;
      if (current.some((x) => x.id === item.id)) {
        commit(current.filter((x) => x.id !== item.id));
        return;
      }
      if (current.length >= MAX_COMPARE) {
        notify(`You can compare up to ${MAX_COMPARE} residences. Remove one to add ${item.name}.`, {
          tone: "error",
          action: { label: "Compare now", href: `/compare?ids=${current.map((x) => x.id).join(",")}` },
        });
        return;
      }
      commit([...current, item]);
    },
    [commit, notify],
  );

  const remove = useCallback((id: string) => commit(itemsRef.current.filter((x) => x.id !== id)), [commit]);
  const clear = useCallback(() => commit([]), [commit]);

  const value = useMemo(
    () => ({ ready, items, has: (id: string) => items.some((x) => x.id === id), toggle, remove, clear }),
    [ready, items, toggle, remove, clear],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
