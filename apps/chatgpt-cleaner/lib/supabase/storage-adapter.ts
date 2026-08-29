import type { SupportedStorage } from "@supabase/supabase-js";

/**
 * Manifest V3 service workers have no localStorage.
 * Persist Supabase Auth sessions in chrome.storage.local instead.
 */
export const chromeStorageAdapter: SupportedStorage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof browser === "undefined" || !browser.storage?.local) return null;
    const result = await browser.storage.local.get(key);
    const value = result[key];
    return typeof value === "string" ? value : null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof browser === "undefined" || !browser.storage?.local) return;
    await browser.storage.local.set({ [key]: value });
  },
  async removeItem(key: string): Promise<void> {
    if (typeof browser === "undefined" || !browser.storage?.local) return;
    await browser.storage.local.remove(key);
  },
};
