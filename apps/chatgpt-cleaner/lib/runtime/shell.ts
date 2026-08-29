import { applyTheme, type ThemeMode } from "@chrome-ext/design-system/theme";

export type ShellKind = "popup" | "vault";

export interface ShellRenderOptions {
  kind: ShellKind;
  root: HTMLElement;
  theme?: ThemeMode;
}

export function renderShell({ kind, root, theme = "system" }: ShellRenderOptions): void {
  applyTheme(theme, root.ownerDocument.documentElement);

  const title = kind === "popup" ? "ChatGPT Cleaner" : "Conversation Vault";
  const subtitle =
    kind === "popup"
      ? "Launcher shell. Cleanup and Vault actions wire up in later phases."
      : "Vault shell. Saved snapshots will render here after local/cloud phases.";

  root.replaceChildren();
  root.className = "ce-shell";

  const heading = root.ownerDocument.createElement("h1");
  heading.textContent = title;

  const copy = root.ownerDocument.createElement("p");
  copy.textContent = subtitle;

  const badge = root.ownerDocument.createElement("p");
  badge.className = "ce-shell__badge";
  badge.textContent = `Phase 0 · ${kind}`;

  root.append(heading, copy, badge);
}
