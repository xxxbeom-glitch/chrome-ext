export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
  authRedirectUrl?: string;
}

const URL_KEY = "WXT_PUBLIC_SUPABASE_URL";
const ANON_KEY = "WXT_PUBLIC_SUPABASE_ANON_KEY";
const REDIRECT_KEY = "WXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL";

export function readSupabasePublicConfig(
  env: Record<string, string | undefined> = import.meta.env as Record<string, string | undefined>,
): SupabasePublicConfig | null {
  const url = env[URL_KEY]?.trim();
  const anonKey = env[ANON_KEY]?.trim();
  if (!url || !anonKey) return null;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)) {
    throw new Error(`${URL_KEY} must be an https://<project-ref>.supabase.co URL`);
  }
  return {
    url: url.replace(/\/$/, ""),
    anonKey,
    ...(env[REDIRECT_KEY]?.trim() ? { authRedirectUrl: env[REDIRECT_KEY]!.trim() } : {}),
  };
}

export function isSupabaseConfigured(): boolean {
  try {
    return readSupabasePublicConfig() != null;
  } catch {
    return false;
  }
}
