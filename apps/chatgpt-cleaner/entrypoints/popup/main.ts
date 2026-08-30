import { applyTheme } from "@chrome-ext/design-system/theme";
import { isExtensionMessage, MESSAGE_VERSION } from "../../lib/messaging/schema";
import { loadThemeMode, saveThemeMode, type StoredThemeMode } from "../../lib/storage/theme";

async function send(
  openCleanup = false,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const raw = await browser.runtime.sendMessage({
      version: MESSAGE_VERSION,
      type: "tabs.openChatgpt",
      openCleanup,
    });

    if (!isExtensionMessage(raw) || raw.type !== "ack") {
      return {
        ok: false,
        error: "확장프로그램 응답이 올바르지 않습니다. 다시 시도해 주세요.",
      };
    }
    if (!raw.ok) return { ok: false, error: raw.error };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "요청에 실패했습니다.",
    };
  }
}

function themeLabel(mode: StoredThemeMode): string {
  switch (mode) {
    case "light":
      return "라이트";
    case "dark":
      return "다크";
    default:
      return "시스템";
  }
}

async function init(): Promise<void> {
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) throw new Error("Popup root #app is missing");

  let theme = await loadThemeMode();
  applyTheme(theme);

  app.replaceChildren();
  app.className = "ce-popup";

  const title = document.createElement("h1");
  title.textContent = "ChatGPT 대화 정리";

  const subtitle = document.createElement("p");
  subtitle.className = "ce-popup__subtitle";
  subtitle.textContent = "현재 대화 목록에서 필요한 항목을 선택해 보관하거나 삭제합니다.";

  const actionStatus = document.createElement("p");
  actionStatus.className = "ce-popup__note";
  actionStatus.setAttribute("aria-live", "polite");

  const actions = document.createElement("div");
  actions.className = "ce-popup__actions";

  const cleanUp = document.createElement("button");
  cleanUp.type = "button";
  cleanUp.className = "ce-button ce-button--primary";
  cleanUp.textContent = "대화방 정리하기";
  cleanUp.addEventListener("click", () => {
    void (async () => {
      actionStatus.textContent = "정리 화면을 여는 중…";
      const result = await send(true);
      actionStatus.textContent = result.ok ? "" : result.error;
    })();
  });

  const openChatgpt = document.createElement("button");
  openChatgpt.type = "button";
  openChatgpt.className = "ce-button ce-button--secondary";
  openChatgpt.textContent = "ChatGPT 열기";
  openChatgpt.addEventListener("click", () => {
    void (async () => {
      actionStatus.textContent = "ChatGPT를 여는 중…";
      const result = await send(false);
      actionStatus.textContent = result.ok ? "" : result.error;
    })();
  });

  actions.append(cleanUp, openChatgpt);

  const themeRow = document.createElement("label");
  themeRow.className = "ce-popup__theme";
  themeRow.textContent = "테마";

  const themeSelect = document.createElement("select");
  themeSelect.setAttribute("aria-label", "테마");
  for (const mode of ["system", "light", "dark"] as StoredThemeMode[]) {
    const option = document.createElement("option");
    option.value = mode;
    option.textContent = themeLabel(mode);
    if (mode === theme) option.selected = true;
    themeSelect.append(option);
  }

  themeSelect.addEventListener("change", () => {
    theme = themeSelect.value as StoredThemeMode;
    void saveThemeMode(theme).then(() => applyTheme(theme));
  });
  themeRow.append(themeSelect);

  app.append(title, subtitle, actions, actionStatus, themeRow);
}

void init();
