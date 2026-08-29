export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = Exclude<ThemeMode, "system">;

export const THEME_ATTRIBUTE = "data-ce-theme" as const;

export function applyTheme(
  mode: ThemeMode,
  element: HTMLElement = document.documentElement,
): void {
  element.setAttribute(THEME_ATTRIBUTE, mode);
}

export function resolveTheme(
  mode: ThemeMode,
  mediaQuery: MediaQueryList = window.matchMedia("(prefers-color-scheme: dark)"),
): ResolvedTheme {
  if (mode === "light" || mode === "dark") {
    return mode;
  }

  return mediaQuery.matches ? "dark" : "light";
}

export function watchSystemTheme(
  listener: (theme: ResolvedTheme) => void,
): () => void {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = (): void => {
    listener(mediaQuery.matches ? "dark" : "light");
  };

  mediaQuery.addEventListener("change", handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
}
