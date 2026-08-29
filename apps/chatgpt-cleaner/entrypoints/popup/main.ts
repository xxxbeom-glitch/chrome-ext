import { applyTheme } from "@chrome-ext/design-system/theme";
import { MESSAGE_VERSION } from "../../lib/messaging/schema";
import { loadThemeMode, saveThemeMode, type StoredThemeMode } from "../../lib/storage/theme";
import {
  getAuthSessionState,
  startGoogleSignIn,
  signOut,
  type AuthSessionState,
} from "../../lib/supabase/auth";
import { isSupabaseConfigured } from "../../lib/supabase/config";

async function send(type: "tabs.openChatgpt" | "tabs.openVault", openCleanup = false): Promise<void> {
  const message =
    type === "tabs.openChatgpt"
      ? { version: MESSAGE_VERSION, type, openCleanup }
      : { version: MESSAGE_VERSION, type };
  await browser.runtime.sendMessage(message);
}

function sessionLabel(state: AuthSessionState): string {
  if (state.status === "unconfigured") {
    return "Cloud sync unconfigured (set WXT_PUBLIC_SUPABASE_*). Bookmarks stay local.";
  }
  if (state.status === "signed_out") {
    return "Signed out. Bookmarks save locally until you sign in.";
  }
  return `Signed in${state.email ? ` as ${state.email}` : ""}. Bookmarks save to cloud Vault.`;
}

async function init(): Promise<void> {
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) throw new Error("Popup root #app is missing");

  let theme = await loadThemeMode();
  applyTheme(theme);

  app.replaceChildren();
  app.className = "ce-popup";

  const title = document.createElement("h1");
  title.textContent = "ChatGPT Cleaner";

  const subtitle = document.createElement("p");
  subtitle.className = "ce-popup__subtitle";
  subtitle.textContent = "Launcher hub. Cleanup runs inside ChatGPT; Vault opens as an extension page.";

  const actions = document.createElement("div");
  actions.className = "ce-popup__actions";

  const openChatgpt = document.createElement("button");
  openChatgpt.type = "button";
  openChatgpt.className = "ce-button ce-button--primary";
  openChatgpt.textContent = "Open ChatGPT";
  openChatgpt.addEventListener("click", () => void send("tabs.openChatgpt"));

  const cleanUp = document.createElement("button");
  cleanUp.type = "button";
  cleanUp.className = "ce-button ce-button--primary";
  cleanUp.textContent = "Clean up conversations";
  cleanUp.addEventListener("click", () => void send("tabs.openChatgpt", true));

  const vault = document.createElement("button");
  vault.type = "button";
  vault.className = "ce-button ce-button--secondary";
  vault.textContent = "Bookmarked conversations";
  vault.addEventListener("click", () => void send("tabs.openVault"));

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
      authButton.textContent = "Cloud setup required";
      authButton.disabled = true;
      return;
    }
    authButton.disabled = false;
    if (state.status === "signed_in") {
      authButton.textContent = "Sign out";
      authButton.onclick = () => {
        void (async () => {
          authButton.disabled = true;
          await signOut();
          await refreshAuth();
        })();
      };
      return;
    }
    authButton.textContent = "Sign in with Google";
    authButton.onclick = () => {
      void (async () => {
        authButton.disabled = true;
        authStatus.textContent = "Starting Google sign-in…";
        const result = await startGoogleSignIn();
        if (!result.ok) {
          authStatus.textContent = `Sign-in failed: ${result.error}`;
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
  themeRow.textContent = "Theme";
  const themeSelect = document.createElement("select");
  themeSelect.setAttribute("aria-label", "Theme mode");
  for (const mode of ["system", "light", "dark"] as StoredThemeMode[]) {
    const option = document.createElement("option");
    option.value = mode;
    option.textContent = mode;
    if (mode === theme) option.selected = true;
    themeSelect.append(option);
  }
  themeSelect.addEventListener("change", () => {
    theme = themeSelect.value as StoredThemeMode;
    void saveThemeMode(theme).then(() => applyTheme(theme));
  });
  themeRow.append(themeSelect);

  app.append(title, subtitle, actions, authStatus, authRow, themeRow);
}

void init();
