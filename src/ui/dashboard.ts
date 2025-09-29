import { byId, on } from "../core/vanilla";
import { Chart } from "chart.js/auto";

// Estado simples para guardar os dados (substituir com dados reais)
const state = {
    aderenciaGeral: 75,
    identificacaoCorreta: 80,
    comunicacaoEfetiva: 90,
    medicamentosSeguros: 60,
    cirurgiaSegura: 85,
    higienizacaoMaos: 50,
    prevencaoQuedasLesoes: 95,
};

function renderDashboardHTML(viewElement: HTMLElement) {
    viewElement.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white p-4 rounded-2xl shadow-sm"><h4 class="text-sm text-slate-500">Aderência Geral</h4><p id="kpi-aderencia" class="text-3xl font-bold mt-1">-%</p></div>
            <div class="bg-white p-4 rounded-2xl shadow-sm"><h4 class="text-sm text-slate-500">Identificação Correta</h4><p id="kpi-identificacao" class="text-3xl font-bold mt-1">-%</p></div>
            <div class="bg-white p-4 rounded-2xl shadow-sm"><h4 class="text-sm text-slate-500">Comunicação Efetiva</h4><p id="kpi-comunicacao" class="text-3xl font-bold mt-1">-%</p></div>
            <div class="bg-white p-4 rounded-2xl shadow-sm"><h4 class="text-sm text-slate-500">Medicação Segura</h4><p id="kpi-medicamentos" class="text-3xl font-bold mt-1">-%</p></div>
        </div>
        <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-2xl shadow-sm">
                <h3 class="font-semibold text-slate-700 mb-4">Aderência Geral</h3>
                <div class="relative w-full h-64"><canvas id="chart-aderencia-geral"></canvas></div>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-sm">
                <h3 class="font-semibold text-slate-700 mb-4">Performance por Meta</h3>
                <div class="relative w-full h-64"><canvas id="chart-performance-meta"></canvas></div>
            </div>
        </div>
    `;
}

function hydrateKPIs() {
    byId("kpi-aderencia")!.textContent = `${state.aderenciaGeral}%`;
    byId("kpi-identificacao")!.textContent = `${state.identificacaoCorreta}%`;
    byId("kpi-comunicacao")!.textContent = `${state.comunicacaoEfetiva}%`;
    byId("kpi-medicamentos")!.textContent = `${state.medicamentosSeguros}%`;
}

let chartAderencia: Chart | null = null;
let chartPerformance: Chart | null = null;

function initCharts() {
    if (chartAderencia) chartAderencia.destroy();
    const ctxAderencia = (byId("chart-aderencia-geral") as HTMLCanvasElement)?.getContext("2d");
    if (ctxAderencia) {
        chartAderencia = new Chart(ctxAderencia, {
            type: 'doughnut',
            data: {
                labels: ['Aderência', 'Não Aderência'],
                datasets: [{
                    data: [state.aderenciaGeral, 100 - state.aderenciaGeral],
                    backgroundColor: ['#0ea5e9', '#e2e8f0'],
                    borderColor: '#fff',
                    borderWidth: 4,
                }]
            },
            options: { maintainAspectRatio: false, cutout: '70%' }
        });
    }

    if (chartPerformance) chartPerformance.destroy();
    const ctxPerformance = (byId("chart-performance-meta") as HTMLCanvasElement)?.getContext("2d");
    if (ctxPerformance) {
        chartPerformance = new Chart(ctxPerformance, {
            type: 'bar',
            data: {
                labels: ['Id. Correta', 'Comunicação', 'Med. Segura', 'Cir. Segura', 'Hig. Mãos', 'Prev. Quedas'],
                datasets: [{
                    label: '% Aderência',
                    data: [
                        state.identificacaoCorreta, 
                        state.comunicacaoEfetiva, 
                        state.medicamentosSeguros, 
                        state.cirurgiaSegura, 
                        state.higienizacaoMaos, 
                        state.prevencaoQuedasLesoes
                    ],
                    backgroundColor: '#38bdf8',
                    borderRadius: 8,
                }]
            },
            options: { maintainAspectRatio: false, indexAxis: 'y' }
        });
    }
}

export function initializeDashboardModule() {
    const dashboardView = document.querySelector('[data-view="dashboard"]');
    if (!dashboardView) return;

    // 1. Garante que o HTML seja renderizado primeiro
    renderDashboardHTML(dashboardView as HTMLElement);
    
    // 2. Agora que o HTML existe, preenche os dados e inicializa os gráficos
    hydrateKPIs();
    initCharts();
}

// Ouve o evento global do main.ts para saber quando ser executado
window.addEventListener("view:entered", (ev: Event) => {
    const detail = (ev as CustomEvent).detail;
    if (detail?.view === "dashboard") {
        initializeDashboardModule();
    }
});