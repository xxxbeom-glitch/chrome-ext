import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: ".",
  entrypointsDir: "entrypoints",
  outDir: ".output",
  manifest: {
    name: "ChatGPT 대화 정리 + 보관함",
    description:
      "ChatGPT 대화를 정리하고, 선택한 대화를 독립적인 보관함 스냅샷으로 남깁니다.",
    version: "0.0.0",
    permissions: ["storage", "identity"],
    host_permissions: [
      "https://chatgpt.com/*",
      "https://sgdoskwhwenyugkljzyk.supabase.co/*",
    ],
    action: {
      default_title: "ChatGPT 대화 정리",
    },
  },
});
