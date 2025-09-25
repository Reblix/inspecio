/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Aceita os dois padrões (AZURE ou AAD) para evitar quebra
  readonly VITE_AZURE_CLIENT_ID?: string;
  readonly VITE_AAD_CLIENT_ID?: string;

  readonly VITE_AZURE_TENANT_ID?: string;
  readonly VITE_AAD_TENANT_ID?: string;

  readonly VITE_REDIRECT_URI?: string;

  // Escopo de SharePoint, ex.: https://SEU_TENANT.sharepoint.com/AllSites.FullControl
  readonly VITE_SP_SCOPE?: string;

  // (opcionais, mas úteis no resto do app)
  readonly VITE_SP_SITE?: string;
  readonly VITE_SP_ORIGIN?: string;
  readonly VITE_SP_GROUP_ADMINS?: string;
  readonly VITE_SP_GROUP_USERS?: string;
  readonly VITE_SP_LIST_AUDITORIAS?: string;
  readonly VITE_SP_LIST_RESPOSTAS?: string;
  readonly VITE_SP_LIB_FOTOS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
