export function registerSW() {
  if (import.meta.env.DEV) return; // evita cache chato no dev
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("[SW] registro falhou:", err));
    });
  }
}
