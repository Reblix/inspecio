export type MetaKey =
  | "meta1" | "meta2" | "meta3" | "meta4" | "meta4_1" | "meta5" | "meta6" | "meta6_1";

export interface MetaDef {
  title: string;
  items: string[];
}

export const metaDataRaw: Record<MetaKey, MetaDef> = {
  meta1: {
    title: "Meta 1: Identificação Correta do Paciente",
    items: [
      "Paciente possui a pulseira/etiqueta de identificação.",
      "A pulseira/etiqueta possui os marcadores descritos no protocolo de Identificação do Paciente, de forma íntegra e legível?",
      "Evidenciada a colocação da pulseira e/ou etiqueta de identificação no momento do cadastro do paciente?",
      "Evidenciada a sinalização de alergia no momento do primeiro atendimento?",
      "Evidenciado que paciente/acompanhante/responsável estão cientes do motivo e importância do uso da pulseira de identificação?",
      "Evidenciado dupla pulseira nos casos das Parturientes e com duas pulseiras no RN (perna e braço)?",
      "O paciente relata que o colaborador realiza a checagem com o nome completo e data de nascimento antes de qualquer intervenção diagnóstica, terapêutica ou medicamentosa/dieta entregue?",
      "Todos os impressos do prontuário estão identificados com os marcadores do protocolo de Identificação do Paciente?",
      "Evidenciado a dupla conferência de Identificação antes da administração de medicamentos (Assistenciais, SADT's, Centro Cirúrgico, Distribuição de Dietas e outros).",
      "A identificação das infusões venosas possuem os marcadores descritos no protocolo de Identificação do Paciente?",
      "Identificação correta dos Pacientes em condições clínicas ou emocionais desfavoráveis (sem documentação ou confuso)?",
      "Identificação correta para os casos de homônimos?",
      "A identificação das dietas oferecidas possuem os indicadores descritos no Protocolo de Identificação do Paciente.",
      "Todos os frascos para amostra de exames são identificados com os indicadores descritos no protocolo de Identificação do Paciente.",
      "Todas os frascos para as amostras de exames, são conferidas em conjunto aos pacientes / familiares / acompanhantes?"
    ]
  },
  meta2: {
    title: "Meta 2: Melhorar a Comunicação",
    items: [
      "O registro das informações nos prontuários são claros, objetivos, com data, hora, evidência do profissional que realizou?",
      "Evidência do conhecimento do paciente / acompanhante do tratamento e das orientações pertinentes a assistência?",
      "Quadro beira leito com informações atualizadas e completas?",
      "Termos de Consentimentos aplicados, com orientações adequadas e esclarecedoras, com assinaturas do paciente e ou responsável e profissional que orientou, data e horário?",
      "A equipe multiprofissional possui comunicação eficaz, principalmente nos casos relacionados a emergências, solicitação de avaliação, coleta ou realização de exames, transferências/remoções, entre outros?",
      "Evidência de realização em todos os transportes internos do paciente (check list de transporte interno)?",
      "Quadro Kanban com informações atualizadas e completas?",
      "Preenchimento do formulário SBAR completo (Transferência interna)"
    ]
  },
  meta3: {
    title: "Meta 3: Segurança na Prescrição, Uso e Administração de Medicamentos",
    items: [
      "Prescrição médica realizada diariamente?",
      "Evidenciado em prontuário que a prescrição médica está sendo cumprida? (Checagem) Observar justificativa e tempo de atraso na checagem, se houver.",
      "Todas as prescrições médicas são avaliadas pelos Farmacêuticos antes da dispensação?",
      "Há método implantado de distribuição de medicamentos (individualizado ou dose unitária)?",
      "Evidência de dupla checagem antes da dispensação dos medicamentos farmácia/enfermagem?",
      "São aplicados os 13 (treze) certos da Medicação antes da administração?",
      "No momento da administração de medicamentos de alta vigilância é realizada a dupla checagem?",
      "Evidência de administração de medicamentos de alta vigilância realizada pelo profissional enfermeiro?",
      "A identificação no rótulo de medicamento em curso está correta? (Identificação do paciente, droga infundida, dose, horário de instalação e profissional responsável)",
      "Evidenciada reação adversa após a administração de medicamentos? Se sim, a conduta imediata foi adequada?"
    ]
  },
  meta4: {
    title: "Meta 4: Cirurgia Segura",
    items: [
      "Realizada conferência dos dados do paciente com a pulseira de identificação?",
      "Paciente sabe informar o procedimento cirúrgico que será realizado?",
      "Sítio cirúrgico demarcado?",
      "Presença de avaliação pré-anestésico?",
      "Presença do termo de consentimento para a realização da cirurgia e da anestesia devidamente preenchidos e assinados?",
      "Os materiais necessários estão presentes e dentro do prazo de esterilização?",
      "Paciente apresenta alergia? Se SIM, paciente em uso de pulseira de identificação vermelha?",
      "Realizada conferência do funcionamento do equipamento anestésico antes da entrada do paciente na sala operatória?",
      "Necessidade de OPME ou materiais especiais, se SIM estão disponíveis?",
      "Risco de perda sanguínea > 500 ml (7 ml/kg em crianças)? Se SIM, evidenciada a disponibilidade de hemocomponente?",
      "Monitorização instalada e funcionante (frequência cardíaca, pressão arterial, oximetria)?",
      "Cirurgião, anestesiologista e equipe de enfermagem confirmam verbalmente: Time out?",
      "Realizado preenchimento completo do quadro de time out? (Obs. Avaliar tempo final da cirurgia no SAEP)",
      "A profilaxia antimicrobiana foi realizada em até 60 minutos antes do inicio do procedimento cirúrgico?",
      "Realizada e evidenciada a contagem de compressas, gazes, agulhas e instrumentais antes/após o procedimento cirúrgico e antes do paciente sair da sala?",
      "Identificada e registrada amostras para análises clinicas e exame histopatológico, quando houver?",
      "Evidenciadas ocorrências inesperadas (duração da operação/perda sanguínea/problemas com materiais, equipamentos ou instrumentais / alergia medicamentosa)?",
      "Registro completo do procedimento intraoperatório, incluindo procedimento executado pelo médico cirurgião?",
      "Registro completo do procedimento pelo anestesiologista?",
      "Presença do prontuário completo?",
      "Acionado membro da equipe multi para avaliação do paciente, em caso de intercorrências?",
      "Alta do paciente realizada pelo anestesiologista?",
      "Registro completo da evolução cuidados de enfermagem?",
      "Paciente com necessidade de uso de antibiótico terapêutico?"
    ]
  },
  meta4_1: {
    title: "Meta 4.1: Parto Seguro",
    items: [
      "Realizada conferência dos dados do paciente com a pulseira de identificação?",
      "Paciente sabe informar o procedimento cirúrgico que será realizado?",
      "Mãe com necessidade de transferência hospitalar?",
      "Partograma iniciado (somente caso de parto normal)?",
      "Presença de avaliação pré anestésica?",
      "Presença do termo de consentimento para a realização da cirurgia e da anestesia devidamente preenchidos e assinados?",
      "Paciente apresenta alergia? Se SIM, paciente em uso de pulseira de identificação vermelha?",
      "Paciente com indicação de uso de antibiótico? (Ex. Bolsa rota - Obrigatório Conforme protocolo)",
      "Paciente com indicação de uso de sulfato de magnésio e/ou tratamento anti hipertensivo? (ex. DHEG)",
      "Acompanhante incentivado a estar presente no parto?",
      "Realizada orientação ao acompanhante quanto a proibição do uso de adornos na unidade e orientações gerais do CC?",
      "Confirmar que a paciente ou acompanhante pedirão ajuda durante o parto, se necessário (dor abdominal/dor de cabeça forte ou distúrbio visual), nos casos de parto normal",
      "Monitorização instalada e funcionante (frequência cardíaca, pressão arterial, oximetria)?",
      "Ginecologista, anestesiologista, pediatra e equipe de enfermagem confirmam verbalmente: Time out realizado?",
      "Os materiais necessários estão presentes e dentro do prazo de esterilização?",
      "Realizado preenchimento completo do quadro de time out? (Obs. Avaliar tempo final da cirurgia no SAEP)",
      "A profilaxia antimicrobiana foi realizada em até 60 minutos antes do inicio do procedimento cirúrgico?",
      "Realizada conferência do funcionamento do equipamento anestésico antes da entrada do paciente na sala operatória?",
      "Confirmada a existência de material necessário para os cuidados do RN?",
      "Realizada e evidenciada a contagem de compressas, gazes, agulhas e instrumentais antes/após o procedimento cirúrgico e antes do paciente sair da sala?",
      "Paciente apresenta sangramento anormal?",
      "Paciente com necessidade de uso de antibiótico?",
      "Paciente com indicação de uso de sulfato de magnésio e/ou tratamento anti-hipertensivo? (Ex. DHEG)",
      "RN com indicação de transferência hospitalar?",
      "RN com indicação de uso de antibiótico?",
      "RN com necessidade de cuidados especiais e monitorização?",
      "Amamentação e contacto pele com pele iniciados (se a mãe estiver bem, e após exames HIV e VDRL)?",
      "Alta da RPA realizada pelo médico anestesista?",
      "Paciente com necessidade de uso de antibiótico?",
      "Confirmado com a paciente / acompanhantes pedirão ajuda, se houver sinais de perigo? (Observar orientações da equipe)",
      "Paciente apresenta intercorrências? Se SIM, adiar a alta e tratar",
      "RN com indicação de uso de antibiótico, caso necessário?",
      "RN em aleitamento materno exclusivo?",
      "Evidencia em prontuário que o RN tem boa pega e sucção e foi orientada quanto aleitamento materno exclusivo?"
    ]
  },
  meta5: {
    title: "Meta 5: Higienização das Mãos",
    items: [
      "Realizado higienização das mãos antes do contato com paciente - Técnica e tempo adequados",
      "Realizado higienização das mãos antes de procedimentos assépticos - Técnica e tempo adequados",
      "Realizado higienização das mãos após contato com fluidos corpóreos - Técnica e tempo adequados",
      "Realizado higienização das mãos após contato com os pacientes - Técnica e tempo adequados",
      "Realizado higienização das mãos após áreas próxima a pacientes - Técnica e tempo adequados"
    ]
  },
  meta6: {
    title: "Meta 6: Prevenção de Queda",
    items: [
      "Paciente foi avaliado na admissão quanto ao risco de queda de acordo com escala adequada? (Morse ou Humpty Dumpty)",
      "Paciente está sendo avaliado diariamente, com evidências em prontuário de sua reclassificação?",
      "Paciente identificado de acordo com classificação de risco de queda (Pulseira lilás)",
      "As medidas básicas de segurança quanto ao risco de queda estão devidamente aplicadas? (Grades do leito/maca elevadas, rodas de cadeira de rodas/maca travados, piso molhado sinalizado, paciente acompanhado, uso de coxins de proteção, entre outros).",
      "Evidenciado que paciente e acompanhante estão cientes do risco de queda?",
      "Prescrição de Enfermagem está de acordo com o Protocolo de Prevenção de Quedas?",
      "Evidenciado em prontuário que a prescrição de Enfermagem está sendo cumprida? (Checagem dos cuidados)"
    ]
  },
  meta6_1: {
    title: "Meta 6.1: Reduzir Risco de Lesão por Pressão (LPP)",
    items: [
      "Paciente foi avaliado na admissão quanto ao risco de LPP de acordo com escala adequada? (Braden ou Braden Q)",
      "São avaliados fatores chaves para o desenvolvimento de LPP (Percepção sensorial, umidade, atividade, mobilidade, nutrição, fricção e cisalhamento)?",
      "Paciente está sendo avaliado diariamente, com evidências em prontuário de sua reclassificação?",
      "A Prescrição de Enfermagem está de acordo com o Protocolo de Prevenção de Lesão de Pressão?",
      "Evidenciado sistemática de controle para mudança de decúbito? (Uso do relógio)",
      "Possui mecanismo para minimizar a redistribuição da pressão (proeminências ósseas, pele e mobilidade)?",
      "Possui mecanismo para minimizar a redistribuição da pressão (proeminências ósseas aparentes, pele debilitada e mobilidade reduzida)?",
      "Evidenciada sistemática de descompressão? (uso de coxim para elevação de calcâneo e cabeça, uso de colchão pneumático, terapia multicamada, elevação da bolsa escrotal, etc)",
      "Pressão e fixação de dispositivos médicos, é adequada? (troca diária e sem sujidades de TOT, TQT, GTT, SVD e dispositivo urinário externo)",
      "Está definido a conduta técnica para cada tipo de lesão de pele e LPP?",
      "É realizada avaliação nutricional aos pacientes classificados com risco de LPP de acordo com o protocolo?"
    ]
  }
};

import { applyGrouping } from "./metaGroupRules";
export const metaData = applyGrouping(metaDataRaw);
