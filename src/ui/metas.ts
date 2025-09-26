// src/ui/metas.ts
import { metaData, MetaKey } from "../core/metaData";

const $ = (selector: string) => document.querySelector(selector) as HTMLElement | null;

/**
 * Renderiza a grade de botões de metas na tela de "Nova Auditoria".
 * Esta função é chamada quando a view 'metas' se torna ativa.
 */
function renderMetasGrid() {
  // O container está no index.html dentro da section data-view="metas"
  const gridContainer = $("#metas-grid-container"); 
  if (!gridContainer) {
    console.error("Elemento '#metas-grid-container' não encontrado no HTML.");
    return;
  }

  gridContainer.innerHTML = ""; // Limpa o conteúdo anterior para evitar duplicatas

  (Object.keys(metaData) as MetaKey[]).forEach((key) => {
    const meta = metaData[key];
    const btn = document.createElement("button");
    btn.className = "p-6 bg-white rounded-2xl shadow-md text-left transition-transform transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-sky-500";
    btn.innerHTML = `
      <div class="flex items-center justify-center w-12 h-12 rounded-full bg-sky-100 text-sky-700 mb-4">
        <span class="text-xl">🎯</span>
      </div>
      <h3 class="text-lg font-bold text-slate-800">${meta.title.split(":")[0]}</h3>
      <p class="text-sm text-slate-600">${meta.title.split(":")[1] ?? ""}</p>
    `;
    
    btn.addEventListener("click", () => {
      // 1. Dispara um evento para que o módulo de formulário saiba qual meta renderizar
      window.dispatchEvent(new CustomEvent("open-form", { detail: { metaKey: key } }));
      
      // 2. Altera a URL (hash) para acionar o roteador no main.ts para mostrar a view do formulário
      location.hash = "form";
    });

    gridContainer.appendChild(btn);
  });
}

/**
 * Ouve o evento global 'view:entered' disparado pelo main.ts.
 * Se a view for 'metas', renderiza o conteúdo.
 */
window.addEventListener("view:entered", (ev: Event) => {
    const detail = (ev as CustomEvent).detail;
    if (detail?.view === "metas") {
        renderMetasGrid();
    }
});

