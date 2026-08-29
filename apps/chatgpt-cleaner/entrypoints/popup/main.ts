import { applyTheme } from "@chrome-ext/design-system/theme";
import { MESSAGE_VERSION } from "../../lib/messaging/schema";
import { loadThemeMode, saveThemeMode, type StoredThemeMode } from "../../lib/storage/theme";

async function send(type: "tabs.openChatgpt" | "tabs.openVault", openCleanup = false): Promise<void> {
  const message =
    type === "tabs.openChatgpt"
      ? { version: MESSAGE_VERSION, type, openCleanup }
      : { version: MESSAGE_VERSION, type };
  await browser.runtime.sendMessage(message);
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

  const note = document.createElement("p");
  note.className = "ce-popup__note";
  note.textContent = "Account sync controls arrive in the cloud phases.";

  app.append(title, subtitle, actions, themeRow, note);
}

void init();
