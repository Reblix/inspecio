// src/ui/form.ts
import { metaData, MetaKey } from "../core/metaData";
import { dbp } from "../core/db";
import { compressImage } from "../core/compress";
import { gerarPDF } from "../core/pdf";
import { createAuditoria, addResposta, uploadFoto, updateAuditoria } from "../sp/repo";
import { showView } from "./metas";
import { getCurrentUser } from "../sp/user"; // << pega usuário logado (PnPjs)

type Resp = "C" | "NC" | "NA";

const el = (id: string) => document.getElementById(id)! as HTMLElement;
const formTitle = () => el("form-title");
const formItems = () => el("form-items");
const photoInput = () => document.getElementById("photo-input") as HTMLInputElement;
const imagePreviews = () => el("image-previews");
const pdfContent = () => el("pdf-content");
const loading = () => el("loading-modal");

// acessores dos inputs fixos
const auditorInput     = () => document.getElementById("form-auditor") as HTMLInputElement;
const setorInput       = () => document.getElementById("form-setor") as HTMLInputElement;
const dataInput        = () => document.getElementById("form-date") as HTMLInputElement;
// novos campos
const prontuarioInput  = () => document.getElementById("form-prontuario") as HTMLInputElement;
const iniciaisInput    = () => document.getElementById("form-iniciais") as HTMLInputElement;

let currentMetaKey: MetaKey | null = null;
let currentPhotos: File[] = [];
let currentUser: { id: number; displayName: string; isAdmin: boolean } | null = null;

function clearForm() {
  // Auditor preenchido e travado
  if (currentUser) {
    auditorInput().value = currentUser.displayName;
    auditorInput().readOnly = true;
  }

  setorInput().value = "";
  dataInput().valueAsDate = new Date();

  if (prontuarioInput()) prontuarioInput().value = "";
  if (iniciaisInput())   iniciaisInput().value   = "";

  currentPhotos = [];
  imagePreviews().innerHTML = "";
}

function renderForm(metaKey: MetaKey) {
  currentMetaKey = metaKey;
  const meta = metaData[metaKey];

  el("page-title").textContent = meta.title;
  formTitle().textContent = meta.title;
  formItems().innerHTML = "";
  clearForm();

  // Normaliza itens: aceita string ou { label, group }
  type ItemNorm = { label: string; group?: "Beira Leito" | "Prontuário" };
  const normalized: ItemNorm[] = meta.items.map((it: any) =>
    typeof it === "string" ? { label: it } : { label: it.label ?? String(it), group: it.group }
  );

  const beira = normalized.filter(i => i.group === "Beira Leito");
  const pront = normalized.filter(i => i.group === "Prontuário");
  const semGrupo = normalized.filter(i => !i.group);

  const renderGrupo = (titulo: string, items: ItemNorm[], offset: number) => {
    if (!items.length) return offset;

    const section = document.createElement("details");
    section.open = true;

    const sum = document.createElement("summary");
    sum.className = "font-bold text-gray-800 cursor-pointer select-none mb-2";
    sum.textContent = titulo;
    section.appendChild(sum);

    items.forEach((item, idx) => {
      const itemNumber = `${metaKey.replace("meta", "")}.${offset + idx + 1}`;
      const wrapper = document.createElement("div");
      wrapper.className = "p-4 border rounded-lg bg-gray-50 mb-3";
      wrapper.innerHTML = `
        <p class="font-semibold text-gray-700 mb-3">${itemNumber} - ${item.label}</p>
        <div class="flex space-x-6">
          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="radio" name="item-${offset + idx}" value="C" class="h-5 w-5" required>
            <span class="text-green-600">Conforme</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="radio" name="item-${offset + idx}" value="NC" class="h-5 w-5">
            <span class="text-red-600">Não Conforme</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="radio" name="item-${offset + idx}" value="NA" class="h-5 w-5">
            <span class="text-gray-600">Não Aplicável</span>
          </label>
        </div>
      `;
      section.appendChild(wrapper);
    });

    formItems().appendChild(section);
    return offset + items.length;
  };

  let offset = 0;
  offset = renderGrupo("Beira Leito", beira, offset);
  offset = renderGrupo("Prontuário", pront, offset);
  offset = renderGrupo("Itens", semGrupo, offset); // fallback caso metaData ainda não tenha grupos
}

