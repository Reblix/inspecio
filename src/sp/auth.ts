import { PublicClientApplication, InteractionRequiredAuthError, AccountInfo } from "@azure/msal-browser";

const pca = new PublicClientApplication({
  auth: {
    clientId: import.meta.env.VITE_AAD_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AAD_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URI,
  },
  cache: { cacheLocation: "localStorage", storeAuthStateInCookie: true },
});

// pedimos token do RECURSO SharePoint (não Graph):
const SP_ORIGIN = import.meta.env.VITE_SP_ORIGIN; // ex.: https://<tenant>.sharepoint.com
const SP_SCOPES = [`${SP_ORIGIN}/AllSites.FullControl`];

export async function initAuth() {
  await pca.initialize();
  // ESSENCIAL no fluxo redirect: tratar a volta SEMPRE no load
  await pca.handleRedirectPromise();  // ← evita a “tela morta” após #code
  const acct = pca.getAllAccounts()[0];
  if (acct) pca.setActiveAccount(acct);
}

export function login() {
  return pca.loginRedirect({ scopes: SP_SCOPES }); // redirect evita popup bloqueada
}

export function logout() {
  const acc = pca.getActiveAccount() ?? pca.getAllAccounts()[0];
  return pca.logoutRedirect({ account: acc ?? undefined });
}

function active(): AccountInfo | null {
  return pca.getActiveAccount() ?? pca.getAllAccounts()[0] ?? null;
}

export async function getAccessTokenSP(): Promise<string> {
  const account = active();
  if (!account) throw new Error("Sem sessão");
  try {
    const r = await pca.acquireTokenSilent({ account, scopes: SP_SCOPES });
    return r.accessToken;
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) {
      await pca.acquireTokenRedirect({ scopes: SP_SCOPES });
      return ""; // voltará via redirect
    }
    throw e;
  }
}
