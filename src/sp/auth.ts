// src/sp/auth.ts
import {
  PublicClientApplication,
  EventType,
  AuthenticationResult,
  AccountInfo,
} from "@azure/msal-browser";

// ----- Config a partir do .env (tudo precisa começar com VITE_) -----
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID as string;
if (!clientId) {
  console.warn(
    "[auth] VITE_AZURE_CLIENT_ID ausente. Defina no .env.local para habilitar login."
  );
}

const authority =
  (import.meta.env.VITE_AZURE_AUTHORITY as string) ||
  (import.meta.env.VITE_AZURE_TENANT_ID
    ? `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`
    : "https://login.microsoftonline.com/common");

const redirectUri =
  (import.meta.env.VITE_AZURE_REDIRECT_URI as string) || window.location.origin;

const postLogoutRedirectUri =
  (import.meta.env.VITE_AZURE_POSTLOGOUT_REDIRECT_URI as string) ||
  window.location.origin;

const defaultLoginScopes: string[] =
  (import.meta.env.VITE_AZURE_LOGIN_SCOPES as string)?.split(",").map(s => s.trim()) ||
  ["User.Read"]; // escolha segura p/ teste

const defaultSpScopes: string[] =
  (import.meta.env.VITE_AZURE_SP_SCOPES as string)?.split(",").map(s => s.trim()) ||
  ["User.Read"]; // ajuste para as APIs que você realmente consome

export const msal = new PublicClientApplication({
  auth: { clientId, authority, redirectUri, postLogoutRedirectUri },
  cache: { cacheLocation: "localStorage", storeAuthStateInCookie: false },
});

let currentAccount: AccountInfo | null = null;
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach((cb) => cb());

export function onAuthChanged(cb: () => void) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export function isAuthenticated() {
  return !!(msal.getActiveAccount() ?? currentAccount);
}

export async function initializeAuth() {
  try {
    // Trata retorno de redirect, se houver
    const result = await msal.handleRedirectPromise();
    if (result?.account) {
      msal.setActiveAccount(result.account);
      currentAccount = result.account;
    }
  } catch (e) {
    console.error("[msal] handleRedirectPromise error", e);
  }

  // Seleciona uma conta ativa se já houver sessão
  const accounts = msal.getAllAccounts();
  if (!msal.getActiveAccount() && accounts.length > 0) {
    msal.setActiveAccount(accounts[0]);
    currentAccount = accounts[0];
  }

  // Mantém estado atualizado via eventos
  msal.addEventCallback((ev) => {
    if (
      ev.eventType === EventType.LOGIN_SUCCESS ||
      ev.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
    ) {
      const acc = (ev.payload as AuthenticationResult).account;
      if (acc) {
        msal.setActiveAccount(acc);
        currentAccount = acc;
        notify();
      }
    }
    if (ev.eventType === EventType.LOGOUT_SUCCESS) {
      currentAccount = null;
      notify();
    }
  });

  notify();
}

export async function login() {
  try {
    const result = await msal.loginPopup({ scopes: defaultLoginScopes });
    msal.setActiveAccount(result.account);
    currentAccount = result.account;
    notify();
  } catch (e: any) {
    // fallback se popup falhar (bloqueador, COOP etc.)
    await msal.loginRedirect({ scopes: defaultLoginScopes });
  }
}

export async function logout() {
  const account = msal.getActiveAccount() ?? currentAccount ?? undefined;
  try {
    await msal.logoutPopup({ account });
  } catch {
    await msal.logoutRedirect({ account });
  }
}

/**
 * Retorna um token (Graph/SharePoint/API) tentando primeiro em modo silencioso.
 * Alinhe os SCOPES no .env (VITE_AZURE_SP_SCOPES) de acordo com seu backend.
 */
export async function acquireSpToken(scopes?: string[]) {
  const request = {
    scopes: (scopes && scopes.length ? scopes : defaultSpScopes),
    account: msal.getActiveAccount() ?? currentAccount ?? msal.getAllAccounts()[0],
  };

  try {
    return await msal.acquireTokenSilent(request);
  } catch {
    try {
      return await msal.acquireTokenPopup(request);
    } catch {
      await msal.acquireTokenRedirect(request);
      return undefined; // redirect muda de página
    }
  }
}
