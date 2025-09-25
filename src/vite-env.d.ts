// src/vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_AAD_TENANT_ID: string
  readonly VITE_AAD_CLIENT_ID: string
  readonly VITE_REDIRECT_URI: string

  readonly VITE_SP_ORIGIN: string
  readonly VITE_SP_SITE: string

  readonly VITE_SP_LIST_AUDITORIAS: string
  readonly VITE_SP_GROUP_ADMINS: string
  readonly VITE_SP_GROUP_USERS: string
}
interface ImportMeta { readonly env: ImportMetaEnv }
