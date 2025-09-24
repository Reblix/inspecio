// main.ts
import { registerSW } from "./pwa/registerSW";
import { msal, login, logout } from "./sp/auth"; // <- exporte msal do auth.ts
import "./ui/dashboard";
import "./ui/metas";
import "./ui/form";

registerSW();

(async () => {
  await msal.initialize(); // MSAL precisa ser inicializado antes de qualquer chamada
  document.getElementById("loginBtn")?.addEventListener("click", () => login());
  document.getElementById("logoutBtn")?.addEventListener("click", () => logout());
})();
