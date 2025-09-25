// src/pwa/registerSW.ts
export function registerSW() {
  // NÃO registra SW no ambiente de desenvolvimento
  if (import.meta.env.DEV) return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.error('[SW] registro falhou:', err));
    });
  }
}
