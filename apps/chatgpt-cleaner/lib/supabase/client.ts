import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readSupabasePublicConfig } from "./config";

let cached: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const config = readSupabasePublicConfig();
  if (!config) {
    cached = null;
    return cached;
  }
  cached = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return cached;
}

export function resetSupabaseClientForTests(): void {
  cached = undefined;
}
