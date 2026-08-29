import type { VaultConversationDetail, VaultMessageBlock } from "../domain/types";
import { safeExternalHref } from "../security/safe-url";

function appendText(parent: HTMLElement, text: string): void {
  parent.append(parent.ownerDocument.createTextNode(text));
}

export function renderVaultBlock(parent: HTMLElement, block: VaultMessageBlock): void {
  const doc = parent.ownerDocument;
  switch (block.type) {
    case "paragraph":
    case "heading":
    case "quote": {
      const el = doc.createElement(block.type === "heading" ? "h3" : block.type === "quote" ? "blockquote" : "p");
      appendText(el, block.text ?? "");
      parent.append(el);
      return;
    }
    case "list": {
      const list = doc.createElement("ul");
      for (const item of block.items ?? []) {
        const li = doc.createElement("li");
        appendText(li, item);
        list.append(li);
      }
      parent.append(list);
      return;
    }
    case "code": {
      const pre = doc.createElement("pre");
      const code = doc.createElement("code");
      if (block.language) code.dataset.language = block.language;
      appendText(code, block.text ?? "");
      pre.append(code);
      parent.append(pre);
      return;
    }
    case "link": {
      const href = safeExternalHref(block.href);
      if (!href) {
        const fallback = doc.createElement("span");
        appendText(fallback, block.label ?? "unsafe link omitted");
        parent.append(fallback);
        return;
      }
      const anchor = doc.createElement("a");
      anchor.href = href;
      anchor.rel = "noopener noreferrer";
      anchor.target = "_blank";
      appendText(anchor, block.label ?? href);
      parent.append(anchor);
      return;
    }
    case "table": {
      const p = doc.createElement("p");
      appendText(p, block.text ?? "Table snapshot");
      parent.append(p);
      return;
    }
    case "unsupported-media": {
      const note = doc.createElement("p");
      note.className = "ce-vault-media-placeholder";
      appendText(note, block.label ?? "Unsupported media omitted in V1");
      parent.append(note);
      return;
    }
  }
}

export function renderVaultDetail(root: HTMLElement, detail: VaultConversationDetail): void {
  const doc = root.ownerDocument;
  root.replaceChildren();

  const header = doc.createElement("header");
  header.className = "ce-vault-detail__header";
  const title = doc.createElement("h2");
  title.textContent = detail.title;
  const meta = doc.createElement("p");
  meta.textContent = `${detail.completeness} · ${detail.bookmarkCount} bookmarks · updated ${detail.updatedAt}`;
  header.append(title, meta);

  const sourceHref = safeExternalHref(detail.sourceUrl);
  if (sourceHref) {
    const source = doc.createElement("a");
    source.href = sourceHref;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = "Open source on ChatGPT";
    header.append(source);
  }

  const anchors = doc.createElement("nav");
  anchors.className = "ce-vault-anchors";
  anchors.setAttribute("aria-label", "Bookmarks");
  for (const anchor of detail.anchors) {
    const button = doc.createElement("button");
    button.type = "button";
    button.className = "ce-button ce-button--secondary ce-button--compact";
    button.textContent = `Anchor ${anchor.messageOrdinal}: ${anchor.excerpt}`;
    button.addEventListener("click", () => {
      const target = root.querySelector(`[data-ordinal="${anchor.messageOrdinal}"]`);
      if (target instanceof HTMLElement) {
        target.focus();
        target.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    });
    anchors.append(button);
  }

  const messages = doc.createElement("div");
  messages.className = "ce-vault-messages";
  for (const message of detail.messages) {
    const article = doc.createElement("article");
    article.className = "ce-vault-message";
    article.dataset.ordinal = String(message.ordinal);
    article.tabIndex = -1;
    const role = doc.createElement("p");
    role.className = "ce-vault-message__role";
    role.textContent = message.role;
    article.append(role);
    for (const block of message.blocks) {
      renderVaultBlock(article, block);
    }
    messages.append(article);
  }

  root.append(header, anchors, messages);
}
