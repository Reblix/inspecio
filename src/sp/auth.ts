import { PublicClientApplication, EventType } from "@azure/msal-browser";

// PREENCHA com seus IDs verdadeiros
const tenantId = "7cf881e5-5436-4a63-bbbb-0be177900711";
const clientId = "d3800297-e145-4b6b-b3e3-d427676204aa";
const siteOrigin = "https://reblinfelipe.sharepoint.com";

export const msal = new PublicClientApplication({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin
  },
  cache: { cacheLocation: "localStorage" }
});

msal.addEventCallback((ev) => {
  if (ev.eventType === EventType.LOGIN_SUCCESS && ev.payload?.account) {
    msal.setActiveAccount(ev.payload.account);
  }
});

export async function login() {
  await msal.loginRedirect({
    scopes: [`${siteOrigin}/.default`, "Sites.ReadWrite.All"]
  });
}

export function logout() {
  const account = msal.getActiveAccount();
  return msal.logoutRedirect({ account });
}
