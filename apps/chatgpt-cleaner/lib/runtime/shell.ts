import { applyTheme, type ThemeMode } from "@chrome-ext/design-system/theme";

export type ShellKind = "popup" | "vault";

export interface ShellRenderOptions {
  kind: ShellKind;
  root: HTMLElement;
  theme?: ThemeMode;
}

export function renderShell({ kind, root, theme = "system" }: ShellRenderOptions): void {
  applyTheme(theme, root.ownerDocument.documentElement);

  const title = kind === "popup" ? "ChatGPT 대화 정리" : "대화 보관함";
  const subtitle =
    kind === "popup"
      ? "런처 셸입니다. 정리와 보관함 동작은 이후 단계에서 연결됩니다."
      : "보관함 셸입니다. 저장한 스냅샷이 여기에 표시됩니다.";

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
