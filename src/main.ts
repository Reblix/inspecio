import { login, logout, msal } from "./sp/auth";
import { registerSW } from "./pwa/registerSW";
import { AccountInfo } from "@azure/msal-browser";
import { initializeAdminModule } from "./ui/admin";
import "./ui/form";
import "./ui/galeria";
import "./ui/metas";
import "./ui/dashboard";

const $ = (id: string) => document.getElementById(id);

async function main() {
  document.addEventListener("DOMContentLoaded", async () => {
    $("loginBtn")?.addEventListener("click", login);
    $("logoutBtn")?.addEventListener("click", logout);

    try {
      await msal.initialize();
      const response = await msal.handleRedirectPromise();
      
      let account: AccountInfo | null = null;
      if (response) {
        account = response.account;
        msal.setActiveAccount(account);
      } else {
        const accounts = msal.getAllAccounts();
        if (accounts.length > 0) {
          account = accounts[0];
          msal.setActiveAccount(account);
        }
      }

      if (!account) {
        console.log("Nenhum usuário logado, mostrando tela de login.");
        showView("login");
        return;
      }

      console.log("Usuário autenticado:", account.username);
      startApp(account);
    } catch (error) {
      console.error("Erro durante a inicialização:", error);
      showView("login");
    }
  });
}

function startApp(account: AccountInfo) {
  showView("app");
  updateUserProfile(account);
  initializeAdminModule();

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

main();