import {
  PublicClientApplication,
  EventType,
  AuthenticationResult,
  AccountInfo,
  InteractionRequiredAuthError,
  PopupRequest,
  BrowserSystemOptions,
} from "@azure/msal-browser";

// --- Validação das Variáveis de Ambiente ---
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

// --- Configuração da MSAL ---
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
    asyncPopups: true
  } as BrowserSystemOptions,
});

// --- Definição dos Escopos ---
const loginRequest: PopupRequest = {
  scopes: ["User.Read"],
};

const spOrigin = new URL(spSiteUrl).origin;
const tokenRequest: PopupRequest = {
  scopes: [`${spOrigin}/.default`],
};

// --- Funções de Login e Logout ---
export async function login() {
  await msal.initialize();
  try {
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

// --- Função para Obter Tokens de Acesso para o SharePoint ---
export async function acquireSpToken() {
  await msal.initialize();
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
    throw error;
  }
}