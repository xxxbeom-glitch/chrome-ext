import {
  MOCK_CLEANUP_ITEMS,
  MOCK_DISCOVERY_COMPLETENESS,
} from "../domain/mock-data";
import {
  discoverySummary,
  filterCleanupItems,
  selectAllLoadedLabel,
  selectedCount,
} from "../domain/cleanup-ui";
import type { CleanupListItem, DiscoveryCompleteness } from "../domain/types";
import overlayCss from "./cleanup-overlay.css?inline";

export interface CleanupOverlayController {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  setDiscovery: (
    nextItems: CleanupListItem[],
    nextCompleteness: DiscoveryCompleteness,
    note?: string,
  ) => void;
}

function formatDate(value?: string): string {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function createCleanupOverlay(doc: Document): CleanupOverlayController {
  const host = doc.createElement("div");
  host.id = "ce-chatgpt-cleaner-host";
  host.setAttribute("data-ce-overlay-host", "true");
  const shadow = host.attachShadow({ mode: "open" });

  const style = doc.createElement("style");
  style.textContent = overlayCss;
  shadow.append(style);

  const root = doc.createElement("div");
  root.className = "ce-overlay-root";
  root.hidden = true;
  root.innerHTML = `
    <div class="ce-overlay-backdrop" data-action="backdrop"></div>
    <div class="ce-overlay-dialog" role="dialog" aria-modal="true" aria-labelledby="ce-cleanup-title" tabindex="-1">
      <header class="ce-overlay-header">
        <div>
          <h1 id="ce-cleanup-title">Clean up conversations</h1>
          <p class="ce-overlay-subtitle" data-role="summary"></p>
        </div>
        <button type="button" class="ce-icon-button" data-action="close" aria-label="Close cleanup">×</button>
      </header>
      <div class="ce-overlay-toolbar">
        <label class="ce-search">
          <span class="ce-visually-hidden">Search conversations</span>
          <input type="search" placeholder="Search loaded conversations" data-role="search" />
        </label>
        <label class="ce-select-all">
          <input type="checkbox" data-role="select-all" />
          <span data-role="select-all-label"></span>
        </label>
        <p class="ce-selected-count" data-role="selected-count"></p>
      </div>
      <div class="ce-overlay-status" data-role="status" aria-live="polite"></div>
      <ul class="ce-conversation-list" data-role="list"></ul>
      <footer class="ce-overlay-footer">
        <button type="button" class="ce-button ce-button--secondary" data-action="bulk-archive" disabled>Archive selected</button>
        <button type="button" class="ce-button ce-button--danger" data-action="bulk-delete" disabled>Delete selected</button>
      </footer>
    </div>
  `;
  shadow.append(root);
  doc.documentElement.append(host);

  let open = false;
  let query = "";
  let items: CleanupListItem[] = MOCK_CLEANUP_ITEMS.map((item) => ({ ...item }));
  let completeness: DiscoveryCompleteness = MOCK_DISCOVERY_COMPLETENESS;
  let lastFocused: Element | null = null;

  const dialog = root.querySelector<HTMLElement>(".ce-overlay-dialog")!;
  const list = root.querySelector<HTMLElement>("[data-role='list']")!;
  const search = root.querySelector<HTMLInputElement>("[data-role='search']")!;
  const selectAll = root.querySelector<HTMLInputElement>("[data-role='select-all']")!;
  const selectAllLabel = root.querySelector<HTMLElement>("[data-role='select-all-label']")!;
  const selectedCountEl = root.querySelector<HTMLElement>("[data-role='selected-count']")!;
  const summaryEl = root.querySelector<HTMLElement>("[data-role='summary']")!;
  const statusEl = root.querySelector<HTMLElement>("[data-role='status']")!;
  const bulkArchive = root.querySelector<HTMLButtonElement>("[data-action='bulk-archive']")!;
  const bulkDelete = root.querySelector<HTMLButtonElement>("[data-action='bulk-delete']")!;

  function visibleItems(): CleanupListItem[] {
    return filterCleanupItems(items, query);
  }

  function setStatus(message: string, tone: "info" | "error" = "info"): void {
    statusEl.textContent = message;
    statusEl.dataset.tone = tone;
  }

  function render(): void {
    const visible = visibleItems();
    summaryEl.textContent = discoverySummary(items.length, completeness);
    selectAllLabel.textContent = selectAllLoadedLabel(completeness);
    const selected = selectedCount(visible);
    selectedCountEl.textContent = `${selected} selected`;
    bulkArchive.disabled = selected === 0;
    bulkDelete.disabled = selected === 0;
    selectAll.checked = visible.length > 0 && visible.every((item) => item.selected);
    selectAll.indeterminate =
      visible.some((item) => item.selected) && !selectAll.checked;

    list.replaceChildren();
    if (visible.length === 0) {
      const empty = doc.createElement("li");
      empty.className = "ce-empty";
      empty.textContent = query ? "No loaded conversations match this search." : "No conversations discovered yet.";
      list.append(empty);
      return;
    }

    for (const item of visible) {
      const row = doc.createElement("li");
      row.className = "ce-row";
      row.dataset.sourceId = item.sourceId;
      row.dataset.status = item.status;

      const checkbox = doc.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.selected;
      checkbox.setAttribute("aria-label", `Select ${item.title}`);
      checkbox.addEventListener("change", () => {
        item.selected = checkbox.checked;
        render();
      });

      const body = doc.createElement("div");
      body.className = "ce-row__body";
      const title = doc.createElement("p");
      title.className = "ce-row__title";
      title.textContent = item.title;
      const meta = doc.createElement("p");
      meta.className = "ce-row__meta";
      meta.textContent = [
        formatDate(item.updatedAt),
        item.archived ? "archived" : null,
        item.status !== "idle" ? item.status : null,
      ]
        .filter(Boolean)
        .join(" · ");
      body.append(title, meta);
      if (item.errorMessage) {
        const error = doc.createElement("p");
        error.className = "ce-row__error";
        error.textContent = item.errorMessage;
        body.append(error);
      }

      const actions = doc.createElement("div");
      actions.className = "ce-row__actions";
      const archiveBtn = doc.createElement("button");
      archiveBtn.type = "button";
      archiveBtn.className = "ce-button ce-button--secondary ce-button--compact";
      archiveBtn.textContent = "Archive";
      archiveBtn.addEventListener("click", () => {
        setStatus(`Archive affordance ready for ${item.sourceId} (Phase 1: no host mutation).`);
      });
      const deleteBtn = doc.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "ce-button ce-button--danger ce-button--compact";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        setStatus(`Delete affordance ready for ${item.sourceId} (Phase 1: no host mutation).`, "error");
      });
      actions.append(archiveBtn, deleteBtn);

      row.append(checkbox, body, actions);
      list.append(row);
    }
  }

  function getFocusable(): HTMLElement[] {
    return Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      controller.close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = getFocusable();
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    const active = shadow.activeElement as HTMLElement | null;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const controller: CleanupOverlayController = {
    open() {
      if (open) {
        dialog.focus();
        return;
      }
      open = true;
      lastFocused = doc.activeElement;
      root.hidden = false;
      if (!statusEl.textContent) {
        setStatus("Read-only discovery. Host mutations remain disabled until Phase 3.");
      }
      render();
      dialog.focus();
      doc.addEventListener("keydown", onKeyDown, true);
    },
    close() {
      if (!open) return;
      open = false;
      root.hidden = true;
      doc.removeEventListener("keydown", onKeyDown, true);
      if (lastFocused instanceof HTMLElement) {
        lastFocused.focus();
      }
    },
    isOpen() {
      return open;
    },
    setDiscovery(nextItems, nextCompleteness, note) {
      items = nextItems.map((item) => ({ ...item }));
      completeness = nextCompleteness;
      if (note) setStatus(note);
      if (open) render();
    },
  };

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const action = target?.closest<HTMLElement>("[data-action]")?.dataset.action;
    if (action === "close" || action === "backdrop") {
      controller.close();
    }
    if (action === "bulk-archive") {
      setStatus(`Bulk Archive affordance for ${selectedCount(visibleItems())} items (Phase 1: no host mutation).`);
    }
    if (action === "bulk-delete") {
      setStatus(
        `Bulk Delete would require confirming exactly ${selectedCount(visibleItems())} items (Phase 1: no host mutation).`,
        "error",
      );
    }
  });

  search.addEventListener("input", () => {
    query = search.value;
    render();
  });

  selectAll.addEventListener("change", () => {
    const checked = selectAll.checked;
    for (const item of visibleItems()) {
      item.selected = checked;
    }
    render();
  });

  render();
  return controller;
}
