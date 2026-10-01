import "server-only";
import { isSupabaseEnabled } from "../env";
import { localStore } from "./local-store";
import type { DataStore } from "./store";
import { supabaseStore } from "./supabase-store";

/** The active persistence backend: Supabase when configured, otherwise the local demo store. */
export function getStore(): DataStore {
  return isSupabaseEnabled ? supabaseStore : localStore;
}

export { DataError } from "./store";
export type { DataStore, AdminStats } from "./store";
