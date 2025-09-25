// src/sp/repo.ts
import { getSp } from "./pnp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/files";
import "@pnp/sp/folders"; // <-- necessário para rootFolder, getFolderByServerRelativePath, etc.

const LIST_AUDITORIAS = import.meta.env.VITE_SP_LIST_AUDITORIAS || "Auditorias";
const LIST_RESPOSTAS  = import.meta.env.VITE_SP_LIST_RESPOSTAS  || "RespostasAuditoria";
const LIB_FOTOS       = import.meta.env.VITE_SP_LIB_FOTOS       || "FotosAuditoria";

export async function createAuditoria(aud: {
  MetaKey: string; Auditor: string; Setor: string; DataAuditoria: string;
  ProntuarioNumero?: string; PacienteIniciais?: string;
}) {
  const sp = getSp();
  const r = await sp.web.lists.getByTitle(LIST_AUDITORIAS).items.add({
    Title: `${aud.MetaKey} - ${aud.Setor}`,
    MetaKey: aud.MetaKey,
    Auditor: aud.Auditor,
    Setor: aud.Setor,
    DataAuditoria: aud.DataAuditoria,
    ProntuarioNumero: aud.ProntuarioNumero ?? "",
    PacienteIniciais: (aud.PacienteIniciais ?? "").toUpperCase(),
  });
  return r.data.Id as number;
}

export async function updateAuditoria(id: number, fields: Partial<{
  MetaKey: string; Auditor: string; Setor: string; DataAuditoria: string;
  ProntuarioNumero: string; PacienteIniciais: string;
}>) {
  const sp = getSp();
  await sp.web.lists.getByTitle(LIST_AUDITORIAS).items.getById(id).update(fields, "*");
}

export async function addResposta(auditoriaId: number, itemIndex: number, resposta: "C" | "NC" | "NA") {
  const sp = getSp();
  await sp.web.lists.getByTitle(LIST_RESPOSTAS).items.add({
    ItemIndex: itemIndex,
    Resposta: resposta,
    AuditoriaIDId: auditoriaId, // lookup para Auditorias
  });
}

export async function uploadFoto(auditoriaId: number, file: File) {
  const sp = getSp();

  // Caminho relativo do site (ex.: "/sites/segpaciente"), a partir de VITE_SP_SITE
  const sitePath = new URL(import.meta.env.VITE_SP_SITE!).pathname.replace(/\/$/, "");
  const libPath  = `${sitePath}/${LIB_FOTOS}`; // ex.: "/sites/segpaciente/FotosAuditoria"

  // Pega a pasta raiz da biblioteca e envia o arquivo
  // (usar getFolderByServerRelativePath é o caminho mais estável)
  const folder = sp.web.getFolderByServerRelativePath(libPath);
  const res = await folder.files.addUsingPath(
    encodeURIComponent(file.name), // suporta % e #
    file,
    { Overwrite: true }
  ); // docs de addUsingPath. :contentReference[oaicite:2]{index=2}

  // Obtém a URL do arquivo recém-enviado de forma robusta (varia por versão do PnPjs)
  const serverRel =
    (res as any)?.data?.ServerRelativeUrl ??
    (res as any)?.ServerRelativeUrl ??
    (res as any)?.file?.serverRelativeUrl;

  // Atualiza metadados do item (coluna numérica "AuditoriaID" na biblioteca)
  const uploadedFile = sp.web.getFileByServerRelativePath(serverRel);
  const item = await uploadedFile.getItem();
  await item.update({ AuditoriaID: auditoriaId }, "*");

  return res;
}