function renderImagePreviews() {
  const container = imagePreviews();
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
      removeBtn.onclick = () => {
        currentPhotos.splice(index, 1);
        renderImagePreviews();
      };
      box.appendChild(img);
      box.appendChild(removeBtn);
      container.appendChild(box);
    };
    reader.readAsDataURL(file);
  });
}

async function saveAudit() {
  if (!currentMetaKey) return;

  const auditor = auditorInput().value.trim();
  const setor   = setorInput().value.trim();
  const date    = dataInput().value;

  const prontuario = (prontuarioInput()?.value || "").trim();
  const iniciais   = (iniciaisInput()?.value   || "").trim().toUpperCase();

  if (!auditor || !setor || !date) {
    alert("Preencha Auditor, Setor e Data.");
    return;
  }
  if (!prontuario || !iniciais) {
    alert("Preencha Número do prontuário e Iniciais do paciente.");
    return;
  }

  const meta = metaData[currentMetaKey];
  const checked = Array.from(document.querySelectorAll<HTMLInputElement>("#form-view input[type='radio']:checked"));
  if (checked.length !== meta.items.length) {
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

  const audit = {
    idLocal: `${Date.now()}`,
    MetaKey: currentMetaKey,
    Auditor: auditor,
    Setor: setor,
    DataAuditoria: date,
    ProntuarioNumero: prontuario,   // novos campos
    PacienteIniciais: iniciais,     // novos campos
    statusSync: "pending",          // será "synced" após enviar ao SharePoint
  };

  const answers: { itemIndex: number; resposta: Resp }[] = checked.map((input) => {
    const index = Number(input.name.split("-")[1]);
    return { itemIndex: index, resposta: input.value as Resp };
  });

  // salva offline primeiro
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
      {
        id: `${audit.idLocal}-${i}`,
        auditId: audit.idLocal,
        name: compressed[i].name,
        blob: compressed[i],
        size: compressed[i].size,
      },
      `${audit.idLocal}-${i}`
    );
  }

  // tenta sincronizar agora
  try {
    loading().classList.remove("hidden");
    const spId = await createAuditoria({
      MetaKey: audit.MetaKey,
      Auditor: audit.Auditor,
      Setor: audit.Setor,
      DataAuditoria: audit.DataAuditoria,
      ProntuarioNumero: audit.ProntuarioNumero,   // novos campos
      PacienteIniciais: audit.PacienteIniciais,   // novos campos
    });

    for (const a of answers) {
      await addResposta(spId, a.itemIndex, a.resposta);
    }

    const allPhotos = await db.getAllFromIndex("photos", "byAudit", audit.idLocal);
    for (const p of allPhotos) {
      await uploadFoto(spId, new File([p.blob], p.name, { type: p.blob.type }));
    }

    await updateAuditoria(spId, {}); // opcional: apenas para versionar
    (audit as any)["statusSync"] = "synced";
    (audit as any)["idSp"] = spId;
    await db.put("audits", audit, audit.idLocal);
    alert("Auditoria salva e sincronizada!");
  } catch (e) {
    console.error("Falha ao sincronizar agora, ficará pendente:", e);
    alert("Sem rede/permissão no SharePoint. Salvamos offline e vamos sincronizar quando houver conexão.");
  } finally {
    loading().classList.add("hidden");
  }

  if (confirm("Deseja gerar o PDF agora?")) {
    await generatePdfPage(audit.idLocal);
  }

  showView("metas");
}

