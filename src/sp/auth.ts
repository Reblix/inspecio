// src/sp/auth.ts
import { PublicClientApplication, AccountInfo } from "@azure/msal-browser";

const CLIENT_ID =
  import.meta.env.VITE_AZURE_CLIENT_ID ?? import.meta.env.VITE_AAD_CLIENT_ID;
const TENANT_ID =
  import.meta.env.VITE_AZURE_TENANT_ID ?? import.meta.env.VITE_AAD_TENANT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || window.location.origin;

// Escopo para SPO (delegado). Ex.: https://seuTenant.sharepoint.com/AllSites.FullControl
const SP_SCOPE = import.meta.env.VITE_SP_SCOPE;

if (!CLIENT_ID || !TENANT_ID || !SP_SCOPE) {
  // Ajuda a identificar rapidamente problemas de .env ausente
  console.warn("Vars ausentes: CLIENT_ID/TENANT_ID/SP_SCOPE. Confira seu .env.local");
}

export const pca = new PublicClientApplication({
  auth: {
    clientId: CLIENT_ID!, // garantimos via .env; o "!" evita ruído de TS
    authority: `https://login.microsoftonline.com/${TENANT_ID!}`,
    redirectUri: REDIRECT_URI,
  },
  cache: { cacheLocation: "localStorage", storeAuthStateInCookie: false },
});

// --- Fluxo MSAL ---
export async function initAuth(): Promise<boolean> {
  await pca.initialize();
  const result = await pca.handleRedirectPromise().catch(() => null);
  if (result?.account) pca.setActiveAccount(result.account);
  return !!pca.getActiveAccount();
}

export async function login(): Promise<never> {
  await pca.loginRedirect({ scopes: [SP_SCOPE!] });
  throw new Error("redirecting");
}

export async function logout(): Promise<void> {
  const account = pca.getActiveAccount();
  await pca.logoutRedirect({ account });
}

export function getActiveAccount(): AccountInfo | null {
  return pca.getActiveAccount();
}

export async function acquireSpToken(): Promise<string> {
  const account = pca.getActiveAccount();
  if (!account) throw new Error("NO_ACCOUNT");
  try {
    const { accessToken } = await pca.acquireTokenSilent({
      account,
      scopes: [SP_SCOPE!],
    });
    return accessToken;
  } catch {
    await pca.acquireTokenRedirect({ account, scopes: [SP_SCOPE!] });
    throw new Error("redirecting");
  }
}
