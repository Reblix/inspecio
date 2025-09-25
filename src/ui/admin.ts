// src/ui/admin.ts
import "@pnp/sp/site-users/web";
import "@pnp/sp/site-groups/web";
import { getSp } from "../sp/pnp";
import { getCurrentUser } from "../sp/user";

/** Navega entre as views principais trocando classes "hidden" */
function goTo(id: "admin-view" | "dashboard-view" | "metas-view" | "form-view" | "galeria-view") {
  const ids = ["admin-view", "dashboard-view", "metas-view", "form-view", "galeria-view"];
  ids.forEach(x => {
    const el = document.getElementById(x);
    if (!el) return;
    if (x === id) el.classList.remove("hidden");
    else el.classList.add("hidden");
  });

  const titleMap: Record<string, string> = {
    "admin-view": "Admin (Usuários)",
    "dashboard-view": "Dashboard",
    "metas-view": "Metas",
    "form-view": "Formulário",
    "galeria-view": "Galeria de Auditorias",
  };
  const t = document.getElementById("page-title");
  if (t) t.textContent = titleMap[id] ?? "Inspecio";
}

/** Evita listeners duplicados quando initAdminPage é chamado mais de uma vez */
let wired = false;

export async function initAdminPage() {
  if (wired) return;
  wired = true;

  const sp = getSp();
  const navBtn   = document.getElementById("nav-admin");
  const wrapAud  = document.getElementById("f-auditor-wrap"); // filtro extra na Galeria (somente admin)
  const feedback = document.getElementById("admin-users-feedback");

  // Descobre usuário atual e se é admin
  let me: { isAdmin?: boolean } | null = null;
  try {
    me = await getCurrentUser();
  } catch {
    me = null;
  }

  // Esconde/mostra o botão Admin e o filtro por Auditor na galeria
  if (!me || !me.isAdmin) {
    navBtn?.classList.add("hidden");
    wrapAud?.classList.add("hidden");
  } else {
    navBtn?.classList.remove("hidden");
    wrapAud?.classList.remove("hidden");
  }

  // Navegar para a página de Admin
  navBtn?.addEventListener("click", () => goTo("admin-view"));

  // Ação: adicionar usuário a um grupo (Admins ou Users)
  document.getElementById("admin-adduser")?.addEventListener("click", async () => {
    const email = (document.getElementById("admin-email") as HTMLInputElement)?.value?.trim();
    const role  = (document.getElementById("admin-role") as HTMLSelectElement)?.value as "admin" | "user";

    if (!email) {
      if (feedback) feedback.innerHTML = `<span class="text-red-700">Informe um e-mail válido.</span>`;
      return;
    }

    try {
      if (feedback) feedback.textContent = "Adicionando...";
      // Garante que o usuário existe no site e obtem o LoginName para adicionar no grupo
      const ensured: any = await sp.web.ensureUser(email);
      const login = ensured?.LoginName ?? ensured?.data?.LoginName;
      if (!login) throw new Error("Não foi possível obter o LoginName do usuário.");

      const groupName =
        role === "admin" ? import.meta.env.VITE_SP_GROUP_ADMINS : import.meta.env.VITE_SP_GROUP_USERS;

      await sp.web.siteGroups.getByName(groupName).users.add(login);

      if (feedback) {
        feedback.innerHTML =
          `<span class="text-green-700">Usuário adicionado ao grupo <b>${groupName}</b>.</span>`;
      }
    } catch (e: any) {
      console.error(e);
      if (feedback) {
        feedback.innerHTML =
          `<span class="text-red-700">Falha ao adicionar: ${e?.message ?? String(e)}</span>`;
      }
    }
  });
}
