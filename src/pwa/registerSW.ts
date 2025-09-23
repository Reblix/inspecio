import { Workbox } from "workbox-window";

export function registerSW() {
  if ("serviceWorker" in navigator) {
    const wb = new Workbox("/sw.js");
    wb.addEventListener("waiting", () => wb.messageSW({ type: "SKIP_WAITING" }));
    wb.register();
  }
}
