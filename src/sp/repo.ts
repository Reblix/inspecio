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
  const folder = sp.web.lists.getByTitle(LIB_FOTOS).rootFolder;

  // upload (overwrite)
  const res = await folder.files.addUsingPath(
    encodeURIComponent(file.name), // bom encode para nomes
    file,
    { Overwrite: true }
  );

  // Em diferentes versões o retorno pode ser:
  // - { data: IFileInfo, file: IFile }  (várias builds)
  // - { data: IFileInfo }               (algumas)
  // Pegamos a URL relativa do arquivo de forma robusta:
  const serverRel =
    (res as any)?.data?.ServerRelativeUrl ??
    (res as any)?.ServerRelativeUrl ??
    (res as any)?.file?.serverRelativeUrl;

  // Recupera o arquivo e o ListItem para atualizar metadados
  const uploadedFile = sp.web.getFileByServerRelativePath(serverRel);
  const item = await uploadedFile.getItem();
  await item.update({ AuditoriaID: auditoriaId }, "*"); // coluna numérica
  return res;
}



