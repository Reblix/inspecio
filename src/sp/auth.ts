import {
  PublicClientApplication,
  AuthenticationResult,
  InteractionRequiredAuthError,
  PopupRequest,
  BrowserSystemOptions,
} from "@azure/msal-browser";

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
const spSiteUrl = import.meta.env.VITE_SP_SITE;

if (!clientId || !tenantId || !spSiteUrl) {
  const missing = [
    !clientId && "VITE_AZURE_CLIENT_ID",
    !tenantId && "VITE_AZURE_TENANT_ID",
    !spSiteUrl && "VITE_SP_SITE",
  ].filter(Boolean).join(", ");
  
  const msg = `[auth] Variáveis de ambiente faltando: ${missing}.`;
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
  system: {
    asyncPopups: true,
  } as BrowserSystemOptions,
});

const loginRequest: PopupRequest = {
  scopes: ["User.Read"],
};

const spOrigin = new URL(spSiteUrl).origin;
const tokenRequest: PopupRequest = {
  scopes: [`${spOrigin}/.default`],
};

export async function login() {
  try {
    // A inicialização agora é feita apenas no main.ts
    await msal.loginRedirect(loginRequest);
  } catch (error) {
    console.error("Falha no login por redirecionamento:", error);
  }
}

export async function logout() {
  const account = msal.getActiveAccount();
  if (account) {
    await msal.logoutRedirect({ account });
  }
}

export async function acquireSpToken() {
  // A inicialização agora é feita apenas no main.ts
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
      console.warn("Aquisição silenciosa de token falhou, tentando com redirecionamento.");
      msal.acquireTokenRedirect(request);
    }
    // Retorna uma promessa que nunca resolve, pois a página será redirecionada.
    // Isso evita que o código continue executando e gere mais erros.
    return new Promise(() => {});
  }
}