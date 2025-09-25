// src/sp/user.ts
import { getSp } from "./pnp";
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
  const sp = await getSp();

  const u = await sp.web.currentUser(); // { Id, Email, LoginName, Title, ... }
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
