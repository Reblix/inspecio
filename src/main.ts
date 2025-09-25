// src/main.ts
// src/main.ts
import "./styles.css"; // ✅ garante que o CSS entre no bundle
import { registerSW } from "./pwa/registerSW";
import {
  login,
  logout,
  initializeAuth,
  onAuthChanged,
  isAuthenticated,
} from "./sp/auth";

// ✅ carrega todos os módulos de /ui com efeito colateral (registro das telas)
import.meta.glob("./ui/**/*.ts", { eager: true });

registerSW();

/** Router por hash + notificação de view ativa */
function showView(view: string) {
  const wanted = (view || "dashboard").toLowerCase();
  document.querySelectorAll<HTMLElement>("[data-view]").forEach((sec) => {
    sec.classList.toggle("hidden", sec.dataset.view !== wanted);
  });
  document.querySelectorAll("#sidebarNav a[data-route]").forEach((el) => {
    (el as HTMLElement).dataset.active =
      (el as HTMLAnchorElement).dataset.route === wanted ? "true" : "false";
  });
  // dispara evento para módulos carregarem dados da view quando necessário
  window.dispatchEvent(
    new CustomEvent("view:entered", { detail: { view: wanted } })
  );
}

function applyRoute() {
  const hash = (location.hash.replace(/^#/, "") || "dashboard").toLowerCase();
  showView(hash);
}

window.addEventListener("hashchange", applyRoute);

// registra os listeners de clique já agora (sem esperar auth)
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn")?.addEventListener("click", login);
  document.getElementById("logoutBtn")?.addEventListener("click", logout);

  // navegação por clique na sidebar (delegação)
  document.getElementById("sidebarNav")?.addEventListener("click", (ev) => {
    const a = (ev.target as Element).closest(
      "a[data-route]"
    ) as HTMLAnchorElement | null;
    if (!a) return;
    ev.preventDefault();
    location.hash = a.dataset.route || "dashboard";
  });

  applyRoute();
});

// ✅ inicializa MSAL e re-renderiza quando o estado de auth mudar
initializeAuth().finally(() => {
  onAuthChanged(() => {
    console.debug("[auth] mudou; autenticado?", isAuthenticated());
    applyRoute(); // re-render por garantia
  });
});
