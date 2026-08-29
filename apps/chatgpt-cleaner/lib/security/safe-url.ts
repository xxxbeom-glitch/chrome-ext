/**
 * Only allow http(s) destinations for rendered Vault links.
 * Blocks javascript:, data:, and other non-navigational schemes.
 */
export function safeExternalHref(href: string | undefined | null): string | null {
  if (!href) return null;
  try {
    const url = new URL(href);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}
