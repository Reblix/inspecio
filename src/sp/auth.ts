import {
  PublicClientApplication,
  EventType,
  AuthenticationResult,
  AccountInfo,
  InteractionRequiredAuthError,
  PopupRequest,
  BrowserSystemOptions
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
  
  const msg = `[auth] Variáveis de ambiente faltando em .env.local: ${missing}. A aplicação não poderá se autenticar.`;
  console.error(msg);
  alert(msg);
  throw new Error(msg);
}

// --- Configuração da MSAL ---
const authority = `https://login.microsoftonline.com/${tenantId}`;
const redirectUri = window.location.origin + "/";

export const msal = new PublicClientApplication({
  auth: {
    clientId: clientId,
    authority: authority,
    redirectUri: redirectUri,
    postLogoutRedirectUri: redirectUri,
    navigateToLoginRequestUrl: false, // Previne loops de redirecionamento
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    iframeHashTimeout: 10000,
    // Garante que popups de autenticação funcionem de forma mais suave em navegadores modernos.
    asyncPopups: true 
  } as BrowserSystemOptions
});

// --- Definição dos Escopos ---
const loginRequest: PopupRequest = {
  scopes: ["User.Read"],
};

const tokenRequest: PopupRequest = {
  // O escopo ".default" é a forma recomendada de solicitar acesso
  // a todas as permissões delegadas concedidas ao aplicativo no Azure AD.
  scopes: [`${spSiteUrl}/.default`],
};

// --- Gerenciamento de Estado de Autenticação ---
const subscribers = new Set<(account: AccountInfo | null) => void>();

export function onAuthChanged(cb: (account: AccountInfo | null) => void) {
  subscribers.add(cb);
  cb(msal.getActiveAccount());
  return () => subscribers.delete(cb);
}

const notify = (account: AccountInfo | null) => subscribers.forEach((cb) => cb(account));

export function isAuthenticated() {
  return !!msal.getActiveAccount();
}

export async function initializeAuth() {
  // CORREÇÃO: Adiciona a chamada de inicialização explícita e aguarda.
  // Isso resolve o erro "uninitialized_public_client_application".
  await msal.initialize();

  // Processa qualquer resposta de um fluxo de redirecionamento
  await msal.handleRedirectPromise();

  // Define a conta ativa se já existir uma sessão
  const accounts = msal.getAllAccounts();
  if (accounts.length > 0) {
    msal.setActiveAccount(accounts[0]);
  }

  // Ouve por eventos de login/logout para manter a UI sincronizada
  msal.addEventCallback((event) => {
    let account: AccountInfo | null = null;
    if (
      event.eventType === EventType.LOGIN_SUCCESS &&
      (event.payload as AuthenticationResult).account
    ) {
      account = (event.payload as AuthenticationResult).account;
      msal.setActiveAccount(account);
    } else if (event.eventType === EventType.LOGOUT_SUCCESS) {
      msal.setActiveAccount(null);
    }
    notify(msal.getActiveAccount());
  });
}

// --- Funções de Login e Logout ---
export async function login() {
  try {
    await msal.loginPopup(loginRequest);
  } catch (error) {
    console.error("Login por popup falhou, tentando por redirecionamento:", error);
    msal.loginRedirect(loginRequest);
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
  const account = msal.getActiveAccount();
  if (!account) {
    throw new Error("Usuário não autenticado. Não é possível obter o token.");
  }
  
  const request = { ...tokenRequest, account };

  try {
    // Tenta obter o token silenciosamente
    const response = await msal.acquireTokenSilent(request);
    return response.accessToken;
  } catch (error) {
    // Se falhar, tenta com um popup (interação do usuário necessária)
    if (error instanceof InteractionRequiredAuthError) {
      try {
        const response = await msal.acquireTokenPopup(request);
        return response.accessToken;
      } catch (popupError) {
        console.error("Falha ao obter token via popup:", popupError);
        // Como último recurso, tenta por redirecionamento
        msal.acquireTokenRedirect(request);
        return ""; // A página será redirecionada
      }
    }
    console.error("Erro não interativo ao adquirir token:", error);
    throw error;
  }
}

