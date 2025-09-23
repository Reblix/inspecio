import { dbp } from "../core/db";
import { metaData } from "../core/metaData";
import Chart from "chart.js/auto";

function byId<T extends HTMLElement = HTMLElement>(id: string) {
  return document.getElementById(id) as T;
}

let adherenceChart: Chart | null = null;
let complianceChart: Chart | null = null;

async function updateDashboard() {
  const db = await dbp;
  const audits = await db.getAll("audits");
  const answers = await db.getAll("answers");

  const metaKeys = Object.keys(metaData) as (keyof typeof metaData)[];

  const metaStats: Record<string, {
    title: string;
    conforme: number;
    naoConforme: number;
    totalItems: number;
    itemDetails: Record<number, { text: string; conforme: number; naoConforme: number }>;
  }> = {};

  metaKeys.forEach(key => {
    metaStats[key] = {
      title: metaData[key].title,
      conforme: 0,
      naoConforme: 0,
      totalItems: 0,
      itemDetails: {}
    };
    metaData[key].items.forEach((txt, idx) => {
      metaStats[key].itemDetails[idx] = { text: txt, conforme: 0, naoConforme: 0 };
    });
  });

  answers.forEach((ans: any) => {
    const audit = audits.find((a: any) => a.idLocal === ans.auditId);
    if (!audit) return;
    const metaKey = audit.MetaKey as string;
    if (!metaStats[metaKey]) return;
    if (ans.resposta === "C") metaStats[metaKey].conforme++;
    if (ans.resposta === "NC") metaStats[metaKey].naoConforme++;
    const det = metaStats[metaKey].itemDetails[ans.itemIndex];
    if (det) {
      if (ans.resposta === "C") det.conforme++;
      if (ans.resposta === "NC") det.naoConforme++;
    }
  });

  let totalC = 0, totalNC = 0;
  Object.values(metaStats).forEach(s => {
    s.totalItems = s.conforme + s.naoConforme;
    totalC += s.conforme; totalNC += s.naoConforme;
  });

  const totalGeral = totalC + totalNC;
  const geralAdherence = totalGeral > 0 ? ((totalC / totalGeral) * 100).toFixed(1) : "0";
  byId("geral-adherence").textContent = `${geralAdherence}%`;
  byId("total-audits").textContent = String(audits.length);
  const auditedMetaKeys = new Set(audits.map((a: any) => a.MetaKey));
  byId("audited-metas").textContent = String(auditedMetaKeys.size);
  byId("total-conformidades").textContent = String(totalC);
  byId("total-nao-conformidades").textContent = String(totalNC);

  // Estatísticas por meta (cards)
  const metaStatsContainer = byId("meta-stats-container");
  metaStatsContainer.innerHTML = "";
  Object.keys(metaStats).forEach(k => {
    const m = metaStats[k];
    if (m.conforme > 0 || m.naoConforme > 0) {
      const div = document.createElement("div");
      div.className = "p-4 bg-gray-50 rounded-lg flex justify-between items-center border-l-4 border-blue-500";
      div.innerHTML = `
        <div><p class="font-bold text-gray-800">${m.title}</p></div>
        <div class="text-right flex space-x-6 items-center">
          <p class="text-green-600 text-lg">Conformes: <span class="font-bold">${m.conforme}</span></p>
          <p class="text-red-500 text-lg">Não Conformes: <span class="font-bold">${m.naoConforme}</span></p>
        </div>
      `;
      metaStatsContainer.appendChild(div);
    }
  });
  if (!metaStatsContainer.childElementCount) {
    metaStatsContainer.innerHTML = '<p class="text-gray-500 text-center">Nenhuma auditoria foi realizada ainda.</p>';
  }

  // Detalhe por item (tabela)
  const body = byId<HTMLTableSectionElement>("item-details-body");
  body.innerHTML = "";
  Object.keys(metaStats).forEach(metaKey => {
    const m = metaStats[metaKey];
    Object.keys(m.itemDetails).forEach((idxStr) => {
      const idx = Number(idxStr);
      const item = m.itemDetails[idx];
      const total = item.conforme + item.naoConforme;
      if (total > 0) {
        const tr = document.createElement("tr");
        tr.className = "border-b hover:bg-gray-50";
        tr.innerHTML = `
          <td class="py-2 px-4">${m.title.split(":")[0]}</td>
          <td class="py-2 px-4">${metaKey.replace("meta","")}.${idx + 1}</td>
          <td class="py-2 px-4 text-green-600">${item.conforme}</td>
          <td class="py-2 px-4 text-green-600">${((item.conforme / total) * 100).toFixed(1)}%</td>
          <td class="py-2 px-4 text-red-500">${item.naoConforme}</td>
          <td class="py-2 px-4 text-red-500">${((item.naoConforme / total) * 100).toFixed(1)}%</td>
        `;
        body.appendChild(tr);
      }
    });
  });

  // Gráficos
  const labels = Object.values(metaStats).map(s => s.title.split(":")[0]);
  const adherence = Object.values(metaStats).map(s => s.totalItems > 0 ? (s.conforme / s.totalItems) * 100 : 0);

  if (adherenceChart) adherenceChart.destroy();
  adherenceChart = new Chart(document.getElementById("adherence-chart") as HTMLCanvasElement, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Aderência (%)", data: adherence, borderWidth: 1 }]
    },
    options: { scales: { y: { beginAtZero: true, max: 100 } }, responsive: true }
  });

  if (complianceChart) complianceChart.destroy();
  complianceChart = new Chart(document.getElementById("compliance-chart") as HTMLCanvasElement, {
    type: "doughnut",
    data: { labels: ["Conformidades", "Não Conformidades"], datasets: [{ data: [totalC, totalNC] }] },
    options: { responsive: true, cutout: "70%" }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // atualiza quando volta para dashboard
  document.getElementById("nav-dashboard")!.addEventListener("click", () => {
    // só recalcula se o canvas estiver visível
    setTimeout(updateDashboard, 50);
  });
  // primeira carga
  setTimeout(updateDashboard, 100);
});

export { updateDashboard };
