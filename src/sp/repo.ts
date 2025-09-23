import { sp } from "./pnp";

const LIST_AUDITORIAS = "Auditorias";
const LIST_RESPOSTAS  = "RespostasAuditoria";
const LIB_FOTOS       = "FotosAuditoria";

export async function createAuditoria(aud: {
  MetaKey: string; Auditor: string; Setor: string; DataAuditoria: string;
}) {
  const r = await sp.web.lists.getByTitle(LIST_AUDITORIAS).items.add({
    Title: `${aud.MetaKey} - ${aud.Setor}`,
    MetaKey: aud.MetaKey,
    Auditor: aud.Auditor,
    Setor: aud.Setor,
    DataAuditoria: aud.DataAuditoria
  });
  return r.data.Id as number;
}

export async function updateAuditoria(id: number, fields: Partial<{
  MetaKey: string; Auditor: string; Setor: string; DataAuditoria: string;
}>) {
  await sp.web.lists.getByTitle(LIST_AUDITORIAS).items.getById(id).update(fields, "*"); // If-Match: "*"
}

export async function addResposta(auditoriaId: number, itemIndex: number, resposta: "C" | "NC" | "NA") {
  await sp.web.lists.getByTitle(LIST_RESPOSTAS).items.add({
    ItemIndex: itemIndex,
    Resposta: resposta,
    AuditoriaIDId: auditoriaId // campo Lookup aponta para ID da Auditoria
  });
}

export async function uploadFoto(auditoriaId: number, file: File) {
  // envia arquivo para a biblioteca e seta metadados via ListItem
  const folder = sp.web.lists.getByTitle(LIB_FOTOS).rootFolder;
  const added = await folder.files.addUsingPath(file.name, file, { Overwrite: true });
  await added.file.listItemAllFields.update({ AuditoriaID: auditoriaId }, "*"); // coluna numérica
  return added;
}
