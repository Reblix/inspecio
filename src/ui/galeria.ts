// src/ui/galeria.ts
import { sp } from "../sp/pnp";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/webs";
import { getCurrentUser } from "../sp/user";
import { updateAuditoria } from "../sp/repo";

const LIST_AUDITORIAS = import.meta.env.VITE_SP_LIST_AUDITORIAS || "Auditorias";

const $ = (id: string) => document.getElementById(id)! as HTMLElement;
const esc = (s: string) => s.replace(/'/g, "''");

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

async function fetchAuditorias(filters: { pront?: string; iniciais?: string; auditorTerm?: string }) {
  const me = await getCurrentUser().catch(() => null);

  let q = sp.web.lists.getByTitle(LIST_AUDITORIAS).items
    .select("Id,Title,MetaKey,Setor,DataAuditoria,ProntuarioNumero,PacienteIniciais,Author/Id,Author/Title")
    .expand("Author")
    .orderBy("Modified", false)
    .top(200);

  const where: string[] = [];
  if (me && !me.isAdmin) where.push(`Author/Id eq ${me.id}`);
  if (filters.pront) where.push(`substringof('${esc(filters.pront)}', ProntuarioNumero)`);
  if (filters.iniciais) where.push(`substringof('${esc(filters.iniciais.toUpperCase())}', PacienteIniciais)`);

  if (where.length) q = q.filter(where.join(" and "));

  const items = await q();
  // Filtro por auditor (cliente) — substring no Author/Title
  const auditorTerm = filters.auditorTerm?.trim().toLowerCase();
  const data = auditorTerm
    ? items.filter((it: any) => String(it?.Author?.Title ?? "").toLowerCase().includes(auditorTerm))
    : items;

  return data as Array<{
    Id: number; Title: string; MetaKey: string; Setor: string; DataAuditoria: string;
    ProntuarioNumero: string; PacienteIniciais: string; Author: { Id: number; Title: string };
  }>;
}

function renderTabela(rows: Awaited<ReturnType<typeof fetchAuditorias>>) {
  const tbody = document.getElementById("galeria-lista") as HTMLTableSectionElement;
  if (!tbody) return;
  tbody.innerHTML = "";

  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.className = "border-b";
    tr.innerHTML = `
      <td class="py-2 px-4">${r.Id}</td>
      <td class="py-2 px-4">${r.MetaKey}</td>
      <td class="py-2 px-4">${r.ProntuarioNumero ?? ""}</td>
      <td class="py-2 px-4">${r.PacienteIniciais ?? ""}</td>
      <td class="py-2 px-4">${r.Author?.Title ?? ""}</td>
      <td class="py-2 px-4">${r.DataAuditoria ? new Date(r.DataAuditoria).toLocaleDateString("pt-BR") : ""}</td>
      <td class="py-2 px-4">
        <button class="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded" data-open="${r.Id}">Ver</button>
        <button class="px-2 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded" data-edit="${r.Id}">Editar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Ver (detalhes simples)
  tbody.querySelectorAll<HTMLButtonElement>("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => openDetails(Number(btn.dataset.open)));
  });

  // Editar (atualizar campos de topo)
  tbody.querySelectorAll<HTMLButtonElement>("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openEditModal(Number(btn.dataset.edit)));
  });
}

async function openDetails(id: number) {
  // Detalhe rápido (para edição completa de respostas, podemos evoluir depois)
  const rows = await fetchAuditorias({});
  const item = rows.find(r => r.Id === id);
  if (!item) return;

  const modal = document.getElementById("custom-modal")!;
  (document.getElementById("modal-title")!).textContent = `Auditoria #${id}`;
  (document.getElementById("modal-message")!).innerHTML = `
    <div class="space-y-1 text-sm">
      <div><b>Meta:</b> ${item.MetaKey}</div>
      <div><b>Setor:</b> ${item.Setor ?? "-"}</div>
      <div><b>Data:</b> ${item.DataAuditoria ? new Date(item.DataAuditoria).toLocaleDateString("pt-BR") : "-"}</div>
      <div><b>Nº Prontuário:</b> ${item.ProntuarioNumero ?? "-"}</div>
      <div><b>Iniciais:</b> ${item.PacienteIniciais ?? "-"}</div>
      <div><b>Auditor:</b> ${item.Author?.Title ?? "-"}</div>
    </div>
  `;
  const buttons = document.getElementById("modal-buttons")!;
  buttons.innerHTML = `<button id="m-ok" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Fechar</button>`;
  modal.classList.remove("hidden");
  document.getElementById("m-ok")?.addEventListener("click", () => modal.classList.add("hidden"));
}

async function openEditModal(id: number) {
  const rows = await fetchAuditorias({});
  const item = rows.find(r => r.Id === id);
  if (!item) return;

  const modal = document.getElementById("custom-modal")!;
  (document.getElementById("modal-title")!).textContent = `Editar Auditoria #${id}`;
  (document.getElementById("modal-message")!).innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label class="text-sm text-gray-600">Setor</label>
        <input id="ed-setor" class="w-full p-2 border rounded-lg" value="${item.Setor ?? ""}">
      </div>
      <div>
        <label class="text-sm text-gray-600">Data</label>
        <input id="ed-data" type="date" class="w-full p-2 border rounded-lg" value="${item.DataAuditoria ? new Date(item.DataAuditoria).toISOString().slice(0,10) : ""}">
      </div>
      <div>
        <label class="text-sm text-gray-600">Nº Prontuário</label>
        <input id="ed-pront" class="w-full p-2 border rounded-lg" value="${item.ProntuarioNumero ?? ""}">
      </div>
      <div>
        <label class="text-sm text-gray-600">Iniciais</label>
        <input id="ed-init" maxlength="3" class="w-full p-2 border rounded-lg" value="${item.PacienteIniciais ?? ""}">
      </div>
    </div>
  `;
  const buttons = document.getElementById("modal-buttons")!;
  buttons.innerHTML = `
    <button id="m-cancel" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
    <button id="m-save" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Salvar</button>
  `;
  modal.classList.remove("hidden");

  document.getElementById("m-cancel")?.addEventListener("click", () => modal.classList.add("hidden"));
  document.getElementById("m-save")?.addEventListener("click", async () => {
    const setor = (document.getElementById("ed-setor") as HTMLInputElement).value.trim();
    const data  = (document.getElementById("ed-data") as HTMLInputElement).value;
    const pront = (document.getElementById("ed-pront") as HTMLInputElement).value.trim();
    const inic  = (document.getElementById("ed-init") as HTMLInputElement).value.trim().toUpperCase();

    try {
      await updateAuditoria(id, {
        Setor: setor,
        DataAuditoria: data,
        ProntuarioNumero: pront,
        PacienteIniciais: inic,
      } as any);
      modal.classList.add("hidden");
      await applyFilters(); // recarrega lista
    } catch (e) {
      alert("Falha ao salvar alterações.");
      console.error(e);
    }
  });
}

async function applyFilters() {
  const pront = (document.getElementById("f-prontuario") as HTMLInputElement).value;
  const inic  = (document.getElementById("f-iniciais") as HTMLInputElement).value;
  const aud   = (document.getElementById("f-auditor") as HTMLInputElement | null)?.value;

  const rows = await fetchAuditorias({ pront, iniciais: inic, auditorTerm: aud ?? "" });
  renderTabela(rows);
}

export async function initGaleriaPage() {
  // Abrir a página ao clicar no menu
  document.getElementById("nav-galeria")?.addEventListener("click", async () => {
    goTo("galeria-view");
    await applyFilters();
  });

  // Filtros
  document.getElementById("galeria-filtrar")?.addEventListener("click", applyFilters);
  document.getElementById("galeria-limpar")?.addEventListener("click", async () => {
    (document.getElementById("f-prontuario") as HTMLInputElement).value = "";
    (document.getElementById("f-iniciais") as HTMLInputElement).value = "";
    const fa = document.getElementById("f-auditor") as HTMLInputElement | null;
    if (fa) fa.value = "";
    await applyFilters();
  });
}
