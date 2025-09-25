// src/main.ts
import { initAuth, login, logout } from "./sp/auth";
import { initAdminPage } from "./ui/admin";
import { initGaleriaPage } from "./ui/galeria";
import { initLoginPage } from "./ui/login";
import "./ui/metas";       // ← registra os listeners de navegação/metas
import "./ui/dashboard";   // ← atualiza dashboard

// (se usar PWA no build, mantenha comentado no dev)
// import "./pwa";

document.addEventListener("DOMContentLoaded", async () => {
  await initAuth();         // trata retorno do redirect
  await initLoginPage();    // mostra tela de login se não autenticado
  await initAdminPage();    // habilita menu Admin só p/ admins
  await initGaleriaPage();  // liga filtros/rotas da galeria

  document.getElementById("loginBtn")?.addEventListener("click", login);
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
});
