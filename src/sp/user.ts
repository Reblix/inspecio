// src/sp/user.ts
import { getSp } from "./pnp";
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";
import "@pnp/sp/lists";
import "@pnp/sp/items";

// Variável de ambiente para o nome da lista de usuários
const LIST_USUARIOS = import.meta.env.VITE_SP_LIST_USUARIOS || "Usuarios";

export async function getCurrentUser() {
  const sp = getSp();

  // 1. Pega as informações do usuário autenticado pela Microsoft
  const me = await sp.web.currentUser();
  if (!me.Email) {
    throw new Error("Não foi possível obter o e-mail do usuário logado.");
  }

  let appPermission = "User"; // Permissão padrão é 'User'

  try {
    // 2. Busca o usuário na nossa lista de permissões pelo e-mail
    const userInList = await sp.web.lists.getByTitle(LIST_USUARIOS)
      .items
      .select("Permissao")
      .filter(`Login eq '${me.Email}'`) // Filtra pelo e-mail do usuário logado
      .top(1)();

    if (userInList.length > 0) {
      appPermission = userInList[0].Permissao;
    }
  } catch (e) {
    console.error(`Falha ao buscar permissões na lista '${LIST_USUARIOS}'. Verifique se a lista, a coluna 'Permissao' e a coluna 'Login' existem.`, e);
    // Em caso de falha, mantém a permissão como 'User' por segurança
  }

  return {
    id: me.Id,
    login: me.LoginName,
    email: me.Email,
    title: me.Title,
    isAdmin: appPermission === "Admin", // A propriedade 'isAdmin' agora vem da lista
  };
}