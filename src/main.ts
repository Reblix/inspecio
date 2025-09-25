import { initAuth, login, logout } from "./sp/auth";
import { initAdminPage } from "./ui/admin";
import { initGaleriaPage } from "./ui/galeria";
import { initLoginPage } from "./ui/login";
// (se você usa PWA:) import "./pwa";

document.addEventListener("DOMContentLoaded", async () => {
  await initAuth();        // trata o retorno do redirect
  await initLoginPage();   // mostra tela de login se não autenticado
  await initAdminPage();   // habilita menu Admin apenas p/ admins
  await initGaleriaPage(); // liga filtros/rotas da galeria

  document.getElementById("loginBtn")?.addEventListener("click", login);
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
});
