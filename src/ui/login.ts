// src/ui/login.ts
import { getCurrentUser } from "../sp/user";

function goTo(id: "login-view" | "dashboard-view" | "metas-view" | "form-view" | "galeria-view" | "admin-view") {
  const ids = ["login-view", "dashboard-view", "metas-view", "form-view", "galeria-view", "admin-view"];
  ids.forEach(x => {
    const el = document.getElementById(x);
    if (!el) return;
    if (x === id) el.classList.remove("hidden"); else el.classList.add("hidden");
  });
  const title = document.getElementById("page-title");
  if (title) title.textContent = id === "login-view" ? "Login" : title.textContent!;
}

export async function initLoginPage() {
  const loginBtn2 = document.getElementById("loginBtn2");
  // Reaproveita o mesmo clique do botão do header se existir
  loginBtn2?.addEventListener("click", () => document.getElementById("loginBtn")?.dispatchEvent(new Event("click")));

  try {
    const u = await getCurrentUser(); // se falhar, é anônimo (não logado)
    if (u?.id) {
      // logado
      document.getElementById("nav-dashboard")?.dispatchEvent(new Event("click"));
    } else {
      goTo("login-view");
    }
  } catch {
    goTo("login-view");
  }
}
