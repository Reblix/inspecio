// src/sp/user.ts
import { getSp } from "./pnp";             // <- em vez de { sp }
import "@pnp/sp/site-users/web";
import "@pnp/sp/site-groups/web";

export type AppUser = {
  id: number;
  email: string;
  loginName: string;
  displayName: string;
  isAdmin: boolean;
};

export async function getCurrentUser(): Promise<AppUser> {
  const sp = await getSp();                // <- pega a instância autenticada

  // usuário atual
  const u = await sp.web.currentUser();    // { Id, Email, LoginName, Title, ... }

  // grupos do usuário
  const groups = await sp.web.currentUser.groups(); // [{ Title, Id, ... }]
  const isAdmin = groups.some(g => g.Title === import.meta.env.VITE_SP_GROUP_ADMINS);

  return {
    id: u.Id,
    email: u.Email,
    loginName: u.LoginName,
    displayName: u.Title,
    isAdmin,
  };
}
