// src/sp/pnp.ts
import { spfi, SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import { Queryable } from "@pnp/queryable";
import { acquireSpToken } from "./auth";

/** Behavior que injeta sempre o Bearer Token mais recente antes de cada request */
function MsalAuth() {
  return (instance: Queryable) => {
    instance.on.auth(async (url, init) => {
      const token = await acquireSpToken();
      init.headers = {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
      };
      return [url, init];
    });
    return instance;
  };
}

let _sp: SPFI | null = null;

export function getSp(): SPFI {
  if (_sp) return _sp;
  const baseUrl = import.meta.env.VITE_SP_SITE; // ex: https://{tenant}.sharepoint.com/sites/segpaciente
  _sp = spfi(baseUrl).using(MsalAuth());
  return _sp;
}
