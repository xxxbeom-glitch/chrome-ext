import { markContentScriptLoaded } from "../lib/runtime/content-marker";

export default defineContentScript({
  matches: ["https://chatgpt.com/*"],
  runAt: "document_idle",
  main() {
    markContentScriptLoaded(document);
  },
});
