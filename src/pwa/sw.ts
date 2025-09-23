/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate, NetworkFirst, NetworkOnly, CacheFirst } from "workbox-strategies";
import { BackgroundSyncPlugin } from "workbox-background-sync";

declare let self: ServiceWorkerGlobalScope;

// assets buildados
precacheAndRoute(self.__WB_MANIFEST || []);

// HTML (shell)
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({ cacheName: "html-shell", networkTimeoutSeconds: 3 })
);

// JS/CSS/Workers
registerRoute(
  ({ request }) => ["style", "script", "worker"].includes(request.destination),
  new StaleWhileRevalidate({ cacheName: "static" })
);

// Imagens/Fontes
registerRoute(
  ({ request }) => ["image", "font"].includes(request.destination),
  new CacheFirst({ cacheName: "assets", matchOptions: { ignoreVary: true } })
);

// GETs a SharePoint/Graph com SWR
registerRoute(
  ({ url, request }) =>
    request.method === "GET" &&
    (url.origin.endsWith(".sharepoint.com") || url.origin === "https://graph.microsoft.com"),
  new StaleWhileRevalidate({ cacheName: "api-get" })
);

// Background Sync p/ POST/PUT/PATCH/DELETE
const queuePlugin = new BackgroundSyncPlugin("sp-queue", { maxRetentionTime: 24 * 60 });
const isSpOrGraph = (url: URL) => url.origin.endsWith(".sharepoint.com") || url.origin === "https://graph.microsoft.com";

registerRoute(({ url, request }) => request.method === "POST" && isSpOrGraph(url),
  new NetworkOnly({ plugins: [queuePlugin] }), "POST");

registerRoute(({ url, request }) => ["PUT", "PATCH", "DELETE"].includes(request.method) && isSpOrGraph(url),
  new NetworkOnly({ plugins: [queuePlugin] })
);

// atualização imediata
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
