import {
  PublicClientApplication,
  EventType,
  AuthenticationResult,
  AccountInfo,
} from "@azure/msal-browser";

// PREENCHA com seus IDs reais (sem <>)
const tenantId = "7cf881e5-5436-4a63-bbbb-0be177900711";
const clientId = "d3800297-e145-4b6b-b3e3-d427676204aa";
const siteOrigin = "https://reblinfelipe.sharepoint.com";

export const msal = new PublicClientApplication({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: "localStorage" },
});

// Define a conta ativa ao logar (payload precisa de cast)
msal.addEventCallback((ev) => {
  if (ev.eventType === EventType.LOGIN_SUCCESS && ev.payload) {
    const result = ev.payload as AuthenticationResult; // cast necessário
    if (result.account) {
      msal.setActiveAccount(result.account);
    }
  }

  // (opcional) também ao adquirir token
  if (ev.eventType === EventType.ACQUIRE_TOKEN_SUCCESS && ev.payload) {
    const result = ev.payload as AuthenticationResult;
    if (result.account) {
      msal.setActiveAccount(result.account);
    }
  }
});

export async function login() {
  await msal.loginRedirect({
  scopes: ["https://reblinfelipe.sharepoint.com/AllSites.FullControl"]
});
}

export function logout() {
  const account: AccountInfo | null = msal.getActiveAccount();
  // se não houver conta ativa, faz logout genérico
  return account
    ? msal.logoutRedirect({ account })
    : msal.logoutRedirect();
}
