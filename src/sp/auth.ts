// src/sp/auth.ts
import {
  PublicClientApplication,
  type Configuration,
  type PopupRequest,
  type RedirectRequest,
  BrowserCacheLocation,
} from "@azure/msal-browser";

// ---- lê do seu .env.local ----
const CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID as string;
const TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID as string;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI as string;
// pode ser uma lista separada por vírgula: ex. "User.Read,https://.../AllSites.FullControl"
const RAW_SCOPES = (import.meta.env.VITE_SP_SCOPE as string) || "User.Read";

const SCOPES = RAW_SCOPES.split(",").map(s => s.trim()).filter(Boolean);

// ---- configuração MSAL v3 ----
const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: REDIRECT_URI,
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage, // evita perder sessão em refresh
    storeAuthStateInCookie: false,
  },
};

let pca: PublicClientApplication | null = null;
let initPromise: Promise<void> | null = null;

export function initializeAuth(): Promise<void> {
  if (!pca) pca = new PublicClientApplication(msalConfig);
  if (!initPromise) initPromise = pca.initialize(); // v3: obrigatório aguardar
  return initPromise;
}

// request base (popup/redirect)
const baseRequest: PopupRequest | RedirectRequest = { scopes: SCOPES };

export async function login() {
  await initializeAuth();
  if (!pca) throw new Error("MSAL não inicializado");

  const accounts = pca.getAllAccounts();
  if (accounts.length === 0) {
    // use redirect se preferir (produção); popup facilita em dev
    await pca.loginPopup(baseRequest);
  } else {
    pca.setActiveAccount(accounts[0]);
  }
}

export async function logout() {
  await initializeAuth();
  if (!pca) return;
  const account = pca.getActiveAccount() || pca.getAllAccounts()[0];
  await pca.logoutPopup({ account });
}

export async function getToken(
  scopes: string[] = SCOPES
): Promise<string> {
  await initializeAuth();
  if (!pca) throw new Error("MSAL não inicializado");

  let account = pca.getActiveAccount();
  if (!account) {
    const accounts = pca.getAllAccounts();
    if (accounts.length) {
      account = accounts[0];
      pca.setActiveAccount(account);
    } else {
      await login();
      account = pca.getActiveAccount()!;
    }
  }

  try {
    const r = await pca.acquireTokenSilent({ account, scopes });
    return r.accessToken;
  } catch {
    const r = await pca.acquireTokenPopup({ account, scopes });
    return r.accessToken;
  }
}

export function getActiveAccount() {
  return pca?.getActiveAccount() ?? null;
}
