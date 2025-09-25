// src/main.ts
import "./styles.css";
import { registerSW } from "./pwa/registerSW";
import { initializeAuth, login, logout } from "./sp/auth";
import "./ui/dashboard"; // deixa a lógica da dashboard carregar quando a view "dashboard" está visível
import "./ui/metas";
import "./ui/form";

// SW só em produção
registerSW();

// --- Router bem simples por hash (#dashboard, #metas, #formularios, #config)
function showView(view: string) {
  const wanted = view || "dashboard";
  document.querySelectorAll<HTMLElement>("[data-view]").forEach(sec => {
    sec.classList.toggle("hidden", sec.dataset.view !== wanted);
  });
  // marca ativo na sidebar
  document.querySelectorAll("#sidebarNav a[data-route]").forEach(el => {
    (el as HTMLElement).dataset.active =
      (el as HTMLAnchorElement).dataset.route === wanted ? "true" : "false";
  });
}

function setupRouter() {
  const apply = () => {
    const hash = (location.hash.replace(/^#/, "") || "dashboard").toLowerCase();
    showView(hash);
  };
  window.addEventListener("hashchange", apply);
  apply();
}

window.addEventListener("DOMContentLoaded", async () => {
  // Inicializa MSAL v3 antes de qualquer chamada de login/token
  try {
    await initializeAuth();
  } catch (e) {
    console.warn("[auth] falha ao inicializar MSAL:", e);
  }

  // binds de auth
  document.getElementById("loginBtn")?.addEventListener("click", () => login());
  document.getElementById("logoutBtn")?.addEventListener("click", () => logout());

  // navegação (delegação também funciona, mas o router cobre tudo)
  const nav = document.getElementById("sidebarNav");
  nav?.addEventListener("click", (ev) => {
    const a = (ev.target as Element).closest("a[data-route]") as HTMLAnchorElement | null;
    if (!a) return;
    ev.preventDefault();
    const route = a.dataset.route || "dashboard";
    location.hash = route;
  });

  setupRouter();
});
