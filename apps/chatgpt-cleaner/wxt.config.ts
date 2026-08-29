import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: ".",
  entrypointsDir: "entrypoints",
  outDir: ".output",
  manifest: {
    name: "ChatGPT Cleaner + Conversation Vault",
    description:
      "Clean up ChatGPT conversations and preserve selected conversations as independent Vault snapshots.",
    version: "0.0.0",
    permissions: ["storage", "identity"],
    host_permissions: [
      "https://chatgpt.com/*",
      "https://sgdoskwhwenyugkljzyk.supabase.co/*",
    ],
  },
});
