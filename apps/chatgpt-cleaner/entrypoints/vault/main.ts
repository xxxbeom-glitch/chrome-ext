import { applyTheme } from "@chrome-ext/design-system/theme";
import { renderVaultDetail } from "../../lib/ui/vault-renderer";
import { loadThemeMode } from "../../lib/storage/theme";
import { vaultService } from "../../lib/domain/vault/service";
import type { VaultRecord } from "../../lib/domain/vault/local-repository";
import type { VaultConversationDetail } from "../../lib/domain/types";

function completenessLabel(value: VaultRecord["completeness"]): string {
  return value === "complete" ? "완료" : "부분";
}

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

  app.replaceChildren();
  app.className = "ce-vault";

  const title = document.createElement("h1");
  title.textContent = "대화 보관함";

  const subtitle = document.createElement("p");
  subtitle.className = "ce-vault__subtitle";

  const layout = document.createElement("div");
  layout.className = "ce-vault__layout";

  const list = document.createElement("ul");
  list.className = "ce-vault__list";
  list.setAttribute("aria-label", "저장된 대화");

  const reader = document.createElement("section");
  reader.className = "ce-vault__reader";
  reader.setAttribute("aria-live", "polite");

  let records: VaultRecord[] = [];

  async function showDetail(id: string): Promise<void> {
    const record = records.find((item) => item.id === id);
    reader.replaceChildren();
    if (!record) {
      const empty = document.createElement("p");
      empty.textContent = "스냅샷을 찾을 수 없습니다.";
      reader.append(empty);
      return;
    }

    renderVaultDetail(reader, toDetail(record));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "ce-button ce-button--danger";
    deleteBtn.textContent = "보관함 사본 삭제";
    deleteBtn.addEventListener("click", () => {
      const confirmed = window.confirm(
        `보관함 사본 "${record.title}"을(를) 삭제할까요? ChatGPT 원본 대화는 삭제되지 않습니다.`,
      );
      if (!confirmed) return;
      void vaultService.deleteVaultOnly(record.id).then((deleted) => {
        if (deleted) void renderList();
      });
    });
    reader.append(deleteBtn);
  }

  async function renderList(): Promise<void> {
    const backend = await vaultService.backend();
    subtitle.textContent =
      backend === "cloud"
        ? "클라우드 보관함(로그인됨). 여기서 삭제해도 ChatGPT 원본은 지우지 않습니다."
        : "로컬 보관함. 팝업에서 로그인하면 클라우드와 동기화됩니다. 여기서 삭제해도 ChatGPT 원본은 지우지 않습니다.";

    list.replaceChildren();
    records = await vaultService.list();
    if (records.length === 0) {
      const empty = document.createElement("li");
      empty.className = "ce-empty";
      empty.textContent =
        backend === "cloud"
          ? "클라우드 보관함에 저장된 대화가 없습니다. ChatGPT에서 북마크 버튼으로 저장해 보세요."
          : "로컬 보관함에 저장된 대화가 없습니다. ChatGPT에서 북마크 버튼으로 저장해 보세요.";
      list.append(empty);
      reader.replaceChildren();
      const hint = document.createElement("p");
      hint.textContent = "저장한 스냅샷이 여기에 나타납니다.";
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
      meta.textContent = `${completenessLabel(record.completeness)} · 북마크 ${record.bookmarks.length}개`;
      button.append(itemTitle, meta);
      button.addEventListener("click", () => void showDetail(record.id));
      item.append(button);
      list.append(item);
    }

    await showDetail(records[0]!.id);
  }

  layout.append(list, reader);
  app.append(title, subtitle, layout);
  await renderList();
}

void init();
