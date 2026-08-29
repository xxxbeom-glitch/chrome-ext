import { applyTheme } from "@chrome-ext/design-system/theme";
import { isExtensionMessage, MESSAGE_VERSION } from "../../lib/messaging/schema";
import { loadThemeMode, saveThemeMode, type StoredThemeMode } from "../../lib/storage/theme";
import {
  getAuthSessionState,
  startGoogleSignIn,
  signOut,
  type AuthSessionState,
} from "../../lib/supabase/auth";
import { isSupabaseConfigured } from "../../lib/supabase/config";

async function send(
  type: "tabs.openChatgpt" | "tabs.openVault",
  openCleanup = false,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const message =
    type === "tabs.openChatgpt"
      ? { version: MESSAGE_VERSION, type, openCleanup }
      : { version: MESSAGE_VERSION, type };

  try {
    const raw = await browser.runtime.sendMessage(message);
    if (!isExtensionMessage(raw) || raw.type !== "ack") {
      return {
        ok: false,
        error: "확장프로그램 응답이 올바르지 않습니다. 다시 시도해 주세요.",
      };
    }
    if (!raw.ok) {
      return { ok: false, error: raw.error };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "요청에 실패했습니다.",
    };
  }
}

function sessionLabel(state: AuthSessionState): string {
  if (state.status === "unconfigured") {
    return "클라우드 동기화가 설정되지 않았습니다. 북마크는 기기에만 저장됩니다.";
  }
  if (state.status === "signed_out") {
    return "로그아웃 상태입니다. 로그인 전까지 북마크는 기기에만 저장됩니다.";
  }
  return `로그인됨${state.email ? ` · ${state.email}` : ""}. 북마크는 클라우드 보관함에 저장됩니다.`;
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
  subtitle.textContent =
    "정리는 ChatGPT 안에서, 북마크한 대화는 보관함 페이지에서 확인합니다.";

  const actionStatus = document.createElement("p");
  actionStatus.className = "ce-popup__note";
  actionStatus.setAttribute("aria-live", "polite");

  const actions = document.createElement("div");
  actions.className = "ce-popup__actions";

  const openChatgpt = document.createElement("button");
  openChatgpt.type = "button";
  openChatgpt.className = "ce-button ce-button--primary";
  openChatgpt.textContent = "ChatGPT 열기";
  openChatgpt.addEventListener("click", () => {
    void (async () => {
      actionStatus.textContent = "ChatGPT를 여는 중…";
      const result = await send("tabs.openChatgpt");
      actionStatus.textContent = result.ok ? "" : result.error;
    })();
  });

  const cleanUp = document.createElement("button");
  cleanUp.type = "button";
  cleanUp.className = "ce-button ce-button--primary";
  cleanUp.textContent = "대화방 정리하기";
  cleanUp.addEventListener("click", () => {
    void (async () => {
      actionStatus.textContent = "정리 화면을 여는 중…";
      const result = await send("tabs.openChatgpt", true);
      actionStatus.textContent = result.ok ? "" : result.error;
    })();
  });

  const vault = document.createElement("button");
  vault.type = "button";
  vault.className = "ce-button ce-button--secondary";
  vault.textContent = "북마크한 대화";
  vault.addEventListener("click", () => {
    void (async () => {
      actionStatus.textContent = "보관함을 여는 중…";
      const result = await send("tabs.openVault");
      actionStatus.textContent = result.ok ? "" : result.error;
    })();
  });

  actions.append(openChatgpt, cleanUp, vault);

  const authRow = document.createElement("div");
  authRow.className = "ce-popup__actions";
  const authStatus = document.createElement("p");
  authStatus.className = "ce-popup__note";
  authStatus.setAttribute("aria-live", "polite");

  const authButton = document.createElement("button");
  authButton.type = "button";
  authButton.className = "ce-button ce-button--secondary";

  async function refreshAuth(): Promise<void> {
    const state = await getAuthSessionState();
    authStatus.textContent = sessionLabel(state);
    if (!isSupabaseConfigured() || state.status === "unconfigured") {
      authButton.textContent = "클라우드 설정 필요";
      authButton.disabled = true;
      return;
    }
    authButton.disabled = false;
    if (state.status === "signed_in") {
      authButton.textContent = "로그아웃";
      authButton.onclick = () => {
        void (async () => {
          authButton.disabled = true;
          await signOut();
          await refreshAuth();
        })();
      };
      return;
    }
    authButton.textContent = "Google로 로그인";
    authButton.onclick = () => {
      void (async () => {
        authButton.disabled = true;
        authStatus.textContent = "Google 로그인 시작 중…";
        const result = await startGoogleSignIn();
        if (!result.ok) {
          authStatus.textContent = `로그인 실패: ${result.error}`;
          authButton.disabled = false;
          return;
        }
        await refreshAuth();
      })();
    };
  }

  authRow.append(authButton);
  await refreshAuth();

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

  app.append(title, subtitle, actions, actionStatus, authStatus, authRow, themeRow);
}

void init();
