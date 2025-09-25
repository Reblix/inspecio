/* src/ui/dashboard.ts
 * - Blindado contra null (helpers e ?.).
 * - Sem `declare global`; sem `window.Chart` (usa `globalThis`).
 * - Gráficos só inicializam se existir <canvas> E se o Chart.js estiver presente.
 */
import Chart from "chart.js/auto";
// ------------------------- helpers -------------------------
const $id = <T extends HTMLElement = HTMLElement>(id: string): T | null =>
  document.getElementById(id) as T | null;

const setText = (id: string, value: string | number) => {
  const el = $id(id);
  if (el) el.textContent = String(value);
};

const onId = (id: string, ev: string, handler: (e: Event) => void) => {
  const el = $id(id);
  el?.addEventListener(ev as any, handler as any);
};

const on = (
  root: Document | Element,
  ev: string,
  selector: string,
  handler: (e: Event, target: Element) => void
) => {
  root.addEventListener(ev as any, (e: Event) => {
    const t = (e.target as Element | null)?.closest?.(selector);
    if (t) handler(e, t as Element);
  });
};

const safeNum = (v: unknown, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

// ------------------------- estado (mock inicial) -------------------------
// Troque por dados reais quando conectar nas suas fontes.
const state = {
  kpis: {
    aderenciaGeral: 0,
    auditoriasRealizadas: 0,
    metasAuditadas: 0,
    conformidades: 0,
    naoConformidades: 0,
  },
  aderenciaPorMeta: {
    labels: ['Meta 1','Meta 2','Meta 3','Meta 4.1','Meta 5','Meta 6','Meta 6.1'],
    values: [0, 0, 0, 0, 0, 0, 0],
  },
  confVsNao: { conformes: 0, naoConformes: 0 },
};

// ------------------------- KPIs -------------------------
function hydrateKPIs() {
  setText('kpiAderenciaGeral', `${safeNum(state.kpis.aderenciaGeral)}%`);
  setText('kpiAuditoriasRealizadas', safeNum(state.kpis.auditoriasRealizadas));
  setText('kpiMetasAuditadas', safeNum(state.kpis.metasAuditadas));
  setText('kpiConformidades', safeNum(state.kpis.conformidades));
  setText('kpiNaoConformidades', safeNum(state.kpis.naoConformidades));
}

// ------------------------- gráficos -------------------------
let chartAderencia: any | null = null;
let chartConfxNao: any | null = null;

// pega a referência global do Chart injetado pelo CDN (se existir)
const ChartGlobal: any | undefined = (globalThis as any)?.Chart;

function initCharts() {
  if (!ChartGlobal) {
    console.warn('[dashboard] Chart.js não encontrado — gráficos ignorados.');
    return;
  }

  // Aderência por Meta
  const cv1 = $id<HTMLCanvasElement>('chartAderenciaMeta');
  if (cv1) {
    chartAderencia?.destroy?.();
    chartAderencia = new ChartGlobal(cv1.getContext('2d'), {
      type: 'bar',
      data: {
        labels: state.aderenciaPorMeta.labels,
        datasets: [{ label: 'Aderência (%)', data: state.aderenciaPorMeta.values, borderWidth: 1 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, max: 100, ticks: { callback: (v: number) => `${v}%` } } },
        plugins: { legend: { display: true }, tooltip: { enabled: true } },
      },
    });
  }

  // Conformidade vs Não Conformidade
  const cv2 = $id<HTMLCanvasElement>('chartConformidadeVsNao');
  if (cv2) {
    chartConfxNao?.destroy?.();
    chartConfxNao = new ChartGlobal(cv2.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Conformidades', 'Não Conformidades'],
        datasets: [{ label: 'Quantidade', data: [state.confVsNao.conformes, state.confVsNao.naoConformes], borderWidth: 1 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false } },
      },
    });
  }
}

function refreshCharts() {
  if (chartAderencia) {
    chartAderencia.data.labels = state.aderenciaPorMeta.labels;
    chartAderencia.data.datasets[0].data = state.aderenciaPorMeta.values;
    chartAderencia.update();
  }
  if (chartConfxNao) {
    chartConfxNao.data.datasets[0].data = [state.confVsNao.conformes, state.confVsNao.naoConformes];
    chartConfxNao.update();
  }
}

// ------------------------- navegação (sidebar) -------------------------
function initSidebarNav() {
  const nav = $id('sidebarNav');
  if (!nav) return;

  const setActiveFromHash = () => {
    const hash = (location.hash.replace(/^#/, '') || 'dashboard').toLowerCase();
    document.querySelectorAll('#sidebarNav a[data-route]').forEach((el) => {
      (el as HTMLElement).dataset.active = 'false';
    });
    const current = nav.querySelector(`a[data-route="${hash}"]`) as HTMLElement | null;
    if (current) current.dataset.active = 'true';

    // Se você usa views por hash, chame aqui:
    // showView(hash)
  };

  on(nav, 'click', 'a[data-route]', (e, target) => {
    e.preventDefault();
    const route = (target as HTMLElement).getAttribute('data-route') || 'dashboard';
    location.hash = route;
    setActiveFromHash();
  });

  window.addEventListener('hashchange', setActiveFromHash);
  setActiveFromHash();
}

// ------------------------- binds de botões (exemplos) -------------------
function initButtons() {
  onId('btnRecarregarKPIs', 'click', () => hydrateKPIs());
  onId('btnRecarregarGraficos', 'click', () => refreshCharts());
  onId('btnZerarDados', 'click', () => {
    state.kpis = { aderenciaGeral: 0, auditoriasRealizadas: 0, metasAuditadas: 0, conformidades: 0, naoConformidades: 0 };
    state.aderenciaPorMeta.values = state.aderenciaPorMeta.values.map(() => 0);
    state.confVsNao = { conformes: 0, naoConformes: 0 };
    hydrateKPIs();
    refreshCharts();
  });
}

// ------------------------- inicialização -------------------------
function initDashboard() {
  hydrateKPIs();
  initCharts();
  initSidebarNav();
  initButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
