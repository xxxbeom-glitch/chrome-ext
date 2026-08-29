import { getSupabaseClient } from "./client";
import { readSupabasePublicConfig } from "./config";

export type AuthSessionState =
  | { status: "unconfigured" }
  | { status: "signed_out" }
  | { status: "signed_in"; userId: string; email?: string };

export async function getAuthSessionState(): Promise<AuthSessionState> {
  if (!readSupabasePublicConfig()) return { status: "unconfigured" };
  const client = getSupabaseClient();
  if (!client) return { status: "unconfigured" };
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.user) return { status: "signed_out" };
  return {
    status: "signed_in",
    userId: data.session.user.id,
    ...(data.session.user.email ? { email: data.session.user.email } : {}),
  };
}

/**
 * Starts Google OAuth through Supabase. Uses chrome.identity launchWebAuthFlow when available.
 * Returns false when config/provider/callback is not ready instead of inventing credentials.
 */
export async function startGoogleSignIn(): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = readSupabasePublicConfig();
  const client = getSupabaseClient();
  if (!config || !client) {
    return { ok: false, error: "Supabase public config is missing" };
  }

  const redirectTo =
    config.authRedirectUrl ??
    (typeof browser !== "undefined" && browser.identity?.getRedirectURL
      ? browser.identity.getRedirectURL()
      : undefined);

  if (!redirectTo) {
    return { ok: false, error: "Auth redirect URL is unavailable" };
  }

  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return { ok: false, error: error?.message ?? "Failed to start Google OAuth" };
  }

  if (typeof browser === "undefined" || !browser.identity?.launchWebAuthFlow) {
    return { ok: false, error: "chrome.identity is unavailable in this context" };
  }

  try {
    const responseUrl = await browser.identity.launchWebAuthFlow({
      url: data.url,
      interactive: true,
    });
    if (!responseUrl) {
      return { ok: false, error: "OAuth flow returned no redirect URL" };
    }
    const url = new URL(responseUrl);
    const code = url.searchParams.get("code");
    if (!code) {
      return { ok: false, error: "OAuth redirect missing authorization code" };
    }
    const exchanged = await client.auth.exchangeCodeForSession(code);
    if (exchanged.error) {
      return { ok: false, error: exchanged.error.message };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "OAuth flow failed",
    };
  }
}

export async function signOut(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
}
