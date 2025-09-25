// src/sp/pnp.ts
import { spfi, DefaultHeaders } from "@pnp/sp";
import { BearerToken } from "@pnp/queryable";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { getAccessTokenSP } from "./auth";

const SP_SITE = import.meta.env.VITE_SP_SITE; // https://TENANT.sharepoint.com/sites/segpaciente

export async function getSp() {
  const token = await getAccessTokenSP();
  return spfi(SP_SITE).using(DefaultHeaders(), BearerToken(token));
}
