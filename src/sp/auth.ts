import {
  PublicClientApplication,
  type Configuration,
  type PopupRequest,
  type RedirectRequest,
  BrowserCacheLocation,
} from "@azure/msal-browser";

/** Lidos do seu .env.local (mantendo exatamente os nomes que você usa) */
const CLIENT_ID     = import.meta.env.VITE_AZURE_CLIENT_ID as string;
const TENANT_ID     = import.meta.env.VITE_AZURE_TENANT_ID as string;
const APP_REDIRECT  = import.meta.env.VITE_REDIRECT_URI as string; // ex.: http://localhost:5173
const RAW_SCOPES    = (import.meta.env.VITE_SP_SCOPE as string) || "User.Read";

/** Página mínima para fluxos popup/silent (fica em /public) */
const POPUP_REDIRECT = `${location.origin}/auth-popup.html`;

/** Pode ser 1 escopo ou lista separada por vírgulas */
const SCOPES = RAW_SCOPES.split(",").map(s => s.trim()).filter(Boolean);

/** MSAL v3 */
const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: APP_REDIRECT, // redirect padrão (top-level)
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage, // persiste sessão no refresh
    storeAuthStateInCookie: false,
  },
};

let pca: PublicClientApplication | null = null;
let initPromise: Promise<void> | null = null;

/** Utilitário para avisar o app que o estado de auth mudou */
function dispatchAuthChanged() {
  const account = pca?.getActiveAccount() || null;
  window.dispatchEvent(new CustomEvent("auth:changed", { detail: { account } }));
}

export function initializeAuth(): Promise<void> {
  if (!pca) pca = new PublicClientApplication(msalConfig);
  if (!initPromise) {
    initPromise = pca.initialize().then(async () => {
      // Processa retornos de redirect (login/acquire/logout)
      try {
        const res = await pca!.handleRedirectPromise();
        if (res?.account) {
          pca!.setActiveAccount(res.account);
        }
      } catch (e) {
        console.warn("[auth] handleRedirectPromise falhou:", e);
      } finally {
        dispatchAuthChanged();
      }
    });
  }
  return initPromise;
}

const popupRequest: PopupRequest = {
  scopes: SCOPES,
  redirectUri: POPUP_REDIRECT, // recomendado para popup/silent
};

const redirectRequest: RedirectRequest = {
  scopes: SCOPES,
  redirectUri: APP_REDIRECT,
};

export async function login(): Promise<void> {
  console.debug("[auth] login() clicado");
  await initializeAuth();
  if (!pca) throw new Error("MSAL não inicializado");

  const accts = pca.getAllAccounts();
  if (accts.length > 0) {
    // Já tem conta em cache: garante ativa, tenta token e avisa app
    pca.setActiveAccount(accts[0]);
    try {
      await pca.acquireTokenSilent({ account: accts[0], scopes: SCOPES });
    } catch {
      try {
        await pca.acquireTokenPopup({ account: accts[0], scopes: SCOPES, redirectUri: POPUP_REDIRECT });
      } catch (e) {
        console.warn("[auth] acquireTokenPopup falhou, tentando loginRedirect…", e);
        await pca.loginRedirect(redirectRequest);
        return; // volta pelo redirect
      }
    }
    dispatchAuthChanged();
    return;
  }

  // Sem conta: tenta popup; se falhar (bloqueio/COOP), cai para redirect
  try {
    await pca.loginPopup(popupRequest);
  } catch (err) {
    console.warn("[auth] loginPopup falhou, tentando loginRedirect…", err);
    await pca.loginRedirect(redirectRequest);
    return;
  }

  // popup ok
  const account = pca.getAllAccounts()[0] || null;
  if (account) pca.setActiveAccount(account);
  dispatchAuthChanged();
}

export async function logout(): Promise<void> {
  await initializeAuth();
  if (!pca) return;

  const account = pca.getActiveAccount() || pca.getAllAccounts()[0] || undefined;

  try {
    // postLogoutRedirectUri (logoutPopup/logoutRedirect aceitam essa prop)
    await pca.logoutPopup({ account, postLogoutRedirectUri: POPUP_REDIRECT });
  } catch {
    await pca.logoutRedirect({ account, postLogoutRedirectUri: APP_REDIRECT });
    return; // volta pelo redirect
  }

  dispatchAuthChanged();
}

export async function getToken(scopes: string[] = SCOPES): Promise<string> {
  await initializeAuth();
  if (!pca) throw new Error("MSAL não inicializado");

  let account = pca.getActiveAccount();
  if (!account) {
    const accts = pca.getAllAccounts();
    if (accts.length) {
      account = accts[0];
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
    try {
      const r = await pca.acquireTokenPopup({ account, scopes, redirectUri: POPUP_REDIRECT });
      return r.accessToken;
    } catch (e) {
      console.warn("[auth] acquireTokenPopup falhou, tentando acquireTokenRedirect…", e);
      await pca.acquireTokenRedirect({ account, scopes, redirectUri: APP_REDIRECT });
      return ""; // no redirect, o token será processado em handleRedirectPromise
    }
  }
}

/** Compat com código legado (pnp.ts) */
export async function acquireSpToken(scopes: string[] = SCOPES): Promise<string> {
  return getToken(scopes);
}

export function getActiveAccount() {
  return pca?.getActiveAccount() ?? null;
}

export function isAuthenticated(): boolean {
  return !!pca?.getActiveAccount();
}

/** Permite assinar mudanças de auth sem acoplar módulos */
export function onAuthChanged(cb: (account: ReturnType<typeof getActiveAccount>) => void) {
  window.addEventListener("auth:changed", (e: Event) => {
    //
    cb((e as CustomEvent).detail?.account ?? null);
  });
}
