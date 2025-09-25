// src/core/metaGroupRules.ts
export type Group = "Beira Leito" | "Prontuário";
export type MetaItem = { id: string; label: string; group: Group };
export type MetaDefRaw = { title: string; items: (string | { label: string; group?: Group; id?: string })[] };
export type MetaDataRaw = Record<string, MetaDefRaw>;
export type MetaDef = { title: string; items: MetaItem[] };
export type MetaDataGrouped = Record<string, MetaDef>;

// Utils
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();

const slug = (s: string) =>
  norm(s).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);

// ---- Regras por meta --------------------------------------------------------
// ATENÇÃO: as frases abaixo são "gatilhos" de matching por substring.
// Se o texto do seu item contiver uma dessas expressões (ignorando acentos/caixa),
// ele entra no grupo indicado. O que não bater entra no "grupo padrão dos demais".

// META 6 — Prevenção de Queda
const M6_BEIRA = [
  "paciente identificado de acordo com classificacao de risco de queda",
  "pulseira lilas",
  "medidas basicas de seguranca quanto ao risco de queda",
  "grades do leito",
  "maca elevadas",
  "rodas de cadeira de rodas",
  "piso molhado sinalizado",
  "paciente acompanhado",
  "coxins de protecao",
  "paciente e acompanhante estao cientes do risco de queda",
];
const M6_DEFAULT_OTHERS: Group = "Prontuário";

// META 3 — Seguranca na Prescrição/Uso/Administração de Medicamentos
const M3_BEIRA = [
  "rotulo de medicamento em curso esta correta",
  "identificacao no rotulo de medicamento em curso",
  "droga infundida",
  "dose",
  "horario de instalacao",
  "profissional responsavel",
];
const M3_DEFAULT_OTHERS: Group = "Prontuário";

// META 2 — Melhorar a Comunicação
const M2_BEIRA = [
  "quadro beira leito com informacoes atualizadas",
  "quadro beira leito com informacoes completas",
];
const M2_DEFAULT_OTHERS: Group = "Prontuário";

// META 1 — Identificação Correta do Paciente
const M1_PRONT = [
  "todos os impressos do prontuario estao identificados",
  "marcadores do protocolo de identificacao do paciente",
  "dupla conferencia de identificacao antes da administracao de medicamentos",
  "identificacao das dietas oferecidas possuem os indicadores",
  "frascos para amostra de exames sao identificados",
  "frascos para as amostras de exames sao conferidas em conjunto",
  "familiares",
  "acompanhantes",
];
const M1_DEFAULT_OTHERS: Group = "Beira Leito";

// META 6.1 — Reduzir Risco de LPP
const M61_PRONT = [
  "avaliado na admissao quanto ao risco de lpp",
  "escala adequada",
  "braden",
  "braden q",
  "avaliado diariamente",
  "evidencias em prontuario de sua reclassificacao",
  "prescricao de enfermagem de acordo com o protocolo de prevencao de lesao de pressao",
  "conduta tecnica para cada tipo de lesao de pele e lpp",
  "avaliacao nutricional aos pacientes classificados com risco de lpp",
];
const M61_DEFAULT_OTHERS: Group = "Beira Leito";

// Map de regras por metaKey (ajuste as chaves para as suas reais: meta1, meta2, meta3, meta6, meta61)
const rules: Record<
  string,
  { beira?: string[]; pront?: string[]; defaultOthers: Group }
> = {
  meta6:  { beira: M6_BEIRA,  defaultOthers: M6_DEFAULT_OTHERS },
  meta3:  { beira: M3_BEIRA,  defaultOthers: M3_DEFAULT_OTHERS },
  meta2:  { beira: M2_BEIRA,  defaultOthers: M2_DEFAULT_OTHERS },
  meta1:  { pront: M1_PRONT,  defaultOthers: M1_DEFAULT_OTHERS },
  meta61: { pront: M61_PRONT, defaultOthers: M61_DEFAULT_OTHERS },
};

// Decide o grupo de um item de acordo com as regras da meta
function resolveGroup(metaKey: string, label: string): Group {
  const r = rules[metaKey];
  const L = norm(label);

  // Se o item já contém dicas de grupo no próprio texto (fallback genérico)
  if (/\bbeira\s*leito\b/.test(L)) return "Beira Leito";
  if (/\bprontuario\b/.test(L)) return "Prontuário";

  if (r) {
    // metas onde a lista dada é de BEIRA e "demais" vão para PRONT
    if (r.beira && r.beira.some(k => L.includes(k))) return "Beira Leito";
    if (r.pront && r.pront.some(k => L.includes(k))) return "Prontuário";
    return r.defaultOthers;
  }

  // Caso não haja regra específica, mantém tudo sem preferir lado (padrão: Prontuário)
  return "Prontuário";
}

// Aplica o agrupamento a todo o metaData "cru"
export function applyGrouping(raw: MetaDataRaw): MetaDataGrouped {
  const out: MetaDataGrouped = {} as any;

  Object.entries(raw).forEach(([metaKey, def]) => {
    const items: MetaItem[] = def.items.map((it) => {
      // Se já vier no formato objeto com group, só normaliza id/label
      if (typeof it === "object" && it && "label" in it) {
        const label = it.label!;
        const group = (it as any).group ?? resolveGroup(metaKey, label);
        const id = (it as any).id ? String((it as any).id) : slug(`${metaKey}-${label}`);
        return { id, label, group };
      }

      // Se vier como string pura
      const label = String(it);
      const group = resolveGroup(metaKey, label);
      const id = slug(`${metaKey}-${label}`);
      return { id, label, group };
    });

    out[metaKey] = { title: def.title, items };
  });

  return out;
}
