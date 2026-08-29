export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
  authRedirectUrl?: string;
}

export function readSupabasePublicConfig(
  env: Record<string, string | undefined> = import.meta.env as Record<string, string | undefined>,
): SupabasePublicConfig | null {
  const url = env.VITE_SUPABASE_URL?.trim();
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)) {
    throw new Error("VITE_SUPABASE_URL must be an https://<project-ref>.supabase.co URL");
  }
  return {
    url: url.replace(/\/$/, ""),
    anonKey,
    ...(env.VITE_SUPABASE_AUTH_REDIRECT_URL
      ? { authRedirectUrl: env.VITE_SUPABASE_AUTH_REDIRECT_URL }
      : {}),
  };
}

export function isSupabaseConfigured(): boolean {
  try {
    return readSupabasePublicConfig() != null;
  } catch {
    return false;
  }
}
