import { Header } from "@/components/layout/header"
import { ThreeColumnLayout } from "@/components/emails/three-column-layout"
import { NoPermissionDialog } from "@/components/no-permission-dialog"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import type { Locale } from "@/i18n/config"
import { getActiveTemplateId } from "@/lib/site-config"
import { resolvePreviewTemplateId } from "@/lib/template-preview"
import { TemplateSync } from "@/components/template/template-sync"

export const runtime = "edge"

export default async function MoePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  const session = await auth()
  
  if (!session?.user) {
    redirect(`/${locale}`)
  }

  const hasPermission = await checkPermission(PERMISSIONS.MANAGE_EMAIL)
  const activeTemplateId = await getActiveTemplateId()
  const query = await searchParams
  const templateId = await resolvePreviewTemplateId(query, activeTemplateId)

  return (
    <>
      <TemplateSync templateId={templateId} />
      <div className="app-bg relative h-screen">
        <div className="absolute inset-0 -z-10 bg-grid-neon opacity-40" />
        <div className="container mx-auto h-full max-w-[1440px] px-4 lg:px-8">
          <Header />
          <main className="h-full">
            <ThreeColumnLayout />
            {!hasPermission && <NoPermissionDialog />}
          </main>
        </div>
      </div>
    </>
  )
}

