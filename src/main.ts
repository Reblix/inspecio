import { login, msal } from "./sp/auth";
import "./ui/form";
import "./ui/galeria";
import "./ui/metas";
import "./ui/admin";
import "./ui/dashboard";
import { registerSW } from "./pwa/registerSW";
import { AccountInfo } from "@azure/msal-browser";

const $ = (id: string) => document.getElementById(id);

async function main() {
  await msal.initialize();
  
  try {
    const response = await msal.handleRedirectPromise();
    if (response) {
      msal.setActiveAccount(response.account);
    }

    let account = msal.getActiveAccount();
    if (!account && msal.getAllAccounts().length > 0) {
      msal.setActiveAccount(msal.getAllAccounts()[0]);
      account = msal.getActiveAccount();
    }

    if (!account) {
      console.log("Nenhum usuário logado, mostrando tela de login.");
      showView("login");
      return;
    }

    console.log("Usuário autenticado:", account.username);
    startApp(account);
  } catch (error) {
    console.error("Erro durante a inicialização ou autenticação:", error);
    showView("login"); // Em caso de erro, mostra a tela de login
  }
}

function startApp(account: AccountInfo) {
  showView("app");
  
  // Atualiza o perfil do usuário na UI
  const userProfile = $("user-info");
  if (userProfile) {
    userProfile.innerHTML = `<p class="font-semibold">${account.name}</p><p class="text-sm">${account.username}</p>`;
  }
  
  // Configura o roteamento
  window.addEventListener("hashchange", route);
  route();

  // Registra o Service Worker
  registerSW();
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
  const allViews = document.querySelectorAll<HTMLElement>("[data-view]");
  allViews.forEach((v) => v.classList.add("hidden"));

  const viewName = location.hash.replace("#", "") || "metas";
  const currentView = document.querySelector<HTMLElement>(`[data-view="${viewName}"]`);
  currentView?.classList.remove("hidden");

  const allNavLinks = document.querySelectorAll<HTMLElement>("[data-route]");
  allNavLinks.forEach((v) => v.setAttribute("data-active", "false"));
  const currentLink = document.querySelector<HTMLElement>(`[data-route="${viewName}"]`);
  currentLink?.setAttribute("data-active", "true");
}

// Configura o botão de login e inicia a aplicação
document.getElementById("loginBtn")?.addEventListener("click", login);
main();