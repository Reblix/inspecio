export async function sendOrQueue(req: Request) {
  if (!("serviceWorker" in navigator)) return fetch(req);
  const reg = await navigator.serviceWorker.ready;
  try {
    await reg.sync.register("sp-queue"); // o SW (Workbox) gerencia as tentativas
  } catch {
    // alguns navegadores podem não suportar Sync; sem problemas
  }
  return fetch(req);
}
