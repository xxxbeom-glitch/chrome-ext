import { renderShell } from "../../lib/runtime/shell";

const app = document.querySelector<HTMLElement>("#app");
if (!app) {
  throw new Error("Popup root #app is missing");
}

renderShell({ kind: "popup", root: app });
