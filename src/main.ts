import "./styles.css";
import { registerSW } from "./pwa/registerSW";
import {
  login,
  logout,
  initializeAuth,
  onAuthChanged,
  isAuthenticated,
} from "./sp/auth";
import { AccountInfo } from "@azure/msal-browser";

// Importa todos os módulos da pasta /ui para que eles se auto-registrem para eventos.
import.meta.glob("./ui/**/*.ts", { eager: true });

registerSW();

const $ = (selector: string) => document.querySelector(selector) as HTMLElement | null;

/**
 * Controla qual tela principal é exibida: loading, login ou o app em si.
 */
function showAppView(view: "login" | "app" | "loading") {
  const loginView = $("#login-view");
  const mainApp = $("#main-app");
  const loadingModal = $("#loading-modal");

  [loginView, mainApp, loadingModal].forEach(el => el?.classList.add("hidden"));

  if (view === 'loading') loadingModal?.classList.remove("hidden");
  if (view === 'login') loginView?.classList.remove("hidden");
  if (view === 'app') mainApp?.classList.remove("hidden");
}

/**
 * Controla a visibilidade das seções de conteúdo DENTRO do app principal.
 * @param view O nome da seção (ex: 'dashboard', 'metas').
 */
function showContentView(view: string) {
  const wanted = (view || "dashboard").toLowerCase();
  
  // Esconde todas as seções de conteúdo
  document.querySelectorAll<HTMLElement>("[data-view]").forEach((sec) => {
    sec.classList.add("hidden");
  });

  // Mostra a seção desejada
  const section = $(`[data-view="${wanted}"]`);
  if (section) {
    section.classList.remove("hidden");
  } else {
    // Se a view não for encontrada, volta para o dashboard por segurança.
    $('[data-view="dashboard"]')?.classList.remove("hidden");
    location.hash = "dashboard";
  }

  // Atualiza o estado ativo na barra lateral
  document.querySelectorAll("#sidebarNav a[data-route]").forEach((el) => {
    const link = el as HTMLAnchorElement;
    link.dataset.active = link.dataset.route === wanted ? "true" : "false";
  });
  
  // Atualiza o título da página
  const pageTitle = $("#page-title");
  if (pageTitle) {
      const titleMap: Record<string, string> = {
          "dashboard": "Dashboard",
          "metas": "Nova Auditoria",
          "form": "Formulário de Auditoria",
          "auditorias-salvas": "Auditorias Salvas",
          "admin": "Admin"
      };
      pageTitle.textContent = titleMap[wanted] || "Inspecio";
  }

  // Dispara um evento global para notificar os módulos que a view mudou.
  // Módulos como `metas.ts` e `dashboard.ts` vão ouvir este evento.
  window.dispatchEvent(new CustomEvent("view:entered", { detail: { view: wanted } }));
}

/**
 * Lê o hash da URL e exibe a view correta.
 */
function applyRoute() {
  if (!isAuthenticated()) {
    showAppView("login");
    return;
  }
  showAppView("app");
  const hash = (location.hash.replace(/^#/, "") || "dashboard").toLowerCase();
  showContentView(hash);
}

function updateUserProfile(account: AccountInfo | null) {
    const profileContainer = $("#user-profile");
    const userInfoHeader = $("#user-info");
    
    if (account && profileContainer && userInfoHeader) {
        userInfoHeader.innerHTML = `<p class="font-semibold text-gray-700 text-sm">${account.name}</p><p class="text-xs text-gray-500">${account.username}</p>`;
        
        profileContainer.innerHTML = `
            <div class="flex items-center gap-3 p-2">
                <div class="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg">
                    ${account.name?.charAt(0) ?? 'U'}
                </div>
                <div class="hidden lg:block">
                    <p class="font-semibold text-gray-700 text-sm truncate">${account.name}</p>
                    <button id="logoutBtn" class="text-xs text-red-500 hover:underline">Sair</button>
                </div>
            </div>
        `;
        $("#logoutBtn")?.addEventListener("click", logout);
        
    } else if (profileContainer && userInfoHeader) {
        userInfoHeader.innerHTML = '';
        profileContainer.innerHTML = '';
    }
}


// ---- INICIALIZAÇÃO ----

async function main() {
  showAppView("loading");

  // Registra listeners de eventos que existem desde o início.
  $("#loginBtn")?.addEventListener("click", login);
  
  $("#sidebarNav")?.addEventListener("click", (ev) => {
    const target = (ev.target as Element).closest("a[data-route]");
    if (target) {
      ev.preventDefault();
      location.hash = target.getAttribute("data-route") || "dashboard";
    }
  });

  window.addEventListener("hashchange", applyRoute);

  // Ouve por mudanças no estado de autenticação para atualizar a UI
  onAuthChanged((account) => {
    updateUserProfile(account);
    applyRoute(); // Garante que a rota correta seja aplicada após login/logout
  });

  // Inicializa a MSAL. Isso pode envolver um redirecionamento.
  await initializeAuth();
}

document.addEventListener("DOMContentLoaded", main);

