// src/ui/form.ts
import { metaData, MetaKey } from "../core/metaData";
import { dbp } from "../core/db";
import { compressImage } from "../core/compress";
import { gerarPDF } from "../core/pdf";
import { createAuditoria, addResposta, uploadFoto, updateAuditoria } from "../sp/repo";
import { getCurrentUser } from "../sp/user";

type Resp = "C" | "NC" | "NA";
type SyncStatus = "pending" | "synced";

type AuditLocal = {
  idLocal: string;
  MetaKey: MetaKey;
  Auditor: string;
  Setor: string;
  DataAuditoria: string;
  ProntuarioNumero: string;
  PacienteIniciais: string;
  statusSync: SyncStatus;
  idSp?: number;
};

const el = (id: string) => document.getElementById(id)! as HTMLElement;
const byId = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T | null;
const photoInput = () => byId<HTMLInputElement>("photo-input");
const getVal = (id: string) => (byId<HTMLInputElement>(id)?.value ?? "").trim();

// ---------- helpers p/ itens ----------
function toLabel(item: unknown): string {
  if (typeof item === "string") return item;
  const any = item as any;
  return (any?.text ?? any?.label ?? String(any)).toString();
}

function flattenItems(meta: any): string[] {
  if (meta?.groups?.length) {
    return meta.groups.flatMap((g: { name: string; items: any[] }) =>
      (g.items ?? []).map(toLabel)
    );
  }
  return (meta.items ?? []).map(toLabel);
}
// -------------------------------------

let currentMetaKey: MetaKey | null = null;
let currentPhotos: File[] = [];

function clearForm() {
  const setor = byId<HTMLInputElement>("form-setor");
  const date  = byId<HTMLInputElement>("form-date");
  const pront = byId<HTMLInputElement>("form-pront");
  const inic  = byId<HTMLInputElement>("form-init");
  if (setor) setor.value = "";
  if (date)  date.valueAsDate = new Date();
  if (pront) pront.value = "";
  if (inic)  inic.value = "";
  currentPhotos = [];
  const previews = byId("image-previews");
  if (previews) previews.innerHTML = "";
}

async function fillAuditorReadOnly() {
  const auditorInput = byId<HTMLInputElement>("form-auditor");
  if (!auditorInput) return;
  try {
    const me = await getCurrentUser();
    auditorInput.value = (me as any).title ?? (me as any).displayName ?? "";
    auditorInput.readOnly = true; // <-- CORREÇÃO
    auditorInput.classList.add("bg-gray-100");
  } catch {
    auditorInput.readOnly = false; // <-- CORREÇÃO
    auditorInput.classList.remove("bg-gray-100");
  }
}

function renderItem(idx: number, label: string) {
  const wrapper = document.createElement("div");
  wrapper.className = "p-4 border rounded-lg bg-gray-50";
  wrapper.innerHTML = `
    <p class="font-semibold text-gray-700 mb-3">${label}</p>
    <div class="flex space-x-6">
      <label class="flex items-center space-x-2 cursor-pointer">
        <input type="radio" name="item-${idx}" value="C" class="h-5 w-5" required>
        <span class="text-green-600">Conforme</span>
      </label>
      <label class="flex items-center space-x-2 cursor-pointer">
        <input type="radio" name="item-${idx}" value="NC" class="h-5 w-5">
        <span class="text-red-600">Não Conforme</span>
      </label>
      <label class="flex items-center space-x-2 cursor-pointer">
        <input type="radio" name="item-${idx}" value="NA" class="h-5 w-5">
        <span class="text-gray-600">Não Aplicável</span>
      </label>
    </div>
  `;
  return wrapper;
}

