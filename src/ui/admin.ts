// src/ui/admin.ts
import "@pnp/sp/site-users/web";
import "@pnp/sp/site-groups/web";
import { sp } from "../sp/pnp";
import { getCurrentUser } from "../sp/user";

const $ = (id: string) => document.getElementById(id)! as HTMLElement;

function goTo(id: "admin-view" | "dashboard-view" | "metas-view" | "form-view" | "galeria-view") {
  const ids = ["admin-view", "dashboard-view", "metas-view", "form-view", "galeria-view"];
  ids.forEach(x => {
    const el = document.getElementById(x);
    if (!el) return;
    if (x === id) el.classList.remove("hidden"); else el.classList.add("hidden");
  });
  const title = {
    "admin-view": "Admin (Usuários)",
    "dashboard-view": "Dashboard",
    "metas-view": "Metas",
    "form-view": "Formulário",
    "galeria-view": "Galeria de Auditorias",
  }[id];
  const t = document.getElementById("page-title");
  if (t) t.textContent = title ?? "Inspecio";
}

export async function initAdminPage() {
  const navBtn = document.getElementById("nav-admin");
  const wrapAud = document.getElementById("f-auditor-wrap");
  const feedback = document.getElementById("admin-users-feedback");

  let me = null;
  try { me = await getCurrentUser(); } catch { /* não logado */ }

  // Esconde o menu Admin se não for admin
  if (!me || !me.isAdmin) {
    navBtn?.classList.add("hidden");
    // também oculta o campo de filtro por auditor na galeria
    wrapAud?.classList.add("hidden");
  } else {
    navBtn?.classList.remove("hidden");
  }

  // Navegar para Admin
  navBtn?.addEventListener("click", () => goTo("admin-view"));

  // Botão: adicionar usuário a um grupo
  document.getElementById("admin-adduser")?.addEventListener("click", async () => {
    const email = (document.getElementById("admin-email") as HTMLInputElement).value.trim();
    const role = (document.getElementById("admin-role") as HTMLSelectElement).value as "admin" | "user";
    if (!email) { if (feedback) feedback.innerHTML = `<span class="text-red-700">Informe um e-mail válido.</span>`; return; }

    try {
      if (feedback) feedback.textContent = "Adicionando...";
      const ensured = await sp.web.ensureUser(email); // garante o usuário no site
      const login = ensured.LoginName;
      const groupName = role === "admin" ? import.meta.env.VITE_SP_GROUP_ADMINS : import.meta.env.VITE_SP_GROUP_USERS;
      await sp.web.siteGroups.getByName(groupName).users.add(login);
      if (feedback) feedback.innerHTML = `<span class="text-green-700">Usuário adicionado ao grupo <b>${groupName}</b>.</span>`;
    } catch (e: any) {
      console.error(e);
      if (feedback) feedback.innerHTML = `<span class="text-red-700">Falha ao adicionar: ${e?.message ?? e}</span>`;
    }
  });
}
