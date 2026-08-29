import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readSupabasePublicConfig } from "./config";
import { chromeStorageAdapter } from "./storage-adapter";

let cached: SupabaseClient | null | undefined;

/**
 * Canonical Chrome-extension Auth contract for this app:
 * Supabase OAuth PKCE + chrome.identity.launchWebAuthFlow + exchangeCodeForSession.
 * Do not mix with signInWithIdToken / implicit hash flows.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const config = readSupabasePublicConfig();
  if (!config) {
    cached = null;
    return cached;
  }
  cached = createClient(config.url, config.anonKey, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: chromeStorageAdapter,
    },
  });
  return cached;
}

export function resetSupabaseClientForTests(): void {
  cached = undefined;
}
