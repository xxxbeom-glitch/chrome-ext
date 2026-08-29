import { applyTheme } from "@chrome-ext/design-system/theme";
import { renderVaultItemDetail } from "../../lib/ui/vault-renderer";
import { loadThemeMode } from "../../lib/storage/theme";
import { vaultService } from "../../lib/domain/vault/service";
import type { VaultRecord } from "../../lib/domain/vault/local-repository";
import type { VaultItemDetail, VaultMessageBlock } from "../../lib/domain/types";

function roleLabel(role: VaultRecord["role"]): string {
  return role === "user" ? "질문" : role === "assistant" ? "답변" : "메시지";
}

function blockPreview(block: VaultRecord["blocks"][number]): string {
  if (block.type === "list") return block.items.join(" · ");
  if (block.type === "link") return block.label || block.href;
  return "text" in block ? block.text : block.label;
}

function preview(record: VaultRecord): string {
  return record.blocks.map(blockPreview).join(" ").replace(/\s+/g, " ").trim().slice(0, 120) || "내용 없음";
}

function toDetail(record: VaultRecord): VaultItemDetail {
  const blocks: VaultMessageBlock[] = record.blocks.map((block) => {
    if (block.type === "list") return { type: "list", items: block.items };
    if (block.type === "code") {
      return {
        type: "code",
        text: block.text,
        ...(block.language ? { language: block.language } : {}),
      };
    }
    if (block.type === "link") return { type: "link", href: block.href, label: block.label };
    if (block.type === "unsupported-media") return { type: "unsupported-media", label: block.label };
    if (block.type === "table") return { type: "table", text: block.text };
    if (block.type === "heading") return { type: "heading", text: block.text };
    if (block.type === "quote") return { type: "quote", text: block.text };
    return { type: "paragraph", text: block.text };
  });
  return {
    id: record.id,
    sourceConversationId: record.sourceConversationId,
    sourceConversationTitle: record.sourceConversationTitle,
    sourceUrl: record.sourceUrl,
    sourceMessageId: record.sourceMessageId,
    role: record.role,
    messageOrdinal: record.messageOrdinal,
    updatedAt: record.updatedAt,
    blocks,
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
  title.textContent = "북마크 보관함";

  const subtitle = document.createElement("p");
  subtitle.className = "ce-vault__subtitle";

  const layout = document.createElement("div");
  layout.className = "ce-vault__layout";

  const list = document.createElement("ul");
  list.className = "ce-vault__list";
  list.setAttribute("aria-label", "저장한 질문과 답변");

  const reader = document.createElement("section");
  reader.className = "ce-vault__reader";
  reader.setAttribute("aria-live", "polite");

  let records: VaultRecord[] = [];

  async function showDetail(id: string): Promise<void> {
    const record = records.find((item) => item.id === id);
    reader.replaceChildren();
    if (!record) {
      const empty = document.createElement("p");
      empty.textContent = "저장한 메시지를 찾을 수 없습니다.";
      reader.append(empty);
      return;
    }

    renderVaultItemDetail(reader, toDetail(record));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "ce-button ce-button--danger";
    deleteBtn.textContent = "이 북마크 삭제";
    deleteBtn.addEventListener("click", () => {
      const confirmed = window.confirm(
        `저장한 ${roleLabel(record.role)}을(를) 보관함에서 삭제할까요? ChatGPT 원본 대화에는 영향을 주지 않습니다.`,
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
        ? "클라우드에 저장한 질문과 답변입니다. 원본 대화를 아카이브하거나 삭제해도 이 항목은 남습니다."
        : "로컬에 저장한 질문과 답변입니다. 팝업에서 로그인하면 이후 저장은 클라우드 보관함을 사용합니다.";

    list.replaceChildren();
    records = await vaultService.list();
    if (records.length === 0) {
      const empty = document.createElement("li");
      empty.className = "ce-empty";
      empty.textContent =
        backend === "cloud"
          ? "클라우드에 저장한 질문이나 답변이 없습니다."
          : "로컬에 저장한 질문이나 답변이 없습니다.";
      list.append(empty);
      reader.replaceChildren();
      const hint = document.createElement("p");
      hint.textContent = "ChatGPT 메시지의 북마크 버튼을 누르면 해당 메시지 하나만 여기에 저장됩니다.";
      reader.append(hint);
      return;
    }

    for (const record of records) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ce-vault__list-item";

      const itemTitle = document.createElement("span");
      itemTitle.textContent = `${roleLabel(record.role)} · ${preview(record)}`;
      const meta = document.createElement("span");
      meta.textContent = `${record.sourceConversationTitle} · ${record.updatedAt}`;
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
