export const MESSAGE_VERSION = 1 as const;

export type ExtensionMessage =
  | {
      version: typeof MESSAGE_VERSION;
      type: "cleanup.open";
    }
  | {
      version: typeof MESSAGE_VERSION;
      type: "cleanup.close";
    }
  | {
      version: typeof MESSAGE_VERSION;
      type: "cleanup.status";
      open: boolean;
    }
  | {
      version: typeof MESSAGE_VERSION;
      type: "tabs.openChatgpt";
      openCleanup?: boolean;
    }
  | {
      version: typeof MESSAGE_VERSION;
      type: "tabs.openVault";
    }
  | {
      version: typeof MESSAGE_VERSION;
      type: "ack";
      ok: true;
    }
  | {
      version: typeof MESSAGE_VERSION;
      type: "ack";
      ok: false;
      error: string;
    };

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as { version?: unknown; type?: unknown };
  if (message.version !== MESSAGE_VERSION || typeof message.type !== "string") {
    return false;
  }

  switch (message.type) {
    case "cleanup.open":
    case "cleanup.close":
    case "tabs.openVault":
      return true;
    case "cleanup.status":
      return typeof (value as { open?: unknown }).open === "boolean";
    case "tabs.openChatgpt":
      return (
        (value as { openCleanup?: unknown }).openCleanup === undefined ||
        typeof (value as { openCleanup?: unknown }).openCleanup === "boolean"
      );
    case "ack":
      return (
        typeof (value as { ok?: unknown }).ok === "boolean" &&
        ((value as { ok: boolean }).ok === true ||
          typeof (value as { error?: unknown }).error === "string")
      );
    default:
      return false;
  }
}
