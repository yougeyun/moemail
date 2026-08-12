import { Header } from "@/components/layout/header"
import { ProfileCard } from "@/components/profile/profile-card"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { Locale } from "@/i18n/config"
import { getActiveTemplateId } from "@/lib/site-config"
import { resolvePreviewTemplateId } from "@/lib/template-preview"
import { TemplateSync } from "@/components/template/template-sync"

export const runtime = "edge"

export default async function ProfilePage({
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
  const activeTemplateId = await getActiveTemplateId()
  const query = await searchParams
  const templateId = await resolvePreviewTemplateId(query, activeTemplateId)

  return (
    <>
      <TemplateSync templateId={templateId} />
      <div className="app-bg relative min-h-screen">
        <div className="absolute inset-0 -z-10 bg-grid-neon opacity-40" />
        <div className="container mx-auto px-4 lg:px-8 max-w-[1080px]">
          <Header />
          <main className="pb-10 pt-8">
            <ProfileCard user={session.user} />
          </main>
        </div>
      </div>
    </>
  )
}

