import { getSp } from "./pnp";
import "@pnp/sp/files"; import "@pnp/sp/files/web";
import "@pnp/sp/folders"; import "@pnp/sp/folders/web";

const LIST_AUDITORIAS = "Auditorias";
const LIST_RESPOSTAS  = "RespostasAuditoria";
const LIB_FOTOS       = "FotosAuditoria";

export async function createAuditoria(aud: {
  MetaKey: string; Auditor: string; Setor: string; DataAuditoria: string;
  ProntuarioNumero: string; PacienteIniciais: string;
}) {
  const sp = await getSp();
  const r = await sp.web.lists.getByTitle(LIST_AUDITORIAS).items.add({
    Title: `${aud.MetaKey} - ${aud.Setor}`,
    MetaKey: aud.MetaKey,
    Auditor: aud.Auditor,
    Setor: aud.Setor,
    DataAuditoria: aud.DataAuditoria,
    ProntuarioNumero: aud.ProntuarioNumero,
    PacienteIniciais: aud.PacienteIniciais,
  });
  return r.data.Id as number;
}

export async function addResposta(auditId: number, itemIndex: number, resp: "C"|"NC"|"NA") {
  const sp = await getSp();
  await sp.web.lists.getByTitle(LIST_RESPOSTAS).items.add({
    ItemIndex: itemIndex,
    Resposta: resp,
    AuditoriaIDId: auditId, // Lookup usa <NomeInterno>Id
  });
}

export async function updateAuditoria(id: number, fields: Partial<{
  MetaKey: string; Auditor: string; Setor: string; DataAuditoria: string;
  ProntuarioNumero: string; PacienteIniciais: string;
}>) {
  const sp = await getSp();
  await sp.web.lists.getByTitle("Auditorias").items.getById(id).update(fields, "*");
}


export async function uploadFoto(auditId: number, file: File) {
  const sp = await getSp();
  const folder = sp.web.lists.getByTitle(LIB_FOTOS).rootFolder;

  const res = await folder.files.addUsingPath(encodeURIComponent(file.name), file, { Overwrite: true });

  const serverRel =
    (res as any)?.data?.ServerRelativeUrl ??
    (res as any)?.ServerRelativeUrl ??
    (res as any)?.file?.ServerRelativeUrl ??
    (res as any)?.file?.serverRelativeUrl;

  if (!serverRel) throw new Error("Sem ServerRelativeUrl");
  const uploadedFile = sp.web.getFileByServerRelativePath(serverRel);
  const item = await uploadedFile.getItem();
  await item.update({ AuditoriaID: auditId }, "*"); // coluna numérica na biblioteca
  return res;
}
