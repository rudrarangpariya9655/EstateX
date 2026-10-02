import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "../env";
import { mutateDb, readDb } from "../data/local-db";
import type { SessionUser } from "../types";
import {
  hashPassword,
  passwordVersion,
  randomToken,
  sha256,
  signSession,
  verifyPassword,
  verifySession,
} from "./crypto";
import { ensureDemoAccount } from "./demo-accounts";
import type { AuthService } from "./types";

export const SESSION_COOKIE = "estatex_session";
const SESSION_DAYS = 30;
const RESET_TOKEN_MINUTES = 30;

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ESTATEX_ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function setSessionCookie(userId: string, passwordHash: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60;
  const token = await signSession({ sub: userId, pwv: passwordVersion(passwordHash), exp });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && env.siteUrl.startsWith("https://"),
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

// A real (but unusable) hash so sign-in timing does not reveal whether an email exists.
let dummyHash: Promise<string> | null = null;

/**
 * Demo-mode authentication. Passwords are hashed with scrypt; sessions are
 * HMAC-signed, httpOnly cookies bound to the current password version.
 */
export const localAuth: AuthService = {
  mode: "local",

  async getUser(): Promise<SessionUser | null> {
    const store = await cookies();
    const payload = await verifySession(store.get(SESSION_COOKIE)?.value);
    if (!payload) return null;
    const db = await readDb();
    const user = db.users.find((u) => u.id === payload.sub);
    if (!user || passwordVersion(user.passwordHash) !== payload.pwv) return null;
    return { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, role: user.role };
  },

  async signIn(email, password) {
    await ensureDemoAccount(email);
    const db = await readDb();
    const user = db.users.find((u) => u.email === email);
    dummyHash ??= hashPassword(randomToken());
    const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
    if (!user || !valid) return { ok: false, error: "That email and password don't match our records." };
    if (user.role !== "admin" && adminEmails().has(user.email)) {
      await mutateDb((d) => {
        const u = d.users.find((x) => x.id === user.id);
        if (u) u.role = "admin";
      });
    }
    await setSessionCookie(user.id, user.passwordHash);
    return { ok: true };
  },

  async signUp({ email, password, fullName }) {
    const passwordHash = await hashPassword(password);
    const created = await mutateDb((db) => {
      if (db.users.some((u) => u.email === email)) return null;
      const user = {
        id: randomUUID(),
        email,
        passwordHash,
        fullName,
        phone: null,
        role: adminEmails().has(email) ? ("admin" as const) : ("user" as const),
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
      return user;
    });
    if (!created) {
      return { ok: false, field: "email", error: "An account with this email already exists. Try signing in." };
    }
    await setSessionCookie(created.id, created.passwordHash);
    return { ok: true };
  },

  async signOut() {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
  },

  async requestPasswordReset(email) {
    const token = randomToken();
    const userId = await mutateDb((db) => {
      const user = db.users.find((u) => u.email === email);
      if (!user) return null;
      const now = Date.now();
      db.passwordResets = db.passwordResets.filter((r) => r.userId !== user.id && Date.parse(r.expiresAt) > now);
      db.passwordResets.push({
        tokenHash: sha256(token),
        userId: user.id,
        expiresAt: new Date(now + RESET_TOKEN_MINUTES * 60_000).toISOString(),
      });
      return user.id;
    });
    if (userId) {
      // Demo mode has no email provider: the link is written to the server log,
      // the way development mailers usually work. Configure Supabase for real email.
      console.info(
        `\n[EstateX demo mode] Password reset link for ${email} (valid ${RESET_TOKEN_MINUTES} min):\n${env.siteUrl}/reset-password?token=${token}\n`,
      );
    }
  },

  async resetPassword({ token, password }) {
    if (!token) return { ok: false, field: "token", error: "This reset link is missing its token." };
    const passwordHash = await hashPassword(password);
    const ok = await mutateDb((db) => {
      const now = Date.now();
      const entry = db.passwordResets.find((r) => r.tokenHash === sha256(token) && Date.parse(r.expiresAt) > now);
      if (!entry) return false;
      const user = db.users.find((u) => u.id === entry.userId);
      if (!user) return false;
      user.passwordHash = passwordHash;
      db.passwordResets = db.passwordResets.filter((r) => r.userId !== user.id);
      return true;
    });
    return ok
      ? { ok: true, message: "Your password has been updated. Sign in with your new password." }
      : { ok: false, field: "token", error: "This reset link is invalid or has expired. Request a new one." };
  },

  async changePassword(user, currentPassword, newPassword) {
    const db = await readDb();
    const record = db.users.find((u) => u.id === user.id);
    if (!record || !(await verifyPassword(currentPassword, record.passwordHash))) {
      return { ok: false, field: "currentPassword", error: "Your current password is incorrect." };
    }
    const passwordHash = await hashPassword(newPassword);
    await mutateDb((d) => {
      const u = d.users.find((x) => x.id === user.id);
      if (u) u.passwordHash = passwordHash;
    });
    // Other sessions are invalidated by the password version; keep this one signed in.
    await setSessionCookie(user.id, passwordHash);
    return { ok: true, message: "Your password has been changed." };
  },
};
