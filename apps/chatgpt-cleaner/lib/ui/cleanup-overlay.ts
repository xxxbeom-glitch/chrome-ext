import {
  MOCK_CLEANUP_ITEMS,
  MOCK_DISCOVERY_COMPLETENESS,
} from "../domain/mock-data";
import {
  discoverySummary,
  emptyListMessage,
  filterCleanupItems,
  selectAllLoadedLabel,
  selectedCount,
  type DiscoveryOutcome,
} from "../domain/cleanup-ui";
import {
  createOperationId,
  type CleanupCapabilities,
  type CleanupMutator,
  runCleanupOperation,
} from "../domain/cleanup/engine";
import type { CleanupListItem, DiscoveryCompleteness } from "../domain/types";
import overlayCss from "./cleanup-overlay.css?inline";

export interface CleanupOverlayOptions {
  mutator: CleanupMutator;
  capabilities: CleanupCapabilities;
}

export interface CleanupOverlayController {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  setDiscovery: (
    nextItems: CleanupListItem[],
    nextCompleteness: DiscoveryCompleteness,
    note?: string,
    outcome?: DiscoveryOutcome,
  ) => void;
  setCapabilities: (next: CleanupCapabilities) => void;
}

function formatDate(value?: string): string {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusLabel(status: CleanupListItem["status"]): string {
  switch (status) {
    case "running":
      return "진행 중";
    case "succeeded":
      return "성공";
    case "failed":
      return "실패";
    case "skipped":
      return "건너뜀";
    default:
      return status;
  }
}

export function createCleanupOverlay(
  doc: Document,
  options: CleanupOverlayOptions,
): CleanupOverlayController {
  let capabilities = { ...options.capabilities };
  const mutator = options.mutator;
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
          <h1 id="ce-cleanup-title">대화방 정리하기</h1>
          <p class="ce-overlay-subtitle" data-role="summary"></p>
        </div>
        <button type="button" class="ce-icon-button" data-action="close" aria-label="정리 닫기">×</button>
      </header>
      <div class="ce-overlay-toolbar">
        <label class="ce-search">
          <span class="ce-visually-hidden">대화 검색</span>
          <input type="search" placeholder="불러온 대화 검색" data-role="search" />
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
        <button type="button" class="ce-button ce-button--secondary" data-action="bulk-archive" disabled>선택 항목 보관</button>
        <button type="button" class="ce-button ce-button--danger" data-action="bulk-delete" disabled>선택 항목 삭제</button>
      </footer>
      <div class="ce-confirm" data-role="confirm" hidden>
        <p data-role="confirm-text"></p>
        <div class="ce-confirm__actions">
          <button type="button" class="ce-button ce-button--secondary" data-action="confirm-cancel">취소</button>
          <button type="button" class="ce-button ce-button--danger" data-action="confirm-delete">삭제 확인</button>
        </div>
      </div>
    </div>
  `;
  shadow.append(root);
  doc.documentElement.append(host);

  let open = false;
  let query = "";
  let items: CleanupListItem[] = MOCK_CLEANUP_ITEMS.map((item) => ({ ...item }));
  let completeness: DiscoveryCompleteness = MOCK_DISCOVERY_COMPLETENESS;
  let discoveryOutcome: DiscoveryOutcome = "ready";
  let lastFocused: Element | null = null;
  let pendingDeleteIds: string[] = [];
  let running = false;

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
  const confirmBox = root.querySelector<HTMLElement>("[data-role='confirm']")!;
  const confirmText = root.querySelector<HTMLElement>("[data-role='confirm-text']")!;

  function visibleItems(): CleanupListItem[] {
    return filterCleanupItems(items, query);
  }

  function setStatus(message: string, tone: "info" | "error" = "info"): void {
    statusEl.textContent = message;
    statusEl.dataset.tone = tone;
  }

  function hideConfirm(): void {
    pendingDeleteIds = [];
    confirmBox.hidden = true;
  }

  function showDeleteConfirm(ids: string[]): void {
    pendingDeleteIds = [...ids];
    confirmText.textContent =
      ids.length === 1
        ? `이 대화를 삭제할까요? 확장프로그램에서는 되돌릴 수 없습니다.`
        : `선택한 ${ids.length}개 대화를 삭제할까요? 확장프로그램에서는 되돌릴 수 없습니다.`;
    confirmBox.hidden = false;
  }

  async function runOperation(kind: "archive" | "delete", ids: string[]): Promise<void> {
    if (running || ids.length === 0) return;
    running = true;
    const snapshotIds = [...ids];
    for (const id of snapshotIds) {
      const item = items.find((entry) => entry.sourceId === id);
      if (item) {
        item.status = "running";
        item.errorMessage = undefined;
      }
    }
    render();
    setStatus(
      kind === "archive"
        ? `${snapshotIds.length}개 대화를 보관하는 중…`
        : `${snapshotIds.length}개 대화를 삭제하는 중…`,
    );

    const results = await runCleanupOperation(
      {
        operationId: createOperationId(kind),
        kind,
        targets: snapshotIds.map((sourceId) => ({ sourceId })),
        concurrency: 3,
      },
      capabilities,
      mutator,
    );

    for (const result of results) {
      const item = items.find((entry) => entry.sourceId === result.sourceId);
      if (!item) continue;
      item.status = result.status;
      item.errorMessage = result.errorMessage;
      if (result.status === "succeeded") {
        item.selected = false;
        if (kind === "archive") item.archived = true;
      }
    }

    const failed = results.filter((result) => result.status === "failed").length;
    setStatus(
      failed > 0
        ? `${failed}건 실패했습니다. 실패한 항목에서 다시 시도할 수 있습니다.`
        : kind === "archive"
          ? `${snapshotIds.length}개 보관이 끝났습니다.`
          : `${snapshotIds.length}개 삭제가 끝났습니다.`,
      failed > 0 ? "error" : "info",
    );
    running = false;
    render();
  }

  function render(): void {
    const visible = visibleItems();
    summaryEl.textContent = discoverySummary(items.length, completeness, discoveryOutcome);
    selectAllLabel.textContent = selectAllLoadedLabel(completeness);
    const selected = selectedCount(visible);
    selectedCountEl.textContent = `${selected}개 선택됨`;
    bulkArchive.disabled = selected === 0;
    bulkDelete.disabled = selected === 0;
    selectAll.checked = visible.length > 0 && visible.every((item) => item.selected);
    selectAll.indeterminate =
      visible.some((item) => item.selected) && !selectAll.checked;

    list.replaceChildren();
    if (visible.length === 0) {
      const empty = doc.createElement("li");
      empty.className = "ce-empty";
      empty.textContent = emptyListMessage(query, completeness, discoveryOutcome);
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
      checkbox.setAttribute("aria-label", `${item.title} 선택`);
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
        item.archived ? "보관됨" : null,
        item.status !== "idle" ? statusLabel(item.status) : null,
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
      archiveBtn.textContent = "보관";
      archiveBtn.addEventListener("click", () => {
        void runOperation("archive", [item.sourceId]);
      });
      const deleteBtn = doc.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "ce-button ce-button--danger ce-button--compact";
      deleteBtn.textContent = "삭제";
      deleteBtn.addEventListener("click", () => {
        showDeleteConfirm([item.sourceId]);
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
      if (!confirmBox.hidden) {
        hideConfirm();
        return;
      }
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
        setStatus(
          capabilities.canArchive || capabilities.canDelete
            ? "호환되는 작업만 실행됩니다."
            : "목록을 불러왔습니다. ChatGPT 호환성이 확인될 때까지 보관/삭제는 실행되지 않습니다.",
        );
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
    setDiscovery(nextItems, nextCompleteness, note, outcome = "ready") {
      items = nextItems.map((item) => ({ ...item }));
      completeness = nextCompleteness;
      discoveryOutcome = completeness === "loading" ? "loading" : outcome;
      if (note) setStatus(note);
      if (open) render();
    },
    setCapabilities(next) {
      capabilities = { ...next };
    },
  };

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const action = target?.closest<HTMLElement>("[data-action]")?.dataset.action;
    if (action === "close" || action === "backdrop") {
      if (!confirmBox.hidden) {
        hideConfirm();
        return;
      }
      controller.close();
    }
    if (action === "bulk-archive") {
      const ids = visibleItems().filter((item) => item.selected).map((item) => item.sourceId);
      void runOperation("archive", ids);
    }
    if (action === "bulk-delete") {
      const ids = visibleItems().filter((item) => item.selected).map((item) => item.sourceId);
      showDeleteConfirm(ids);
    }
    if (action === "confirm-cancel") {
      hideConfirm();
      setStatus("삭제를 취소했습니다. 대화는 변경되지 않았습니다.");
    }
    if (action === "confirm-delete") {
      const ids = [...pendingDeleteIds];
      hideConfirm();
      void runOperation("delete", ids);
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