// Salvar rascunho local (botão opcional #save-draft-button)
async function saveDraft() {
  if (!currentMetaKey) return;

  const audit = {
    idLocal: `${Date.now()}`,
    MetaKey: currentMetaKey,
    Auditor: auditorInput().value.trim(),
    Setor: setorInput().value.trim(),
    DataAuditoria: dataInput().value,
    ProntuarioNumero: (prontuarioInput()?.value || "").trim(),
    PacienteIniciais: (iniciaisInput()?.value || "").trim().toUpperCase(),
    statusSync: "draft",
  };

  const db = await dbp;
  await db.put("audits", audit, audit.idLocal);

  // respostas parciais
  const radiosMarcados = Array.from(
    document.querySelectorAll<HTMLInputElement>("#form-view input[type='radio']:checked")
  );
  for (const input of radiosMarcados) {
    const index = Number(input.name.split("-")[1]);
    await db.put(
      "answers",
      { itemIndex: index, resposta: input.value as Resp, auditId: audit.idLocal },
      `${audit.idLocal}-${index}`
    );
  }

  // fotos já adicionadas
  for (let i = 0; i < Math.min(currentPhotos.length, 5); i++) {
    await db.put(
      "photos",
      {
        id: `${audit.idLocal}-${i}`,
        auditId: audit.idLocal,
        name: currentPhotos[i].name,
        blob: currentPhotos[i],
        size: currentPhotos[i].size,
      },
      `${audit.idLocal}-${i}`
    );
  }

  alert("Rascunho salvo no dispositivo.");
}

async function generatePdfPage(auditIdLocal: string) {
  const db = await dbp;
  const audit = await db.get("audits", auditIdLocal);
  const meta = metaData[audit.MetaKey];

  const formattedDate = new Date(audit.DataAuditoria).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  pdfContent().innerHTML = `
    <style>
      body { font-family: Helvetica, Arial, sans-serif; font-size: 10px; }
      h1 { font-size: 18px; color: #0A3A6B; border-bottom: 2px solid #0A3A6B; padding-bottom: 5px; margin-bottom: 15px;}
      h2 { font-size: 14px; color: #1E63A1; margin-top: 20px; margin-bottom: 10px; }
      .info { background-color: #F0F5FA; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
      .item { margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
      .conforme { color: green; }
      .nao-conforme { color: red; }
      .nao-aplicavel { color: grey; }
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
    ${meta.items.map((t: any, i: number) => {
      const label = typeof t === "string" ? t : (t.label ?? String(t));
      return `<div class="item">
        <p>${audit.MetaKey.replace("meta", "")}.${i + 1} - ${label}</p>
        <p>Resposta: <span class="">(ver dashboard)</span></p>
      </div>`;
    }).join("")}
  `;

  const photos = (await db.getAll("photos"))
    .filter((p: any) => p.auditId === auditIdLocal)
    .map((p: any) => new File([p.blob], p.name, { type: p.blob.type }));
  await gerarPDF(audit, photos);
  pdfContent().innerHTML = "";
}

// listeners
function setupListeners() {
  document.getElementById("save-form-button")!.addEventListener("click", saveAudit);
  document.getElementById("cancel-form-button")!.addEventListener("click", () => showView("metas"));
  document.getElementById("add-photo-button")!.addEventListener("click", () => {
    const count = currentPhotos.length;
    if (count >= 5) { alert("Máximo de 5 fotos."); return; }
    photoInput().click();
  });
  photoInput().addEventListener("change", async (e: any) => {
    const file: File | undefined = e.target.files?.[0];
    if (!file) return;
    if (currentPhotos.length >= 5) { alert("Máximo de 5 fotos."); e.target.value = ""; return; }
    currentPhotos.push(file);
    renderImagePreviews();
    e.target.value = "";
  });

  // salvar rascunho (se existir o botão)
  document.getElementById("save-draft-button")?.addEventListener("click", saveDraft);

  // abrir formulário ao escolher meta
  window.addEventListener("open-form", (ev: any) => {
    renderForm(ev.detail.metaKey as MetaKey);
  });
}

// carrega usuário e só então arma os listeners (garante que o auditor vem preenchido)
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const u = await getCurrentUser();
    currentUser = { id: u.id, displayName: u.displayName, isAdmin: u.isAdmin };
  } catch (e) {
    console.warn("Não consegui obter o usuário atual:", e);
  }
  setupListeners();
});
