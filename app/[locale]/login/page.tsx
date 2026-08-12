import { LoginForm } from "@/components/auth/login-form"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { Locale } from "@/i18n/config"
import { getTurnstileConfig } from "@/lib/turnstile"
import { getActiveTemplateId } from "@/lib/site-config"
import { resolvePreviewTemplateId } from "@/lib/template-preview"
import { TemplateSync } from "@/components/template/template-sync"

export const runtime = "edge"

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  const session = await auth()
  
  if (session?.user) {
    redirect(`/${locale}`)
  }

  const turnstile = await getTurnstileConfig()
  const activeTemplateId = await getActiveTemplateId()
  const query = await searchParams
  const templateId = await resolvePreviewTemplateId(query, activeTemplateId)

  return (
    <>
      <TemplateSync templateId={templateId} />
      <div className="app-bg relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-grid-neon opacity-60" />
        <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-primary/10 to-transparent" />
        <LoginForm turnstile={{ enabled: turnstile.enabled, siteKey: turnstile.siteKey }} />
      </div>
    </>
  )
}
