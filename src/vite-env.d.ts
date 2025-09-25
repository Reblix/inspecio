/// <reference types="vite/client" />

// (opcional) declare as suas variáveis para ter IntelliSense:
interface ImportMetaEnv {
  readonly VITE_AAD_TENANT_ID: string
  readonly VITE_AAD_CLIENT_ID: string
  readonly VITE_SHAREPOINT_SITE: string
  readonly VITE_SP_LIST_AUDITORIAS: string
  readonly VITE_SP_GROUP_ADMINS: string
  readonly VITE_SP_GROUP_USERS: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