function renderForm(metaKey: MetaKey) {
  currentMetaKey = metaKey;
  const meta = metaData[metaKey];

  const pageTitle = byId("page-title");
  if (pageTitle) pageTitle.textContent = meta.title;
  const formTitle = byId("form-title");
  if (formTitle) formTitle.textContent = meta.title;

  const container = byId("form-items");
  if (!container) return;
  container.innerHTML = "";
  clearForm();

  if ((meta as any).groups?.length) {
    let idx = 0;
    (meta as any).groups.forEach((g: { name: string; items: any[] }) => {
      const det = document.createElement("details");
      det.className = "mb-4 rounded-lg bg-white border";
      const sum = document.createElement("summary");
      sum.className = "cursor-pointer select-none px-4 py-2 font-semibold text-blue-700";
      sum.textContent = g.name;
      det.appendChild(sum);

      const inner = document.createElement("div");
      inner.className = "space-y-4 p-4";
      (g.items ?? []).forEach((it: unknown) => {
        inner.appendChild(renderItem(idx++, toLabel(it)));
      });
      det.appendChild(inner);
      container.appendChild(det);
    });
  } else {
    (meta.items ?? []).forEach((it: unknown, idx: number) => {
      container.appendChild(renderItem(idx, toLabel(it)));
    });
  }
}

function renderImagePreviews() {
  const container = byId("image-previews");
  if (!container) return;
  container.innerHTML = "";
  currentPhotos.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const box = document.createElement("div");
      box.className = "relative";
      const img = document.createElement("img");
      img.src = ev.target?.result as string;
      img.className = "w-full h-24 object-cover rounded-lg shadow-md";
      const removeBtn = document.createElement("button");
      removeBtn.className =
        "absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700";
      removeBtn.textContent = "×";
      removeBtn.onclick = () => { currentPhotos.splice(index, 1); renderImagePreviews(); };
      box.appendChild(img);
      box.appendChild(removeBtn);
      container.appendChild(box);
    };
    reader.readAsDataURL(file);
  });
}

async function saveAudit() {
  if (!currentMetaKey) return;

  const auditor = getVal("form-auditor");
  const setor   = getVal("form-setor");
  const date    = getVal("form-date");
  const pront   = getVal("form-pront");
  const inic    = getVal("form-init").toUpperCase();

  if (!auditor || !setor || !date || !pront || !inic) {
    alert("Preencha Auditor, Setor, Data, Nº Prontuário e Iniciais.");
    return;
  }

  const meta = metaData[currentMetaKey];
  const allItemLabels = flattenItems(meta as any);
  const checked = Array.from(
    document.querySelectorAll<HTMLInputElement>("#form-view input[type='radio']:checked")
  );
  const expected = allItemLabels.length;

  if (checked.length !== expected) {
    alert("Responda a todos os itens da auditoria.");
    return;
  }

  // compressão e limite de 5 fotos / 5MB
  const compressed: File[] = [];
  for (const f of currentPhotos.slice(0, 5)) {
    const c = await compressImage(f, 5 * 1024 * 1024, 1920);
    if (c.size > 5 * 1024 * 1024) {
      alert(`A foto ${c.name} ainda excede 5MB após compressão.`);
      return;
    }
    compressed.push(c);
  }

  const audit: AuditLocal = {
    idLocal: `${Date.now()}`,
    MetaKey: currentMetaKey,
    Auditor: auditor,
    Setor: setor,
    DataAuditoria: date,
    ProntuarioNumero: pront,
    PacienteIniciais: inic,
    statusSync: "pending",
  };

  const answers: { itemIndex: number; resposta: Resp }[] = checked.map((input) => {
    const index = Number(input.name.split("-")[1]);
    return { itemIndex: index, resposta: input.value as Resp };
  });

  // salva offline
  const db = await dbp;
  await db.put("audits", audit, audit.idLocal);
  await Promise.all(
    answers.map(a =>
      db.put("answers", { ...a, auditId: audit.idLocal }, `${audit.idLocal}-${a.itemIndex}`)
    )
  );
  for (let i = 0; i < compressed.length; i++) {
    await db.put(
      "photos",
      { id: `${audit.idLocal}-${i}`, auditId: audit.idLocal, name: compressed[i].name, blob: compressed[i], size: compressed[i].size },
      `${audit.idLocal}-${i}`
    );
  }

  // tenta sincronizar
  try {
    el("loading-modal").classList.remove("hidden");

    const spId = await createAuditoria({
      MetaKey: audit.MetaKey,
      Auditor: audit.Auditor,
      Setor: audit.Setor,
      DataAuditoria: audit.DataAuditoria,
      ProntuarioNumero: audit.ProntuarioNumero,
      PacienteIniciais: audit.PacienteIniciais,
    });

    for (const a of answers) await addResposta(spId, a.itemIndex, a.resposta);

    let allPhotos: any[] = [];
    try { allPhotos = await db.getAllFromIndex("photos", "byAudit", audit.idLocal); }
    catch {
      const all = await db.getAll("photos");
      allPhotos = all.filter((p: any) => p.auditId === audit.idLocal);
    }
    for (const p of allPhotos) {
      await uploadFoto(spId, new File([p.blob], p.name, { type: p.blob.type }));
    }

    await updateAuditoria(spId, {});
    audit.statusSync = "synced";
    audit.idSp = spId;
    await db.put("audits", audit, audit.idLocal);
    alert("Auditoria salva e sincronizada!");
  } catch (e) {
    console.error("Falha ao sincronizar agora, ficará pendente:", e);
    alert("Sem rede ou sem permissão no SharePoint. Salvamos offline e vamos sincronizar quando houver conexão.");
  } finally {
    el("loading-modal").classList.add("hidden");
  }

  if (confirm("Deseja gerar o PDF agora?")) await generatePdfPage(audit.idLocal);
  // Redireciona para a tela de metas
  location.hash = "metas";
}

