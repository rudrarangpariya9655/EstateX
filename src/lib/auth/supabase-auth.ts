import "server-only";
import { env } from "../env";
import { createSupabaseServerClient } from "../supabase/server";
import type { SessionUser } from "../types";
import type { AuthService } from "./types";

/** Supabase Auth: password hashing, email confirmation and recovery are handled by Supabase. */
export const supabaseAuth: AuthService = {
  mode: "supabase",

  async getUser(): Promise<SessionUser | null> {
    const supabase = await createSupabaseServerClient();
    // getUser() validates the JWT with the Auth server (never trust getSession() on the server).
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, role")
      .eq("id", data.user.id)
      .maybeSingle();
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      fullName: profile?.full_name || (data.user.user_metadata?.full_name as string | undefined) || "",
      phone: profile?.phone ?? null,
      role: profile?.role === "admin" ? "admin" : "user",
    };
  },

  async signIn(email, password) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return { ok: true };
    if (error.code === "email_not_confirmed") {
      return { ok: false, error: "Please confirm your email address first — check your inbox for the link." };
    }
    return { ok: false, error: "That email and password don't match our records." };
  },

  async signUp({ email, password, fullName }) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${env.siteUrl}/auth/callback?next=/dashboard`,
      },
    });
    if (error) {
      if (error.code === "user_already_exists") {
        return { ok: false, field: "email", error: "An account with this email already exists. Try signing in." };
      }
      if (error.code === "weak_password") return { ok: false, field: "password", error: error.message };
      return { ok: false, error: "We couldn't create your account. Please try again." };
    }
    return { ok: true, needsConfirmation: !data.session };
  },

  async signOut() {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  },

  async requestPasswordReset(email) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.siteUrl}/auth/callback?next=/reset-password`,
    });
    if (error) console.error("[auth] password reset request failed", error.message);
  },

  async resetPassword({ password }) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return { ok: false, field: "token", error: "This reset link is invalid or has expired. Request a new one." };
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, field: "password", error: error.message };
    await supabase.auth.signOut();
    return { ok: true, message: "Your password has been updated. Sign in with your new password." };
  },

  async changePassword(user, currentPassword, newPassword) {
    const supabase = await createSupabaseServerClient();
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError) return { ok: false, field: "currentPassword", error: "Your current password is incorrect." };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, field: "password", error: error.message };
    return { ok: true, message: "Your password has been changed." };
  },
};
