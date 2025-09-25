// src/main.ts
import { initAuth, login, logout, getActiveAccount } from "./sp/auth";
import { getCurrentUser } from "./sp/user";
import { initAdminPage } from "./ui/admin";
import { initGaleriaPage } from "./ui/galeria";
import { initMetasPage } from "./ui/metas"; // mantenha sua função atual
import "./ui/dashboard"; // se você tem lógica separada para o dashboard

function goTo(id: "dashboard-view" | "metas-view" | "form-view" | "galeria-view" | "admin-view") {
  const ids = ["dashboard-view", "metas-view", "form-view", "galeria-view", "admin-view"];
  ids.forEach(x => {
    const el = document.getElementById(x);
    if (!el) return;
    if (x === id) el.classList.remove("hidden"); else el.classList.add("hidden");
  });
}

async function ensureUiLoggedState() {
  const acc = getActiveAccount();
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const title = document.getElementById("page-title");

  if (acc) {
    // mostra botões corretos
    loginBtn?.classList.add("hidden");
    logoutBtn?.classList.remove("hidden");
    // preenche nome do auditor onde for necessário (ex.: form)
    try {
      const me = await getCurrentUser();
      (document.getElementById("form-auditor") as HTMLInputElement | null)?.setAttribute("value", me.title);
      (document.getElementById("form-auditor") as HTMLInputElement | null)?.setAttribute("disabled", "true");
    } catch {}
    if (title && title.textContent?.trim() === "Login") title.textContent = "Dashboard";
  } else {
    loginBtn?.classList.remove("hidden");
    logoutBtn?.classList.add("hidden");
  }
}

async function bootstrap() {
  const logged = await initAuth(); // trata redirecionamento de volta
  await ensureUiLoggedState();

  document.getElementById("nav-dashboard")?.addEventListener("click", () => goTo("dashboard-view"), { once: true });
  document.getElementById("nav-metas")?.addEventListener("click", () => goTo("metas-view"), { once: true });

  // inicializadores que adicionam seus próprios listeners:
  initGaleriaPage();
  initAdminPage();
  initMetasPage();

  // Login/Logout
  document.getElementById("loginBtn")?.addEventListener("click", () => login());
  document.getElementById("logoutBtn")?.addEventListener("click", () => logout());

  // Se não logado, incentive login (mas sem bloquear a UI)
  if (!logged) {
    goTo("dashboard-view");
  }
}

document.addEventListener("DOMContentLoaded", bootstrap);
