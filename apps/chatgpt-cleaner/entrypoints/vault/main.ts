import { applyTheme } from "@chrome-ext/design-system/theme";
import { renderVaultDetail } from "../../lib/ui/vault-renderer";
import { loadThemeMode } from "../../lib/storage/theme";
import {
  loadLocalVault,
  persistLocalVault,
  type VaultRecord,
} from "../../lib/domain/vault/local-repository";
import type { VaultConversationDetail } from "../../lib/domain/types";

function toDetail(record: VaultRecord): VaultConversationDetail {
  return {
    id: record.id,
    title: record.title,
    sourceConversationId: record.sourceConversationId,
    sourceUrl: record.sourceUrl,
    updatedAt: record.updatedAt,
    bookmarkCount: record.bookmarks.length,
    completeness: record.completeness,
    messages: record.snapshot.messages.map((message) => ({
      ordinal: message.ordinal,
      role: message.role,
      blocks: message.blocks.map((block) => {
        if (block.type === "list") return { type: "list", items: block.items };
        if (block.type === "code") {
          return {
            type: "code",
            text: block.text,
            ...(block.language ? { language: block.language } : {}),
          };
        }
        if (block.type === "link") return { type: "link", href: block.href, label: block.label };
        if (block.type === "unsupported-media") {
          return { type: "unsupported-media", label: block.label };
        }
        if (block.type === "table") return { type: "table", text: block.text };
        if (block.type === "heading") return { type: "heading", text: block.text };
        if (block.type === "quote") return { type: "quote", text: block.text };
        return { type: "paragraph", text: block.text };
      }),
    })),
    anchors: record.bookmarks.map((bookmark) => ({
      id: bookmark.id,
      messageOrdinal: bookmark.messageOrdinal,
      excerpt: bookmark.excerpt,
    })),
  };
}

async function init(): Promise<void> {
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) throw new Error("Vault root #app is missing");

  const theme = await loadThemeMode();
  applyTheme(theme);

  const repo = await loadLocalVault();
  app.replaceChildren();
  app.className = "ce-vault";

  const title = document.createElement("h1");
  title.textContent = "Conversation Vault";

  const subtitle = document.createElement("p");
  subtitle.className = "ce-vault__subtitle";
  subtitle.textContent =
    "Local development Vault. Cloud sync arrives later. Deleting here never deletes ChatGPT source conversations.";

  const layout = document.createElement("div");
  layout.className = "ce-vault__layout";

  const list = document.createElement("ul");
  list.className = "ce-vault__list";
  list.setAttribute("aria-label", "Saved conversations");

  const reader = document.createElement("section");
  reader.className = "ce-vault__reader";
  reader.setAttribute("aria-live", "polite");

  function showDetail(id: string): void {
    const record = repo.get(id);
    reader.replaceChildren();
    if (!record) {
      const empty = document.createElement("p");
      empty.textContent = "Snapshot unavailable.";
      reader.append(empty);
      return;
    }

    renderVaultDetail(reader, toDetail(record));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "ce-button ce-button--danger";
    deleteBtn.textContent = "Delete Vault copy";
    deleteBtn.addEventListener("click", () => {
      const confirmed = window.confirm(
        `Delete Vault copy "${record.title}"? This does not delete the ChatGPT source.`,
      );
      if (!confirmed) return;
      repo.deleteVaultOnly(record.id);
      void persistLocalVault(repo).then(renderList);
    });
    reader.append(deleteBtn);
  }

  function renderList(): void {
    list.replaceChildren();
    const records = repo.list();
    if (records.length === 0) {
      const empty = document.createElement("li");
      empty.className = "ce-empty";
      empty.textContent = "No local Vault snapshots yet. Use the ChatGPT bookmark control to capture one.";
      list.append(empty);
      reader.replaceChildren();
      const hint = document.createElement("p");
      hint.textContent = "Saved snapshots will appear here.";
      reader.append(hint);
      return;
    }

    for (const record of records) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ce-vault__list-item";
      const itemTitle = document.createElement("span");
      itemTitle.textContent = record.title;
      const meta = document.createElement("span");
      meta.textContent = `${record.completeness} · ${record.bookmarks.length} bookmarks`;
      button.append(itemTitle, meta);
      button.addEventListener("click", () => showDetail(record.id));
      item.append(button);
      list.append(item);
    }

    showDetail(records[0]!.id);
  }

  layout.append(list, reader);
  app.append(title, subtitle, layout);
  renderList();
}

void init();
