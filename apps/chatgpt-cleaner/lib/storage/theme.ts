const THEME_STORAGE_KEY = "ce.themeMode";

export type StoredThemeMode = "system" | "light" | "dark";

export async function loadThemeMode(): Promise<StoredThemeMode> {
  const result = await browser.storage.local.get(THEME_STORAGE_KEY);
  const value = result[THEME_STORAGE_KEY];
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "system";
}

export async function saveThemeMode(mode: StoredThemeMode): Promise<void> {
  await browser.storage.local.set({ [THEME_STORAGE_KEY]: mode });
}
