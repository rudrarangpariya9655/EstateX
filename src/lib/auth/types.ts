import type { SessionUser } from "../types";

export type AuthResult =
  | { ok: true; message?: string; needsConfirmation?: boolean }
  | { ok: false; error: string; field?: "email" | "password" | "currentPassword" | "token" };

export interface AuthService {
  readonly mode: "local" | "supabase";
  getUser(): Promise<SessionUser | null>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(input: { email: string; password: string; fullName: string }): Promise<AuthResult>;
  signOut(): Promise<void>;
  /** Always resolves, whether or not the email exists (prevents account enumeration). */
  requestPasswordReset(email: string): Promise<void>;
  /** Local mode uses a reset token; Supabase uses the recovery session from the email link. */
  resetPassword(input: { token?: string; password: string }): Promise<AuthResult>;
  changePassword(user: SessionUser, currentPassword: string, newPassword: string): Promise<AuthResult>;
}
