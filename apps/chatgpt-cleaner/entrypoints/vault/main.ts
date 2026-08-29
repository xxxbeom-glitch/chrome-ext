import { applyTheme } from "@chrome-ext/design-system/theme";
import { MOCK_VAULT_DETAILS, MOCK_VAULT_SUMMARIES } from "../../lib/domain/mock-data";
import { renderVaultDetail } from "../../lib/ui/vault-renderer";
import { loadThemeMode } from "../../lib/storage/theme";

async function init(): Promise<void> {
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) throw new Error("Vault root #app is missing");

  const theme = await loadThemeMode();
  applyTheme(theme);

  app.replaceChildren();
  app.className = "ce-vault";

  const title = document.createElement("h1");
  title.textContent = "Conversation Vault";

  const subtitle = document.createElement("p");
  subtitle.className = "ce-vault__subtitle";
  subtitle.textContent = "Mock local Vault shell. Cloud sync arrives in later phases.";

  const layout = document.createElement("div");
  layout.className = "ce-vault__layout";

  const list = document.createElement("ul");
  list.className = "ce-vault__list";
  list.setAttribute("aria-label", "Saved conversations");

  const reader = document.createElement("section");
  reader.className = "ce-vault__reader";
  reader.setAttribute("aria-live", "polite");

  function showDetail(id: string): void {
    const detail = MOCK_VAULT_DETAILS[id];
    if (!detail) {
      reader.replaceChildren();
      const empty = document.createElement("p");
      empty.textContent = "Snapshot unavailable.";
      reader.append(empty);
      return;
    }
    renderVaultDetail(reader, detail);
  }

  for (const summary of MOCK_VAULT_SUMMARIES) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ce-vault__list-item";
    const itemTitle = document.createElement("span");
    itemTitle.textContent = summary.title;
    const meta = document.createElement("span");
    meta.textContent = `${summary.completeness} · ${summary.bookmarkCount} bookmarks`;
    button.append(itemTitle, meta);
    button.addEventListener("click", () => showDetail(summary.id));
    item.append(button);
    list.append(item);
  }

  layout.append(list, reader);
  app.append(title, subtitle, layout);

  if (MOCK_VAULT_SUMMARIES[0]) {
    showDetail(MOCK_VAULT_SUMMARIES[0].id);
  }
}

void init();
