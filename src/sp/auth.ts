import {
  PublicClientApplication,
  InteractionRequiredAuthError,
  PopupRequest,
  BrowserSystemOptions,
} from "@azure/msal-browser";

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
const spSiteUrl = import.meta.env.VITE_SP_SITE;

if (!clientId || !tenantId || !spSiteUrl) {
  const msg = `[auth] Variáveis de ambiente faltando. Verifique seu .env.local`;
  alert(msg);
  throw new Error(msg);
}

export const msal = new PublicClientApplication({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
});

const loginRequest: PopupRequest = {
  scopes: ["User.Read"],
};

const spOrigin = new URL(spSiteUrl).origin;
const tokenRequest: PopupRequest = {
  scopes: [`${spOrigin}/.default`],
};

export function login() {
  msal.loginRedirect(loginRequest).catch((error) => {
    console.error("Falha no login por redirecionamento:", error);
  });
}

export function logout() {
  const account = msal.getActiveAccount();
  if (account) {
    msal.logoutRedirect({ account }).catch((error) => {
      console.error("Falha no logout:", error);
    });
  }
}

export async function acquireSpToken(): Promise<string> {
  const account = msal.getActiveAccount();
  if (!account) {
    throw new Error("Usuário não autenticado. Não é possível obter o token.");
  }
  
  const request = { ...tokenRequest, account };

  try {
    const response = await msal.acquireTokenSilent(request);
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      console.warn("Aquisição silenciosa de token falhou. Redirecionando...");
      msal.acquireTokenRedirect(request);
    }
    // Retorna uma promessa que nunca resolve, pois a página será redirecionada.
    return new Promise(() => {});
  }
}