async function generatePdfPage(auditIdLocal: string) {
  const db = await dbp;
  const audit = await db.get("audits", auditIdLocal);
  const meta = metaData[audit.MetaKey];
  const formattedDate = new Date(audit.DataAuditoria).toLocaleDateString("pt-BR", { timeZone: "UTC" });

  const pdf = byId("pdf-content");
  if (pdf) {
    pdf.innerHTML = `
      <style>
        body { font-family: Helvetica, Arial, sans-serif; font-size: 10px; }
        h1 { font-size: 18px; color: #0A3A6B; border-bottom: 2px solid #0A3A6B; padding-bottom: 5px; margin-bottom: 15px;}
        h2 { font-size: 14px; color: #1E63A1; margin-top: 20px; margin-bottom: 10px; }
        .info { background-color: #F0F5FA; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
        .item { margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
      </style>
      <h1>Relatório de Auditoria - ${meta.title}</h1>
      <div class="info">
        <strong>Auditor:</strong> ${audit.Auditor}<br>
        <strong>Setor:</strong> ${audit.Setor}<br>
        <strong>Data:</strong> ${formattedDate}<br>
        <strong>Nº Prontuário:</strong> ${audit.ProntuarioNumero}<br>
        <strong>Iniciais:</strong> ${audit.PacienteIniciais}
      </div>
      <h2>Itens Verificados</h2>
      ${
        flattenItems(meta as any)
          .map((t: string, i: number) => {
            return `<div class="item">
              <p>${audit.MetaKey.replace("meta", "")}.${i + 1} - ${t}</p>
              <p>Resposta: <span>(ver dashboard)</span></p>
            </div>`;
          }).join("")
      }
    `;
  }

  const all = await db.getAll("photos");
  const photos = all
    .filter((p: any) => p.auditId === auditIdLocal)
    .map((p: any) => new File([p.blob], p.name, { type: p.blob.type }));

  await gerarPDF(audit, photos);
  if (pdf) pdf.innerHTML = "";
}

function setupListeners() {
  byId("save-form-button")?.addEventListener("click", saveAudit);
  byId("cancel-form-button")?.addEventListener("click", () => {
      // Altera o hash para voltar para a tela de metas
      location.hash = "metas";
  });
  byId("add-photo-button")?.addEventListener("click", () => {
    if (currentPhotos.length >= 5) { alert("Máximo de 5 fotos."); return; }
    photoInput()?.click();
  });

  photoInput()?.addEventListener("change", async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file: File | undefined = input?.files?.[0];
    if (!file) return;
    if (currentPhotos.length >= 5) { alert("Máximo de 5 fotos."); input.value = ""; return; }
    currentPhotos.push(file);
    renderImagePreviews();
    input.value = "";
  });

  window.addEventListener("open-form", (ev: Event) => {
    const ce = ev as CustomEvent<{ metaKey: MetaKey }>;
    renderForm(ce.detail.metaKey);
    fillAuditorReadOnly();
  });
}

document.addEventListener("DOMContentLoaded", setupListeners);
