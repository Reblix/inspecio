import { login, logout, msal } from "./sp/auth";
import { registerSW } from "./pwa/registerSW";
import { AccountInfo } from "@azure/msal-browser";
import { initializeAdminModule } from "./ui/admin";
import "./ui/form";
import "./ui/galeria";
import "./ui/metas";
import "./ui/dashboard";

const $ = (id: string) => document.getElementById(id);

(async () => {
  try {
    await msal.initialize();
    const response = await msal.handleRedirectPromise();
    
    let account: AccountInfo | null = msal.getActiveAccount();
    if (!account && response) {
      account = response.account;
    }
    msal.setActiveAccount(account);

    if (!account) {
      // Se não houver conta, a única coisa que fazemos é mostrar a view de login
      // e anexar o evento ao botão.
      document.addEventListener("DOMContentLoaded", () => {
        showView("login");
        $("loginBtn")?.addEventListener("click", login);
      });
      return;
    }

    // Se houver uma conta, prosseguimos para iniciar o app.
    document.addEventListener("DOMContentLoaded", () => {
      startApp(account!);
    });

  } catch (error) {
    console.error("Erro crítico durante a inicialização:", error);
    document.addEventListener("DOMContentLoaded", () => showView("login"));
  }
})();

function startApp(account: AccountInfo) {
  showView("app");
  updateUserProfile(account);
  initializeAdminModule();

  $("logoutBtn")?.addEventListener("click", logout);

  window.addEventListener("hashchange", route);
  route();
  registerSW();
}

function updateUserProfile(account: AccountInfo | null) {
  const userContainer = $("user-info");
  if (userContainer && account) {
    userContainer.innerHTML = `
      <p class="font-semibold truncate text-sm">${account.name}</p>
      <p class="text-xs text-slate-500 truncate">${account.username}</p>
    `;
  }
}

function showView(view: 'app' | 'login') {
  const mainApp = $("main-app");
  const loginView = $("login-view");
  const loading = $("loading-modal");
  
  loading?.classList.add("hidden");
  mainApp?.classList.toggle("hidden", view !== "app");
  loginView?.classList.toggle("hidden", view !== "login");
}

function route() {
  const viewName = location.hash.replace("#", "") || "dashboard";

  document.querySelectorAll<HTMLElement>("[data-view]").forEach((v) => {
    v.classList.toggle("hidden", v.dataset.view !== viewName);
  });

  document.querySelectorAll<HTMLElement>("[data-route]").forEach((v) => {
    v.setAttribute("data-active", "false");
  });
  document.querySelector<HTMLElement>(`[data-route="${viewName}"]`)?.setAttribute("data-active", "true");

  window.dispatchEvent(new CustomEvent("view:entered", { detail: { view: viewName } }));
}