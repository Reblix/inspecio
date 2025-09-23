import { metaData, MetaKey } from "../core/metaData";

function byId<T extends HTMLElement = HTMLElement>(id: string) {
  return document.getElementById(id) as T;
}

function showView(name: "dashboard" | "metas" | "form") {
  const v = {
    dashboard: byId("dashboard-view"),
    metas: byId("metas-view"),
    form: byId("form-view")
  };
  Object.values(v).forEach(el => el.classList.add("hidden"));
  v[name].classList.remove("hidden");
  byId("page-title").textContent =
    name === "dashboard" ? "Dashboard" :
    name === "metas" ? "Selecionar Meta" : "Formulário";
}

function renderMetasGrid() {
  const grid = byId("metas-grid");
  grid.innerHTML = "";
  (Object.keys(metaData) as MetaKey[]).forEach((key) => {
    const meta = metaData[key];
    const btn = document.createElement("button");
    btn.className =
      "p-6 bg-white rounded-2xl shadow-md text-left transition-transform transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500";
    btn.innerHTML = `
      <div class="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">🎯</div>
      <h3 class="text-lg font-bold text-gray-800">${meta.title.split(":")[0]}</h3>
      <p class="text-gray-600">${meta.title.split(":")[1] ?? ""}</p>
    `;
    btn.addEventListener("click", () => {
      // dispara evento para o form renderizar a meta
      window.dispatchEvent(new CustomEvent("open-form", { detail: { metaKey: key } }));
      showView("form");
    });
    grid.appendChild(btn);
  });
}

function setupNav() {
  byId("nav-dashboard").addEventListener("click", () => showView("dashboard"));
  byId("nav-metas").addEventListener("click", () => showView("metas"));
}

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  renderMetasGrid();
});

export { showView };
