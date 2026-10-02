import "server-only";
import { randomUUID } from "node:crypto";
import { isSupabaseEnabled } from "../env";
import { mutateDb, readDb } from "../data/local-db";
import type { UserRole } from "../types";
import { hashPassword } from "./crypto";

/**
 * Demo-mode accounts so the portfolio can be explored without any setup.
 *
 * Only active when Supabase is NOT configured, and only in development unless
 * ESTATEX_DEMO_ACCOUNTS=true is set explicitly. They are created lazily on the
 * first sign-in attempt with these emails. Never enable them on a deployment
 * that holds real data.
 */
export const DEMO_ACCOUNTS: { email: string; password: string; fullName: string; role: UserRole; label: string }[] = [
  { email: "guest@estatex.demo", password: "estatex-guest-2026", fullName: "Demo Guest", role: "user", label: "Visitor" },
  { email: "admin@estatex.demo", password: "estatex-admin-2026", fullName: "Demo Admin", role: "admin", label: "Administrator" },
];

export function demoAccountsEnabled(): boolean {
  if (isSupabaseEnabled) return false;
  const flag = process.env.ESTATEX_DEMO_ACCOUNTS;
  if (flag === "false") return false;
  return flag === "true" || process.env.NODE_ENV !== "production";
}

/** Create the demo account for this email if it is one and does not exist yet. */
export async function ensureDemoAccount(email: string): Promise<void> {
  if (!demoAccountsEnabled()) return;
  const account = DEMO_ACCOUNTS.find((a) => a.email === email);
  if (!account) return;
  const db = await readDb();
  if (db.users.some((u) => u.email === email)) return;
  const passwordHash = await hashPassword(account.password);
  await mutateDb((d) => {
    if (d.users.some((u) => u.email === email)) return;
    d.users.push({
      id: randomUUID(),
      email: account.email,
      passwordHash,
      fullName: account.fullName,
      phone: null,
      role: account.role,
      createdAt: new Date().toISOString(),
    });
  });
}
