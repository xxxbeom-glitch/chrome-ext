export { probeCompatibility } from "./compatibility";
export { discoverConversationsFromDom } from "./discovery";
export { discoverAccountHistory } from "./account-history";
export { captureCurrentConversation, captureMessage, extractBlocks } from "./snapshot";
export {
  injectBookmarkControls,
  locateBookmarkAnchors,
  BOOKMARK_LABELS,
} from "./bookmarks";
export {
  ASSISTANT_ACTION_ROW_REASON,
  locateAssistantActionRows,
  locateTurnActionRows,
  locateUserActionRows,
  markBookmarkCompatibility,
  messageRoleForElement,
} from "./dom/action-row";
export {
  createFailClosedMutationAdapter,
  createPrivateWebMutationAdapter,
  createRecordingMutationAdapter,
} from "./mutations";
export type {
  ChatGptCapabilities,
  ConversationSnapshot,
  MessageSnapshot,
  SnapshotBlock,
  SnapshotMessage,
  DiscoveryPage,
  BookmarkAnchorTarget,
} from "./types";
