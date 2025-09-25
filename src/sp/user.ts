// src/sp/user.ts
import { getSp } from "./pnp";
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";
import "@pnp/sp/site-groups/web";

export async function getCurrentUser() {
  const sp = getSp();
  const me = await sp.web.currentUser();
  const adminsGroup = import.meta.env.VITE_SP_GROUP_ADMINS;

  let isAdmin = false;
  if (adminsGroup) {
    try {
      const users = await sp.web.siteGroups.getByName(adminsGroup).users();
      isAdmin = !!users.find(u => u.LoginName === me.LoginName);
    } catch { /* grupo não existe ou sem permissão */ }
  }

  return {
    id: me.Id,
    login: me.LoginName,
    email: me.Email,
    title: me.Title,
    isAdmin,
  };
}
