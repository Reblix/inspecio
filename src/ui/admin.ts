import { getCurrentUser } from "../sp/user";

// Envolvemos toda a lógica em uma função exportada
export function initializeAdminModule() {
  async function configureAdminUI() {
    const wrapAuditorFilter = document.getElementById("f-auditor-wrap");
    const adminNavButton = document.querySelector<HTMLElement>('[data-route="admin"]');

    try {
      const me = await getCurrentUser();
      
      if (me?.isAdmin) {
        wrapAuditorFilter?.classList.remove("hidden");
        adminNavButton?.classList.remove("hidden");
      } else {
        wrapAuditorFilter?.classList.add("hidden");
        adminNavButton?.classList.add("hidden");
      }
    } catch {
      wrapAuditorFilter?.classList.add("hidden");
      adminNavButton?.classList.add("hidden");
    }
  }

  // A função agora é chamada aqui dentro, quando o módulo for inicializado pelo main.ts
  configureAdminUI();
}