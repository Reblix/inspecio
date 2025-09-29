// src/ui/admin.ts
import { getCurrentUser } from "../sp/user";

/**
 * Controla a visibilidade de elementos que são apenas para Admins,
 * como o filtro de auditores na galeria.
 */
async function configureAdminUI() {
  const wrapAuditorFilter = document.getElementById("f-auditor-wrap");

  try {
    const me = await getCurrentUser();
    
    // Se o usuário for admin, mostra o filtro. Senão, esconde.
    if (me?.isAdmin) {
      wrapAuditorFilter?.classList.remove("hidden");
    } else {
      wrapAuditorFilter?.classList.add("hidden");
    }
  } catch {
    // Se falhar ao obter o usuário, esconde por segurança.
    wrapAuditorFilter?.classList.add("hidden");
  }
}

// Garante que a função seja executada quando o app carregar
configureAdminUI();