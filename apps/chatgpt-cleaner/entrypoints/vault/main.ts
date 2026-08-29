import { renderShell } from "../../lib/runtime/shell";

const app = document.querySelector<HTMLElement>("#app");
if (!app) {
  throw new Error("Vault root #app is missing");
}

renderShell({ kind: "vault", root: app });
