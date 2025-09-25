import { sp } from "./pnp";

const LIST_AUDITORIAS = "Auditorias";
const LIST_RESPOSTAS  = "RespostasAuditoria";
const LIB_FOTOS       = "FotosAuditoria";

// Tipos auxiliares
export type AuditoriaCreateInput = {
  MetaKey: string;
  Auditor: string;
  Setor: string;
  DataAuditoria: string;       // ISO "yyyy-MM-dd" ou compatível com coluna de data
  ProntuarioNumero: string;
  PacienteIniciais: string;
};

export type AuditoriaUpdateInput = {
  MetaKey: string;
  Auditor: string;
  Setor: string;
  DataAuditoria: string;
  ProntuarioNumero: string;
  PacienteIniciais: string;
};

// Cria item na lista "Auditorias"
export async function createAuditoria(aud: AuditoriaCreateInput) {
  const r = await sp.web.lists.getByTitle(LIST_AUDITORIAS).items.add({
    Title: `${aud.MetaKey} - ${aud.Setor}`,
    MetaKey: aud.MetaKey,
    Auditor: aud.Auditor,
    Setor: aud.Setor,
    DataAuditoria: aud.DataAuditoria,
    ProntuarioNumero: aud.ProntuarioNumero,   // << novo campo
    PacienteIniciais: aud.PacienteIniciais,   // << novo campo
  });
  return r.data.Id as number;
}

// Atualiza campos do item na lista "Auditorias"
export async function updateAuditoria(
  id: number,
  fields: Partial<AuditoriaUpdateInput>
) {
  await sp.web.lists
    .getByTitle(LIST_AUDITORIAS)
    .items.getById(id)
    .update(fields, "*"); // If-Match: "*"
}

// Adiciona uma resposta (item na lista "RespostasAuditoria")
export async function addResposta(
  auditoriaId: number,
  itemIndex: number,
  resposta: "C" | "NC" | "NA"
) {
  await sp.web.lists.getByTitle(LIST_RESPOSTAS).items.add({
    ItemIndex: itemIndex,
    Resposta: resposta,
    AuditoriaIDId: auditoriaId, // campo Lookup aponta para ID da Auditoria
  });
}

// Faz upload de uma foto e vincula ao ID da auditoria (campo numérico "AuditoriaID")
export async function uploadFoto(auditoriaId: number, file: File) {
  const folder = sp.web.lists.getByTitle(LIB_FOTOS).rootFolder;

  // Upload (overwrite)
  const res = await folder.files.addUsingPath(
    encodeURIComponent(file.name), // encode para nomes com espaços/acentos
    file,
    { Overwrite: true }
  );

  // Obtém URL relativa do arquivo (varia por versão do PnP)
  const serverRel =
    (res as any)?.data?.ServerRelativeUrl ??
    (res as any)?.ServerRelativeUrl ??
    (res as any)?.file?.serverRelativeUrl;

  // Atualiza metadados do ListItem do arquivo
  const uploadedFile = sp.web.getFileByServerRelativePath(serverRel);
  const item = await uploadedFile.getItem();

  // Nota: aqui usamos "AuditoriaID" como COLUNA NUMÉRICA na biblioteca
  await item.update({ AuditoriaID: auditoriaId }, "*");
  return res;
}
