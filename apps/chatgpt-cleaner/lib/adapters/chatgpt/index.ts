export { probeCompatibility } from "./compatibility";
export { discoverConversationsFromDom } from "./discovery";
export { discoverAccountHistory } from "./account-history";
export { captureCurrentConversation } from "./snapshot";
export {
  injectBookmarkControls,
  locateBookmarkAnchors,
} from "./bookmarks";
export {
  createFailClosedMutationAdapter,
  createRecordingMutationAdapter,
} from "./mutations";
export type {
  ChatGptCapabilities,
  ConversationSnapshot,
  DiscoveryPage,
  BookmarkAnchorTarget,
} from "./types";
