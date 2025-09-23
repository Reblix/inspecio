import { registerSW } from "./pwa/registerSW";
import { login, logout } from "./sp/auth";
import { sp } from "./sp/pnp";
import "./ui/dashboard";
import "./ui/metas";
import "./ui/form";

registerSW();

// botões de login/logout (exemplo)
(document.getElementById("loginBtn")!).addEventListener("click", login);
(document.getElementById("logoutBtn")!).addEventListener("click", logout);
