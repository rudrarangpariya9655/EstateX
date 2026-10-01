"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useToast } from "./toast-provider";

export interface ClientUser {
  id: string;
  email: string;
  fullName: string;
  role: "user" | "admin";
}

interface SessionContextValue {
  status: "loading" | "ready";
  user: ClientUser | null;
  refresh: () => Promise<void>;
}

interface FavoritesContextValue {
  ready: boolean;
  ids: string[];
  has: (id: string) => boolean;
  toggle: (property: { id: string; name: string }) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);
const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const LOCAL_KEY = "estatex:favorites:v1";

function readLocal(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, 200) : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]) {
  try {
    if (ids.length) window.localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
    else window.localStorage.removeItem(LOCAL_KEY);
  } catch {
    // Storage may be unavailable (private mode); favorites still work for this page view.
  }
}

async function postJson(url: string, body: unknown) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast();
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [user, setUser] = useState<ClientUser | null>(null);
  const [ids, setIds] = useState<string[]>([]);
  const userRef = useRef<ClientUser | null>(null);
  const idsRef = useRef<string[]>([]);

  /** Update favorites state and its ref mirror together so rapid toggles see the latest list. */
  const commitIds = useCallback((next: string[]) => {
    idsRef.current = next;
    setIds(next);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      if (!res.ok) throw new Error(`session ${res.status}`);
      const data = (await res.json()) as { user: ClientUser | null; favorites: string[] };
      userRef.current = data.user;
      setUser(data.user);
      if (data.user) {
        const pending = readLocal().filter((id) => !data.favorites.includes(id));
        if (pending.length) {
          const merged = await postJson("/api/favorites/merge", { ids: pending });
          if (merged.ok) {
            const body = (await merged.json()) as { favorites: string[] };
            commitIds(body.favorites);
            writeLocal([]);
            notify(
              pending.length === 1
                ? "The home you saved earlier is now in your account."
                : `The ${pending.length} homes you saved earlier are now in your account.`,
            );
          } else {
            commitIds(data.favorites);
          }
        } else {
          commitIds(data.favorites);
        }
      } else {
        commitIds(readLocal());
      }
    } catch {
      userRef.current = null;
      setUser(null);
      commitIds(readLocal());
    } finally {
      setStatus("ready");
    }
  }, [notify, commitIds]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Keep guest favorites in sync across tabs.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_KEY && !userRef.current) commitIds(readLocal());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback<FavoritesContextValue["toggle"]>(
    async ({ id, name }) => {
      const previous = idsRef.current;
      const saved = !previous.includes(id);
      commitIds(saved ? [id, ...previous] : previous.filter((x) => x !== id));

      if (userRef.current) {
        const res = await postJson("/api/favorites", { propertyId: id, saved }).catch(() => null);
        if (!res?.ok) {
          commitIds(previous);
          notify("We couldn't update your saved homes. Please try again.", { tone: "error" });
          return;
        }
        notify(saved ? `${name} saved to your collection.` : `${name} removed from your collection.`, {
          action: saved ? { label: "View saved", href: "/saved" } : undefined,
        });
      } else {
        writeLocal(saved ? [id, ...previous.filter((x) => x !== id)] : previous.filter((x) => x !== id));
        notify(
          saved ? `${name} saved on this device.` : `${name} removed from your collection.`,
          saved ? { action: { label: "Sign in to keep it", href: "/sign-in?next=/saved" } } : undefined,
        );
      }
    },
    [notify, commitIds],
  );

  const session = useMemo(() => ({ status, user, refresh }), [status, user, refresh]);
  const favorites = useMemo(
    () => ({ ready: status === "ready", ids, has: (id: string) => ids.includes(id), toggle }),
    [status, ids, toggle],
  );

  return (
    <SessionContext.Provider value={session}>
      <FavoritesContext.Provider value={favorites}>{children}</FavoritesContext.Provider>
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within SessionProvider");
  return ctx;
}
