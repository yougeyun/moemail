/// <reference types="@cloudflare/workers-types" />


declare global {
  interface CloudflareEnv {
    DB: D1Database;
    SITE_CONFIG: KVNamespace;
  }

  interface Window {
    turnstile?: {
      render: (element: HTMLElement | string, options: Record<string, unknown>) => string
      reset: (widgetId?: string) => void
      remove: (widgetId: string) => void
    }
  }

  type Env = CloudflareEnv
}

declare module "next-auth" {
  interface User {
    roles?: {
      name: string
      displayName?: string | null
      icon?: string | null
      price?: number
      purchasable?: boolean
      maxEmails?: number | null
      allowedDomains?: string[] | null
      allowedExpiries?: number[] | null
      defaultExpiry?: number | null
      permissions?: string[]
    }[]
    username?: string | null
    providers?: string[]
  }

  interface Session {
    user: User
  }
}

export type { Env }
