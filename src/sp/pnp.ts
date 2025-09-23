import { spfi, SPBrowser } from "@pnp/sp";
import { MSAL, MSALOptions } from "@pnp/msaljsclient";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/files";
import "@pnp/sp/folders";

// PREENCHA com os mesmos IDs do auth.ts
const TENANT_ID = "7cf881e5-5436-4a63-bbbb-0be177900711";
const CLIENT_ID = "d3800297-e145-4b6b-b3e3-d427676204aa";
const siteUrl = "https://reblinfelipe.sharepoint.com/sites/segpaciente";

const options: MSALOptions = {
  configuration: {
    auth: {
      authority: `https://login.microsoftonline.com/${TENANT_ID}/`,
      clientId: CLIENT_ID
    }
  },
  authParams: {
    scopes: ["https://reblinfelipe.sharepoint.com/.default"], // usa permissões concedidas ao SPO
    forceRefresh: false
  }
};

export const sp = spfi(siteUrl).using(SPBrowser(), MSAL(options));
