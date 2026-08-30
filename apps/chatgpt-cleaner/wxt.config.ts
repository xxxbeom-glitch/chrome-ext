import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: ".",
  entrypointsDir: "entrypoints",
  outDir: ".output",
  manifest: {
    name: "ChatGPT 대화 정리",
    description: "ChatGPT 대화 목록에서 여러 대화를 선택해 보관하거나 삭제합니다.",
    version: "0.0.0",
    permissions: ["storage"],
    host_permissions: ["https://chatgpt.com/*"],
    action: {
      default_title: "ChatGPT 대화 정리",
    },
  },
});
